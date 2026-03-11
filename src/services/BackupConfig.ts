import Constants from 'expo-constants';

// expo 54+ may store config under expoConfig.extra instead of manifest.extra
const manifestExtra = (Constants.manifest && (Constants.manifest as any).extra) || {};
const expoConfigExtra = (Constants.expoConfig && (Constants.expoConfig as any).extra) || {};
const extra = { ...manifestExtra, ...expoConfigExtra };

export const BACKUP_ENDPOINT: string =
  process.env.BACKUP_ENDPOINT || extra.BACKUP_ENDPOINT || '';

if (__DEV__) {
  if (!BACKUP_ENDPOINT) {
    console.warn('[BackupConfig] BACKUP_ENDPOINT is empty');
  }
}
