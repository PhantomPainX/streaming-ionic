import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';
import { AlertController, ModalController, NavController, Platform } from '@ionic/angular';
import { MysqlDatabaseService } from 'src/app/services/mysql-database.service';
import { UtilsService } from 'src/app/services/utils.service';
import { ActivatedRoute, NavigationExtras } from '@angular/router';
import { TermsPage } from 'src/app/modals/terms/terms.page';

import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { PreferencesService } from 'src/app/services/preferences/preferences.service';
import { PrivateUser } from 'src/app/classes/private-user/private-user';
import { UserGroups } from 'src/app/classes/user-groups/user-groups';
import { Subscription } from 'rxjs';

import { NativeBiometric, BiometricOptions } from "capacitor-native-biometric";
import { environment } from 'src/environments/environment.prod';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.page.html',
  styleUrls: ['./signin.page.scss'],
})
export class SigninPage implements OnInit {

  public formLogin: FormGroup;
  private isSubmitted: boolean = false;

  private isLogged: boolean = false;
  private isGuest: boolean = false;
  private openedByOtherPage: boolean = false;
  private userHasBiometricCredentials: boolean = false;
  private biometricCompatible: boolean = false;

  @ViewChild('toolbar', { read: ElementRef }) toolbar: ElementRef;

  // Subscriptions
  private routerSubscription: Subscription;

  constructor(private database: MysqlDatabaseService,
    private navCtrl: NavController,
    public formBuilder: FormBuilder,
    private utils: UtilsService,
    private route: ActivatedRoute,
    private platform: Platform,
    private modalCtrl: ModalController,
    private localStorage: PreferencesService,
    private alertCtrl: AlertController) {

    this.routerSubscription = this.route.queryParams.subscribe(params => {
      this.openedByOtherPage = params['openedByOtherPage'];
    });

    this.formLogin = this.formBuilder.group({
      email: ['', [
        Validators.required,
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
      ]]
    })
  }

  ngOnInit() {

    this.platform.ready().then(async () => {

      this.utils.setDefaultStatusBarColor();

      if (this.platform.is('mobileweb') || this.platform.is('desktop')) {
        GoogleAuth.initialize({
          clientId: '794391457634-hir3992fbb6tru79tm66gdog4v084bdg.apps.googleusercontent.com',
          scopes: ['profile', 'email'],
          grantOfflineAccess: true,
        });
      }

      this.localStorage.biometricCompatible().then(async res => {
        this.biometricCompatible = res;
        this.localStorage.userHasBiometricCredentials().then(async res => {
          this.userHasBiometricCredentials = res;
        });
      });

      this.isLogged = await this.localStorage.getLogged();
      this.isGuest = await this.localStorage.getGuest();
      if ((this.isLogged || this.isGuest) && !this.openedByOtherPage) {
        this.navCtrl.navigateRoot("/tablinks/home", { replaceUrl: true });
      }
    });
  }

  goToRegister() {
    this.navCtrl.navigateForward('/register', { animated: true, animationDirection: 'forward' });
  }

