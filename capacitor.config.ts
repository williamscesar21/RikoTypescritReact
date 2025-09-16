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
    },
    CapacitorUpdater: {
      publicKey: '-----BEGIN RSA PUBLIC KEY-----\nMIIBCgKCAQEAsAKMntxSz4b9GBWX77d9AdINeaglFvaDs1SPzbByAnbS/h6uwXrY\nLE4VHKVbAm+lZllud4IZx1RtcOqIKWtSThyoSUZe8V8lWGduvIF1HKSbdTNuzcZ7\nngr+LiEsPRqKv6XaF8eEYP59Wl8e5GQB26l5E77UwqQ3ATTTBtLtHJOTMWKDGSLP\n0rT4LHDt9VjaP8RVwc4jjAuVfmcraBHlWGes8UhbWg4vEVgik0FMjMoPrU4Mk9kx\n6PsteqcIQ7WrD9XdwVM9PVlvYrR+jlP9JW39kAmhUbh5MfUNGOD+9PztHqK/u0az\nzlNFBDLtPtSytWRZK85pUQzW2tQnS6CGwQIDAQAB\n-----END RSA PUBLIC KEY-----\n',
      showUpdateUI: false,   // 👈 Esto oculta el banner,
      channel: 'production'
    }
  }
};

export default config;
