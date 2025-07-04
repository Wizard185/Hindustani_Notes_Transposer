
import { CapacitorConfig } from '@capacitor/core';

const config: CapacitorConfig = {
  appId: 'app.lovable.e6d161f842af4b6c9ac71c0a067a1872',
  appName: 'Notes Transposer',
  webDir: 'dist',
  server: {
    url: 'https://e6d161f8-42af-4b6c-9ac7-1c0a067a1872.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1a1a2e',
      showSpinner: false
    }
  }
};

export default config;
