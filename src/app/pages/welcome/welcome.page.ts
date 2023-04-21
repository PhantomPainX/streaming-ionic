import { Component, OnInit } from '@angular/core';
import { AlertController, NavController, Platform } from '@ionic/angular';
import { PreferencesService } from 'src/app/services/preferences/preferences.service';
import { UtilsService } from 'src/app/services/utils.service';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.page.html',
  styleUrls: ['./welcome.page.scss'],
})
export class WelcomePage implements OnInit {

  constructor(private navCtrl: NavController, private utils: UtilsService, private alertCtrl: AlertController, 
    private localStorage: PreferencesService, private platform: Platform) { }

  ngOnInit() {

    this.platform.ready().then(() => {
      this.utils.setDefaultStatusBarColor();
    });

  }

  goToLogin() {
    this.navCtrl.navigateForward('/signin', { animated: true, animationDirection: 'forward' });
  }

  goToRegister() {
    this.navCtrl.navigateForward('/register', { animated: true, animationDirection: 'forward' });
  }

  async enterAsGuest() {

    const alert = await this.alertCtrl.create({
      header: '¿Seguro?',
      message: 'Si entras como invitado, tus funciones se limitaran a revisar el catálogo y no podrás ver los videos.',
      mode: 'ios',
      translucent: true,
      buttons: [
        {
          text: 'No',
          role: 'cancel'
        }, {
          text: 'Si',
          handler: async () => {
            await this.localStorage.setLogged(false);
            await this.localStorage.setGuest(true);
            this.utils.showToast('Bienvenido Invitado', 2, false);
            this.navCtrl.navigateRoot("/tablinks/home", { animated: true, animationDirection: 'forward', replaceUrl: true });
          }
        }
      ]
    });
    await alert.present();
  }

}
