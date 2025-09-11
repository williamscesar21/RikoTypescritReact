import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.williams.rikoapp',
  appName: 'riko-app-delivery',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    },
    StatusBar: {
      backgroundColor: '#000000',
      style: 'DARK',
      overlaysWebView: true
    },
    CapacitorWebView: {
      android: {
        tapHighlightColor: "transparent"
      }
  }
}
}

export default config;

