import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.webbonding.rikoapp',
  appName: 'riko-app-delivery',
  webDir: 'dist',
  server: {
    cleartext: true,
    androidScheme: 'http',
    iosScheme: 'http'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true
    },
    StatusBar: {
      backgroundColor: '#000000',
      style: 'DARK',
      overlaysWebView: true
    },
    CapacitorWebView: {
      android: {
        tapHighlightColor: 'transparent'
      }
    }
  }
};

export default config;
