import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sat10124.nyushuttle',
  appName: 'NYU Shanghai Shuttle Planner',
  webDir: 'dist',
  android: {
    useLegacyBridge: true
  }
};

export default config;
