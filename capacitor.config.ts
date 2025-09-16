import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.williams.rikoapp',
  appName: 'riko-app-delivery',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,       // ⏱ duración (ms)
      launchAutoHide: true,           // se esconde solo al cargar
      backgroundColor: "#ffffff",     // color de fondo
      androidScaleType: "CENTER_CROP",// cómo escalar la imagen
      showSpinner: true              // puedes poner true si quieres un loader
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

