import { Component, OnInit } from '@angular/core';
import { NavController, Platform } from '@ionic/angular';
import { UtilsService } from '../services/utils.service';
import { Settings } from 'src/app/classes/settings/settings/settings';
import { PreferencesService } from '../services/preferences/preferences.service';
import { NativeBiometric } from "capacitor-native-biometric";

@Component({
  selector: 'app-splash',
  templateUrl: './splash.page.html',
  styleUrls: ['./splash.page.scss'],
})
export class SplashPage implements OnInit {

  constructor(private navCtrl: NavController, private utils: UtilsService, 
    private localStorage: PreferencesService, private platform: Platform) {
  }

  async ngOnInit() {

    // Configuración inicial de la aplicación

    let localLogged = false;
    let localGuest = false;

    this.localStorage.setIsDownloading(false);

    const userFirstTime = await this.localStorage.userFirstTime();
    if (userFirstTime === null) {
      await this.localStorage.setUserFirstTime(true);
    }

    if (userFirstTime === true || userFirstTime === null) {

      const localSettings = await this.localStorage.getSettings();
      if (localSettings === null) {
        let settings = new Settings();
        settings.chromecastEnabled = true;
        settings.pipEnabled = true;
        settings.aditionalProviders = true;
        this.localStorage.setSettings(settings);
      } else {
        if (localSettings.aditionalProviders === undefined) {
          localSettings.aditionalProviders = true;
          this.localStorage.setSettings(localSettings);
        }
      }

      const deserveAd = await this.localStorage.getDeserveAd();
      if (deserveAd === null) {
        this.localStorage.setDeserveAd(false);
      }

      const withoutAdVideoViews = await this.localStorage.getWithoutAdVideoViews();
      if (withoutAdVideoViews === null) {
        this.localStorage.setWithoutAdVideoViews(0);
      }

      localLogged = await this.localStorage.getLogged();
      if (localLogged === null) {
        localLogged = false;
        this.localStorage.setLogged(false);
      }

      localGuest = await this.localStorage.getGuest();
      if (localGuest === null) {
        localGuest = false;
        this.localStorage.setGuest(false);
      }

      const localAcceptedTerms = await this.localStorage.getAcceptedTerms();
      if (localAcceptedTerms === null) {
        this.localStorage.setAcceptedTerms(false);
      }

      const localGoogleLogin = await this.localStorage.getGoogleLogin();
      if (localGoogleLogin === null) {
        this.localStorage.setGoogleLogin(false);
      }

      this.localStorage.setUserFirstTime(false);

      const biometricCompatible = await this.localStorage.biometricCompatible();
      if (biometricCompatible === null) {
        if (this.platform.is('android') || this.platform.is('ios')) {
          const bioResult = await NativeBiometric.isAvailable();
          if (bioResult.isAvailable) {
            this.localStorage.setBiometricCompatible(true);
          } else {
            this.localStorage.setBiometricCompatible(false);
          }
        } else {
          this.localStorage.setBiometricCompatible(false);
        }
      }

    } else {

      localLogged = await this.localStorage.getLogged();
      if (localLogged === null) {
        localLogged = false;
        this.localStorage.setLogged(false);
      }

      localGuest = await this.localStorage.getGuest();
      if (localGuest === null) {
        localGuest = false;
        this.localStorage.setGuest(false);
      }

      const biometricCompatible = await this.localStorage.biometricCompatible();
      if (biometricCompatible === null) {
        if (this.platform.is('android') || this.platform.is('ios')) {
          const bioResult = await NativeBiometric.isAvailable();
          if (bioResult.isAvailable) {
            this.localStorage.setBiometricCompatible(true);
          } else {
            this.localStorage.setBiometricCompatible(false);
          }
        } else {
          this.localStorage.setBiometricCompatible(false);
        }
      }
    }

    if (localLogged || localGuest) {
      this.navCtrl.navigateRoot("/tablinks/home", { animated: false, replaceUrl: true });
    } else if (!localLogged) {
      this.navCtrl.navigateRoot("/welcome", { animated: false, replaceUrl: true });
    }

    this.utils.setDefaultStatusBarColor();
  }
}
