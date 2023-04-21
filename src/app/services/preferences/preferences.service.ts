import { Injectable } from '@angular/core';
import { KeysResult, Preferences } from '@capacitor/preferences';
import { PrivateUser } from 'src/app/classes/private-user/private-user';
import { Settings } from 'src/app/classes/settings/settings/settings';

@Injectable({
  providedIn: 'root'
})
export class PreferencesService {

  constructor() { }

  async userFirstTime(): Promise<boolean> {
    const { value } = await Preferences.get({ key: 'userFirstTime' });
    if (value === null) {
      return null;
    } else {
      return (value === 'true') ? true : false;
    }
  }

  async setUserFirstTime(userFirstTime: boolean): Promise<void> {
    await Preferences.set({
      key: 'userFirstTime',
      value: JSON.stringify(userFirstTime)
    });
  }

  async getKnownKeys(): Promise<KeysResult> {
    return await Preferences.keys();
  }

  async userHasBiometricCredentials(): Promise<boolean> {
    const { value } = await Preferences.get({ key: 'userHasBiometricCredentials' });
    if (value === null) {
      return null;
    } else {
      return (value === 'true') ? true : false;
    }
  }

  async setUserHasBiometricCredentials(userHasBiometricCredentials: boolean): Promise<void> {
    await Preferences.set({
      key: 'userHasBiometricCredentials',
      value: JSON.stringify(userHasBiometricCredentials)
    });
  }

  async biometricCompatible(): Promise<boolean> {
    const { value } = await Preferences.get({ key: 'biometricCompatible' });
    if (value === null) {
      return null;
    } else {
      return (value === 'true') ? true : false;
    }
  }

  async setBiometricCompatible(biometricCompatible: boolean): Promise<void> {
    await Preferences.set({
      key: 'biometricCompatible',
      value: JSON.stringify(biometricCompatible)
    });
  }
    
  async getSettings(): Promise<Settings> {
    const { value } = await Preferences.get({ key: 'settings' });
    return JSON.parse(value);
  }

  async setSettings(settings: Settings): Promise<void> {
    await Preferences.set({
      key: 'settings',
      value: JSON.stringify(settings)
    });
  }

  async getLogged(): Promise<boolean> {
    const { value } = await Preferences.get({ key: 'logged' });
    return (value === 'true') ? true : false || null;
  }

  async setLogged(logged: boolean): Promise<void> {
    await Preferences.set({
      key: 'logged',
      value: JSON.stringify(logged)
    });
  }

  async getGuest(): Promise<boolean> {
    const { value } = await Preferences.get({ key: 'guest' });
    return (value === 'true') ? true : false || null;
  }

  async setGuest(guest: boolean): Promise<void> {
    await Preferences.set({
      key: 'guest',
      value: JSON.stringify(guest)
    });
  }

  async getAcceptedTerms(): Promise<boolean> {
    const { value } = await Preferences.get({ key: 'acceptedTerms' });
    return (value === 'true') ? true : false || null;
  }

  async setAcceptedTerms(acceptedTerms: boolean): Promise<void> {
    await Preferences.set({
      key: 'acceptedTerms',
      value: JSON.stringify(acceptedTerms)
    });
  }

  async getGoogleLogin(): Promise<boolean> {
    const { value } = await Preferences.get({ key: 'googleLogin' });
    return (value === 'true') ? true : false || null;
  }

  async setGoogleLogin(googleLogin: boolean): Promise<void> {
    await Preferences.set({
      key: 'googleLogin',
      value: JSON.stringify(googleLogin)
    });
  }

  async getUser(): Promise<PrivateUser> {
    const { value } = await Preferences.get({ key: 'user' });
    return JSON.parse(value);
  }

  async setUser(user: PrivateUser): Promise<void> {
    await Preferences.set({
      key: 'user',
      value: JSON.stringify(user)
    });
  }

  async removeUser(): Promise<void> {
    await Preferences.remove({ key: 'user' });
  }

  async setRatedApp(ratedApp: boolean): Promise<void> {
    await Preferences.set({
      key: 'ratedApp',
      value: JSON.stringify(ratedApp)
    });
  }

  async getRatedApp(): Promise<boolean> {
    const { value } = await Preferences.get({ key: 'ratedApp' });
    return (value === 'true') ? true : false || null;
  }

  async getIsDownloading(): Promise<boolean> {
    const { value } = await Preferences.get({ key: 'isDownloading' });
    return (value === 'true') ? true : false || null;
  }

  async setIsDownloading(isDownloading: boolean): Promise<void> {
    await Preferences.set({
      key: 'isDownloading',
      value: JSON.stringify(isDownloading)
    });
  }

  async setTimeOnApp(timeOnApp: number): Promise<void> {
    await Preferences.set({
      key: 'timeOnApp',
      value: JSON.stringify(timeOnApp)
    });
  }

  async getTimeOnApp(): Promise<number> {
    const { value } = await Preferences.get({ key: 'timeOnApp' });
    return JSON.parse(value);
  }

  async resetTimeOnApp(): Promise<void> {
    await Preferences.remove({ key: 'timeOnApp' });
  }

  async getDeserveAd(): Promise<boolean> {
    const value = JSON.parse(localStorage.getItem('deserveAd'));
    return value;
  }

  async setDeserveAd(deserveAd: boolean): Promise<void> {
    localStorage.setItem('deserveAd', JSON.stringify(deserveAd));
  }

  async getWithoutAdVideoViews(): Promise<number> {
    const value = JSON.parse(localStorage.getItem('withoutAdVideoViews'));
    return value;
  }

  async setWithoutAdVideoViews(withoutAdVideoViews: number): Promise<void> {
    localStorage.setItem('withoutAdVideoViews', JSON.stringify(withoutAdVideoViews));
  }
}