  async googleLogin() {
    const loader = await this.utils.createIonicLoader("Esperando a Google...");
    await loader.present();

    GoogleAuth.signIn().then(async data => {
      const response: any = data;
      const access_token = response.authentication.accessToken;

      await this.database.getGooglePeopleInfo(access_token, 'birthdays').then(async peopleResponse => {
        loader.dismiss();
        if (peopleResponse.birthdays) {
          var birthday = peopleResponse.birthdays[0].date; // day, month, year
  
          //calculamos la edad
          var ageDifMs = Date.now() - new Date(birthday.year, birthday.month - 1, birthday.day).getTime();
          var ageDate = new Date(ageDifMs); // miliseconds from epoch
          var age = Math.abs(ageDate.getUTCFullYear() - 1970);
  
          if (age < 13) {
            this.alertCtrl.create({
              header: "Lo sentimos",
              message: "Debes tener 13 años o más para poder usar la aplicación de DangoAnime",
              mode: 'ios',
              translucent: true,
              buttons: [
                {
                  text: "Aceptar",
                  role: "cancel"
                }
              ]
            }).then(alert => {
              alert.present();
            });
            return;
          }
        }
      }).catch(err => {
        loader.dismiss();
      });

      this.database.socialSignin(access_token, "Google").then(async res => {

        if (!res.user.is_active) {
          GoogleAuth.signOut();
          this.alertCtrl.create({
            header: "Baneado por " + res.user.user_extra.ban_admin.username,
            subHeader: "Motivo: " + res.user.user_extra.ban_reason + " (" + this.utils.formatDate(res.user.user_extra.ban_date) + ")",
            message: "Si crees que esto es un error, contacta con nosotros a través del correo electrónico contacto@dangoanime.com",
            mode: 'ios',
            translucent: true,
            buttons: [
              {
                text: "Aceptar",
                role: "cancel"
              }
            ]
          }).then(alert => {
            alert.present();
          });
          return;
        }

        let res_groups: any[] = res.user.groups;
        let user_groups = new UserGroups();
        
        if (res_groups.find(group => group == "Moderator")) {
          user_groups.moderator = true;
        } else {
          user_groups.moderator = false;
        }

        if (res_groups.find(group => group == "VIP")) {
          user_groups.vip = true;
        } else {
          user_groups.vip = false;
        }

        let user = new PrivateUser(
          res.user.id,
          res.user.username,
          res.user.email,
          res.user.first_name,
          res.user.last_name,
          res.user.token,
          res.user.is_active,
          res.user.is_staff,
          res.user.is_superuser,
          res.user.date_joined,
          res.user.last_login,
          res.user.created_with_google,
          user_groups,
          res.user.user_extra,
          res.user.reports
        );

        if (!user.user_extra.thirteen_age_coppa_compliant) {
          const alert = await this.alertCtrl.create({
            header: "¿Tienes 13 años o más?",
            message: "Necesitamos que confirmes que tienes 13 años o más para poder usar la aplicación de DangoAnime",
            mode: 'ios',
            translucent: true,
            buttons: [
              {
                text: "No",
                role: "cancel",
                handler: () => {
                  this.utils.showToast("Debes tener 13 años o más para poder usar la aplicación de DangoAnime", 2, true);
                }
              },
              {
                text: "Confirmar",
                handler: () => {
                  this.database.confirmThirteenAgeCoppaCompliant(user.token).then(async res => {
                    await this.utils.showToast("Has confirmado que tienes 13 años o más", 1, false);

                    this.localStorage.setGoogleLogin(true);

                    const userAcceptedTerms = await this.localStorage.getAcceptedTerms();

                    if (userAcceptedTerms) {
                      this.utils.showToast("Bienvenido " + user.username + "!", 1, true);
                      this.localStorage.setUser(user);
                      this.localStorage.setLogged(true);
                      this.localStorage.setGuest(false);

                      this.navCtrl.navigateRoot("/tablinks/home", { animated: true, animationDirection: 'forward', replaceUrl: true });
                    } else {
                      const modal = await this.modalCtrl.create({
                        component: TermsPage,
                        cssClass: 'fullscreenModal',
                        backdropDismiss: false,
                      });
                      await modal.present();
                      const { data } = await modal.onDidDismiss();
                      if (data.accepted) {
                        this.utils.showToast("Bienvenido " + user.username + "!", 1, true);
                        this.localStorage.setUser(user);
                        this.localStorage.setLogged(true);
                        this.localStorage.setGuest(false);

                        this.navCtrl.navigateRoot("/tablinks/home", { animated: true, animationDirection: 'forward', replaceUrl: true });
                      }
                    }
                  });
                }
              }
            ]
          })
          await alert.present();
          //check if user canceled the alert
          const { role } = await alert.onDidDismiss();
          if (role == "cancel") {
            return;
          }

          // Si ya ha aceptado coppa
        } else {
          this.localStorage.setGoogleLogin(true);

          const userAcceptedTerms = await this.localStorage.getAcceptedTerms();

          if (userAcceptedTerms) {
            this.utils.showToast("Bienvenido " + user.username + "!", 1, true);
            this.localStorage.setUser(user);
            this.localStorage.setLogged(true);
            this.localStorage.setGuest(false);

            this.navCtrl.navigateRoot("/tablinks/home", { animated: true, animationDirection: 'forward', replaceUrl: true });
          } else {
            const modal = await this.modalCtrl.create({
              component: TermsPage,
              cssClass: 'fullscreenModal',
              backdropDismiss: false,
            });
            await modal.present();
            const { data } = await modal.onDidDismiss();
            if (data.accepted) {
              this.utils.showToast("Bienvenido " + user.username + "!", 1, true);
              this.localStorage.setUser(user);
              this.localStorage.setLogged(true);
              this.localStorage.setGuest(false);

              this.navCtrl.navigateRoot("/tablinks/home", { animated: true, animationDirection: 'forward', replaceUrl: true });
            }
          }
        }

      }).catch(error => {
        console.log(error);
      });
    }).catch(error => {
      loader.dismiss();
    });
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  async login() {
    this.isSubmitted = true;
    if (this.formLogin.valid) {

      const loader = await this.utils.createIonicLoader("Iniciando sesión...");
      await loader.present();
      await this.database.signin(this.formLogin.value.email, this.formLogin.value.password).then(async res => {
        loader.dismiss();
        if (res.logged) {

          if (!res.user.is_active) {
            this.alertCtrl.create({
              header: "Baneado por " + res.user.user_extra.ban_admin.username,
              subHeader: "Motivo: " + res.user.user_extra.ban_reason + " (" + this.utils.formatDate(res.user.user_extra.ban_date) + ")",
              message: "Si crees que esto es un error, contacta con nosotros a través del correo electrónico contacto@dangoanime.com",
              mode: 'ios',
              translucent: true,
              buttons: [
                {
                  text: "Aceptar",
                  role: "cancel"
                }
              ]
            }).then(alert => {
              alert.present();
            });
            return;
          }

          let res_groups: any[] = res.user.groups;
          let user_groups = new UserGroups();
          
          if (res_groups.find(group => group == "Moderator")) {
            user_groups.moderator = true;
          } else {
            user_groups.moderator = false;
          }

          if (res_groups.find(group => group == "VIP")) {
            user_groups.vip = true;
          } else {
            user_groups.vip = false;
          }

          let user = new PrivateUser(
            res.user.id,
            res.user.username,
            res.user.email,
            res.user.first_name,
            res.user.last_name,
            res.user.token,
            res.user.is_active,
            res.user.is_staff,
            res.user.is_superuser,
            res.user.date_joined,
            res.user.last_login,
            res.user.created_with_google,
            user_groups,
            res.user.user_extra,
            res.user.reports
          );

          if (!user.user_extra.thirteen_age_coppa_compliant) {
            const alert = await this.alertCtrl.create({
              header: "¿Tienes 13 años o más?",
              message: "Necesitamos que confirmes que tienes 13 años o más para poder usar la aplicación de DangoAnime",
              mode: 'ios',
              translucent: true,
              buttons: [
                {
                  text: "No",
                  role: "cancel",
                  handler: async () => {
                    await this.utils.showToast("Debes tener 13 años o más para poder usar la aplicación de DangoAnime", 2, true);
                  }
                },
                {
                  text: "Confirmar",
                  handler: async () => {
                    await this.database.confirmThirteenAgeCoppaCompliant(user.token).then(async res => {
                      await this.utils.showToast("Has confirmado que tienes 13 años o más", 1, false);

                      const userAcceptedTerms = await this.localStorage.getAcceptedTerms();

                      if (userAcceptedTerms) {
                        this.utils.showToast("Bienvenido " + user.username + "!", 1, true);
                        this.localStorage.setUser(user);
                        this.localStorage.setLogged(true);
                        this.localStorage.setGuest(false);
                        if (this.biometricCompatible) {
                          this.setUserBioCredentials(this.formLogin.value.email, this.formLogin.value.password);
                        }

                        this.navCtrl.navigateRoot("/tablinks/home", { animated: true, animationDirection: 'forward', replaceUrl: true });
                      } else {
                        const modal = await this.modalCtrl.create({
                          component: TermsPage,
                          cssClass: 'fullscreenModal',
                          backdropDismiss: false,
                        });
                        await modal.present();
                        const { data } = await modal.onDidDismiss();
                        if (data.accepted) {
                          this.utils.showToast("Bienvenido " + user.username + "!", 1, true);
                          this.localStorage.setUser(user);
                          this.localStorage.setLogged(true);
                          this.localStorage.setGuest(false);
                          if (this.biometricCompatible) {
                            this.setUserBioCredentials(this.formLogin.value.email, this.formLogin.value.password);
                          }

                          this.navCtrl.navigateRoot("/tablinks/home", { animated: true, animationDirection: 'forward', replaceUrl: true });
                        }
                      }

                    });
                  }
                }
              ]
            })
            await alert.present();
            //check if user canceled the alert
            const { role } = await alert.onDidDismiss();
            if (role == "cancel") {
              return;
            }

          // Si ya ha aceptado coppa
          } else {
            const userAcceptedTerms = await this.localStorage.getAcceptedTerms();

            if (userAcceptedTerms) {
              this.utils.showToast("Bienvenido " + user.username + "!", 1, true);
              this.localStorage.setUser(user);
              this.localStorage.setLogged(true);
              this.localStorage.setGuest(false);
              if (this.biometricCompatible) {
                this.setUserBioCredentials(this.formLogin.value.email, this.formLogin.value.password);
              }

              this.navCtrl.navigateRoot("/tablinks/home", { animated: true, animationDirection: 'forward', replaceUrl: true });
            } else {
              const modal = await this.modalCtrl.create({
                component: TermsPage,
                cssClass: 'fullscreenModal',
                backdropDismiss: false,
              });
              await modal.present();
              const { data } = await modal.onDidDismiss();
              if (data.accepted) {
                this.utils.showToast("Bienvenido " + user.username + "!", 1, true);
                this.localStorage.setUser(user);
                this.localStorage.setLogged(true);
                this.localStorage.setGuest(false);
                if (this.biometricCompatible) {
                  this.setUserBioCredentials(this.formLogin.value.email, this.formLogin.value.password);
                }

                this.navCtrl.navigateRoot("/tablinks/home", { animated: true, animationDirection: 'forward', replaceUrl: true });
              }
            }
          }

        } else {
          loader.dismiss();
          this.utils.showToast("Credenciales incorrectas", 1, false);
        }
      }), error => {
        console.log(error);
        loader.dismiss();
        this.utils.showToast("Ocurrio un error", 2, false);
      }
    } else {
      return false;
    }
  }

  get errorControl() {
    return this.formLogin.controls;
  }

  close() {
    if (this.openedByOtherPage) {
      this.navCtrl.navigateBack("/tablinks/home", { animated: true, animationDirection: 'back', replaceUrl: true });
    } else {
      this.navCtrl.back();
    }
  }

  setUserBioCredentials(email: string, password: string) {
    NativeBiometric.setCredentials({
      username: email,
      password: password,
      server: environment.root_url,
    }).then(() => {
      this.localStorage.setUserHasBiometricCredentials(true);
    });
  }

  async biometricLogin() {
    const credentials = await NativeBiometric.getCredentials({
      server: environment.root_url,
    });
    const options: BiometricOptions = {
      reason: "Inicia sesión a tu última cuenta",
      title: "Iniciar sesión",
      subtitle: "Cuenta: "+credentials.username,
      description: "Accede a tu última cuenta ingresada de una forma más rápida y segura",
      maxAttempts: 6,
      useFallback: true,
      negativeButtonText: "Cancelar"
    }
    NativeBiometric.verifyIdentity(options).then(async () => {

      const loader = await this.utils.createIonicLoader("Iniciando sesión...");
      await loader.present();
      await this.database.signin(credentials.username, credentials.password).then(async res => {
        loader.dismiss();
        if (res.logged) {

          if (!res.user.is_active) {
            this.alertCtrl.create({
              header: "Baneado por " + res.user.user_extra.ban_admin.username,
              subHeader: "Motivo: " + res.user.user_extra.ban_reason + " (" + this.utils.formatDate(res.user.user_extra.ban_date) + ")",
              message: "Si crees que esto es un error, contacta con nosotros a través del correo electrónico contacto@dangoanime.com",
              mode: 'ios',
              translucent: true,
              buttons: [
                {
                  text: "Aceptar",
                  role: "cancel"
                }
              ]
            }).then(alert => {
              alert.present();
            });
            return;
          }

          let res_groups: any[] = res.user.groups;
          let user_groups = new UserGroups();
          
          if (res_groups.find(group => group == "Moderator")) {
            user_groups.moderator = true;
          } else {
            user_groups.moderator = false;
          }

          if (res_groups.find(group => group == "VIP")) {
            user_groups.vip = true;
          } else {
            user_groups.vip = false;
          }

          let user = new PrivateUser(
            res.user.id,
            res.user.username,
            res.user.email,
            res.user.first_name,
            res.user.last_name,
            res.user.token,
            res.user.is_active,
            res.user.is_staff,
            res.user.is_superuser,
            res.user.date_joined,
            res.user.last_login,
            res.user.created_with_google,
            user_groups,
            res.user.user_extra,
            res.user.reports
          );

          if (!user.user_extra.thirteen_age_coppa_compliant) {
            const alert = await this.alertCtrl.create({
              header: "¿Tienes 13 años o más?",
              message: "Necesitamos que confirmes que tienes 13 años o más para poder usar la aplicación de DangoAnime",
              mode: 'ios',
              translucent: true,
              buttons: [
                {
                  text: "No",
                  role: "cancel",
                  handler: async () => {
                    await this.utils.showToast("Debes tener 13 años o más para poder usar la aplicación de DangoAnime", 2, true);
                  }
                },
                {
                  text: "Confirmar",
                  handler: async () => {
                    await this.database.confirmThirteenAgeCoppaCompliant(user.token).then(async res => {
                      await this.utils.showToast("Has confirmado que tienes 13 años o más", 1, false);

                      const userAcceptedTerms = await this.localStorage.getAcceptedTerms();

                      if (userAcceptedTerms) {
                        this.utils.showToast("Bienvenido " + user.username + "!", 1, true);
                        this.localStorage.setUser(user);
                        this.localStorage.setLogged(true);
                        this.localStorage.setGuest(false);

                        this.navCtrl.navigateRoot("/tablinks/home", { animated: true, animationDirection: 'forward', replaceUrl: true });
                      } else {
                        const modal = await this.modalCtrl.create({
                          component: TermsPage,
                          cssClass: 'fullscreenModal',
                          backdropDismiss: false,
                        });
                        await modal.present();
                        const { data } = await modal.onDidDismiss();
                        if (data.accepted) {
                          this.utils.showToast("Bienvenido " + user.username + "!", 1, true);
                          this.localStorage.setUser(user);
                          this.localStorage.setLogged(true);
                          this.localStorage.setGuest(false);

                          this.navCtrl.navigateRoot("/tablinks/home", { animated: true, animationDirection: 'forward', replaceUrl: true });
                        }
                      }

                    });
                  }
                }
              ]
            })
            await alert.present();
            //check if user canceled the alert
            const { role } = await alert.onDidDismiss();
            if (role == "cancel") {
              return;
            }

          // Si ya ha aceptado coppa
          } else {
            const userAcceptedTerms = await this.localStorage.getAcceptedTerms();

            if (userAcceptedTerms) {
              this.utils.showToast("Bienvenido " + user.username + "!", 1, true);
              this.localStorage.setUser(user);
              this.localStorage.setLogged(true);
              this.localStorage.setGuest(false);

              this.navCtrl.navigateRoot("/tablinks/home", { animated: true, animationDirection: 'forward', replaceUrl: true });
            } else {
              const modal = await this.modalCtrl.create({
                component: TermsPage,
                cssClass: 'fullscreenModal',
                backdropDismiss: false,
              });
              await modal.present();
              const { data } = await modal.onDidDismiss();
              if (data.accepted) {
                this.utils.showToast("Bienvenido " + user.username + "!", 1, true);
                this.localStorage.setUser(user);
                this.localStorage.setLogged(true);
                this.localStorage.setGuest(false);

                this.navCtrl.navigateRoot("/tablinks/home", { animated: true, animationDirection: 'forward', replaceUrl: true });
              }
            }
          }

        } else {
          loader.dismiss();
          NativeBiometric.deleteCredentials({
            server: environment.root_url,
          }).then(async () => {
            this.localStorage.setUserHasBiometricCredentials(false);
            this.userHasBiometricCredentials = false;
            const alert = await this.alertCtrl.create({
              header: "Credenciales incorrectas",
              message: "Estas credenciales probablemente fueron cambiadas. Por favor, inicia sesión normalmente",
              mode: 'ios',
              translucent: true,
              buttons: [
                {
                  text: "Aceptar",
                  role: "cancel",
                }
              ]
            });
            await alert.present();
          });
        }
      }), error => {
        console.log(error);
        loader.dismiss();
        this.utils.showToast("Ocurrio un error", 2, false);
      }

    });

  }

  async forgotAccount() {
    let navigationExtras: NavigationExtras = {
      queryParams: {
        openedByOtherPage: true
      }
    };
    this.navCtrl.navigateForward("/forgot-password", navigationExtras);
  }

  async register() {
    let navigationExtras: NavigationExtras = {
      queryParams: {
        openedByOtherPage: true
      }
    };
    this.navCtrl.navigateForward("/register", navigationExtras);
  }

}
