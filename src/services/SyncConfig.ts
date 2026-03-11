import Constants from 'expo-constants';

// support both manifest.extra and expoConfig.extra
const manifestExtra = (Constants.manifest && (Constants.manifest as any).extra) || {};
const expoConfigExtra = (Constants.expoConfig && (Constants.expoConfig as any).extra) || {};
const extra = { ...manifestExtra, ...expoConfigExtra };

export const SYNC_ENDPOINT: string =
  process.env.SYNC_ENDPOINT || extra.SYNC_ENDPOINT || '';

if (__DEV__) {
  if (!SYNC_ENDPOINT) {
    console.warn('[SyncConfig] SYNC_ENDPOINT is empty');
  }
}
