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
      autoUpdate: false,
      defaultChannel: 'production',
      publicKey: '-----BEGIN RSA PUBLIC KEY-----\nMIIBCgKCAQEA7Vv4k4Ecc6hgRDSBeqMUUU4O97yKoctDS7j3+bpH0yV2OwULDZuR\nFQ3J2XShUBwzPOdD5HAUpqoeUfVxgsptLynES8nlvRRXZcsjFcW3vSIK8HbuvTfR\nvlbN5eZyfMk5PpWphbvUgArgvoil1sfgyFBXYl/blZ6igYuSh1Jxb26B06f0qHbg\nqoSJKDHqf7OUXo+Ir+uz8RAC6bLN110N0HCAlr6BgT3zrbqqBlFUZN2SNpuKKSPB\nIvey6S+lHsQtaoahTvhOY8xDKBfy/56wLFnuszGq+RNuFtD2Fq1+rujJSmy9PGC3\nL8OJtwpzQzjKEB/n0gTvhnVwIWKxoLvLiwIDAQAB\n-----END RSA PUBLIC KEY-----\n'
    }
  }
};

export default config;
