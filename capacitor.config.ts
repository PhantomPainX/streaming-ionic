import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.animemac.application',
  appName: 'AnimeMac',
  webDir: 'www',
  bundledWebRuntime: false,
  server: {
    iosScheme: 'capacitor',
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '',
      forceCodeForRefreshToken: true,
    },
    FirebaseMessaging: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    LocalNotifications: {
      smallIcon: "ic_stat_logo_push",
      iconColor: "#488AFF",
      sound: "beep.wav",
    },
  },
  cordova: {
    preferences: {
      ScrollEnabled: 'false',
      orientation: 'portrait',
      BackupWebStorage: 'none',
      scheme: 'capacitor',
      hostname: 'testapp'
    }
  }
};

export default config;
