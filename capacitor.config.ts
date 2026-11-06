import type { CapacitorConfig } from '@capacitor/cli';

// (2026-07-13) Capacitor config with FirebaseAuthentication google.com provider; prev: json only
const config: CapacitorConfig = {
  appId: 'com.choirbook.app',
  appName: 'Choir Book',
  webDir: 'www',
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ['google.com']
    }
  }
};

export default config;

