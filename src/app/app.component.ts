import { Component } from '@angular/core';
import { Platform, ToastController, ModalController, NavController, MenuController, AlertController } from '@ionic/angular';
import { Network } from '@capacitor/network';
import { LoaderPage } from './modals/loader/loader.page';
import { ScreenOrientation } from '@awesome-cordova-plugins/screen-orientation/ngx';
import { StatusBar, Style } from '@capacitor/status-bar';

import { Pipe, PipeTransform } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { NavigationExtras, Router } from '@angular/router';

import { UtilsService } from './services/utils.service';
import { PrivateUser } from './classes/private-user/private-user';
import { PreferencesService } from './services/preferences/preferences.service';

import { Browser } from '@capacitor/browser';
import { MysqlDatabaseService } from './services/mysql-database.service';
import { environment } from 'src/environments/environment.prod';
import { Subscription } from 'rxjs';
import { AppLauncher, CanOpenURLResult } from '@capacitor/app-launcher';

@Pipe({ name: 'safe' })
export class SafePipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) { }
  transform(url) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})

export class AppComponent {

  private toast: HTMLIonToastElement;
  private loader: HTMLIonModalElement;
  private user: PrivateUser;
  private domain: string = environment.root_url;
  private logged: boolean;
  private profileImage: string = "assets/icon/avatar.svg";
  private types: any = null;
  private status: any = null;
  private languages: any = null;

  private staticGenres: any = null;
  private genres: any = null;

  private staticYears: any[] = null;
  private years: any[] = null;

  private timeOnAppInterval: any;
  private timeOnApp: number = 0;

  // Subscriptions
  private routerSubscription: Subscription;
  //private backButtonSubscription: Subscription;

  constructor(private platform: Platform, private toastCtrl: ToastController, private modalCtrl: ModalController, 
    private screenOrientation: ScreenOrientation, private router: Router, private utils: UtilsService, private navCtrl: NavController, 
    private menu: MenuController, private localStorage: PreferencesService, private database: MysqlDatabaseService, private alertCtrl: AlertController) {
  }

  ngOnInit() {

    this.platform.ready().then(async () => {

      // this.timeOnApp = await this.localStorage.getTimeOnApp();
      // if (this.timeOnApp === null) {
      //   this.timeOnApp = 0;
      // }

      // this.timeOnAppInterval = setInterval(async () => {
      //   this.timeOnApp++;
      //   await this.localStorage.setTimeOnApp(this.timeOnApp);
      // }, 1000);

      //cada vez que se vaya a otra página, se obtiene el usuario
      this.routerSubscription = this.router.events.subscribe(async (event) => {
        if (event) {
          this.logged = await this.localStorage.getLogged();

          if (this.logged) {
            this.user = await this.localStorage.getUser();
            
            if (!this.user.user_extra.avatar.includes(this.domain)) {
                this.profileImage = this.domain + this.user.user_extra.avatar;
            } else {
                this.profileImage = this.user.user_extra.avatar;
            }
          }
        }
      });

      // this.backButtonSubscription = this.platform.backButton.subscribeWithPriority(-1, () => {
      //   const url = this.router.url;

      //   if (url === '/tablinks/home' || url === '/welcome' || url === '/tablinks/directorio' || url === '/tablinks/favorites' || url === '/tablinks/social-comments') {
      //     // App.exitApp();
      //   }
      // });

      if (this.platform.is('android') || this.platform.is('ios')) {
        this.screenOrientation.lock(this.screenOrientation.ORIENTATIONS.PORTRAIT);
      }

      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', async event => {
        const newColorScheme = event.matches ? "dark" : "light";
        
        if (newColorScheme === 'dark') {
          await StatusBar.setStyle({ style: Style.Dark });
          StatusBar.setBackgroundColor({ color: '#141414' });
        } else {
          await StatusBar.setStyle({ style: Style.Light });
          StatusBar.setBackgroundColor({ color: '#ffffff' });
        }
      });

      await Network.getStatus().then(async network => {
        if (network.connectionType === 'none') {
          await this.showIndeterminatedToast('Esperando una conexión...');
        }
      });
      // networkStatusChange is never fired
      await Network.addListener('networkStatusChange', async s => {
        console.log('networkStatusChange', s);

        if (s.connectionType === 'none') {
          if (this.toastCtrl.getTop()) {
            await this.showIndeterminatedToast('Esperando una conexión...');
          }
        } else {
          await this.toast.dismiss();
        }
      });

      this.database.getRecursiveData(this.domain + "/api/v1/genres/", []).then(async (genres) => {
        this.genres = genres;
        this.staticGenres = genres;
      });

      this.database.getRecursiveData(this.domain + "/api/v1/types/", []).then(async (types) => {
        this.types = types;
      });

      this.database.getRecursiveData(this.domain + "/api/v1/status/", []).then(async (status) => {
        this.status = status;
      });

      this.database.getRecursiveData(this.domain + "/api/v1/languages/", []).then(async (languages) => {
        this.languages = languages;
      });

      //add in years list from 1967 to current year
      this.years = [];
      for (let i = 1967; i <= new Date().getFullYear(); i++) {
        this.years.push(i);
      }
      this.years.reverse();
      this.staticYears = this.years;
    });
  }

  ngOnDestroy() {
    this.routerSubscription.unsubscribe();
    // this.backButtonSubscription.unsubscribe();
    window.removeEventListener('change', () => { console.log('change') });
    Network.removeAllListeners();
    clearInterval(this.timeOnAppInterval);
  }

  // private async showSplash() {
  //   await this.platform.ready();
    
  //   const lottie = (window as any).lottie;
  //   if (this.platform.is('ios') && lottie) {
  //     await lottie.splashscreen.hide();
  //     await lottie.splashscreen.show('public/assets/lottie/splash.json', false);
  //   }
  // }

  async showIndeterminatedToast(message: string) {
    this.toast = await this.toastCtrl.create({
      message: message,
      mode: 'ios',
    });
    return this.toast.present();
  }

  async showLoader() {
    this.loader = await this.modalCtrl.create({
      component: LoaderPage,
      cssClass: 'transparentModal',
      backdropDismiss: false
    });
    return this.loader.present();
  }

  goToLogin() {
    let navigationExtras: NavigationExtras = {
      queryParams: {
        openedByOtherPage: true
      }
    };
    this.navCtrl.navigateRoot('/signin', navigationExtras);
    this.menu.close();
  }

  async openSocial(social: string) {
    if (social === 'discord') {
      const { value }: CanOpenURLResult = await AppLauncher.canOpenUrl({ url: 'com.discord' });
      if (value) {
        AppLauncher.openUrl({ url: 'https://discord.com/invite/WGtBBZSpWW' });
      } else {
        Browser.open({ url: 'https://discord.com/invite/WGtBBZSpWW' });
      }
    } else if (social === 'twitter') {
      const { value }: CanOpenURLResult = await AppLauncher.canOpenUrl({ url: 'com.twitter.android' });
      if (value) {
        AppLauncher.openUrl({ url: 'https://twitter.com/dangoanimecl' });
      } else {
        Browser.open({ url: 'https://twitter.com/dangoanimecl' });
      }
    } else if (social === 'instagram') {
      const { value }: CanOpenURLResult = await AppLauncher.canOpenUrl({ url: 'com.instagram.android' });
      if (value) {
        AppLauncher.openUrl({ url: 'https://www.instagram.com/dangoanimecl/' });
      } else {
        Browser.open({ url: 'https://www.instagram.com/dangoanimecl/' });
      }
    }
  }

  async logout() {
    const alert = await this.alertCtrl.create({
      header: 'Cerrar sesión',
      message: '¿Estás seguro de que quieres cerrar sesión?',
      mode: 'ios',
      translucent: true,
      buttons: [
        {
          text: 'No',
          role: 'cancel'
        }, {
          text: 'Si',
          handler: () => {
            this.menu.close();
            this.profileImage = "assets/icon/avatar.svg";
            this.navCtrl.navigateRoot('/welcome', { animated: true, animationDirection: 'back', replaceUrl: true });
            this.database.purgeSession();
          }
        }
      ]
    });
    await alert.present();
  }

  closeMenu() {
    this.menu.close();
  }

  seeMore(type: string, title: string, layoutStyle: string, dynamicId: string) {

    let navigationExtras: NavigationExtras = {
      queryParams: {
        type: type,
        title: title,
        layoutStyle: layoutStyle,
        dynamicId: dynamicId
      }
    };
    this.menu.close();
    this.navCtrl.navigateForward('/see-more', navigationExtras);

  }

  searchYear(event) {
    if (event.target.value.length == 0) {
      this.years = this.staticYears;
    } else {
      this.years = this.staticYears.filter(year => year.toString().includes(event.target.value));
    }
  }
  
  searchCategory(event) {
    if (event.target.value.length == 0) {
      this.genres = this.staticGenres;
    } else {
      this.genres = this.staticGenres.filter(genre => genre.genero.toLowerCase().includes(event.target.value.toLowerCase()));
    }
  }

}
