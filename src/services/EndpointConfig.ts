import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKUP_ENDPOINT as BUILD_BACKUP_ENDPOINT } from './BackupConfig';

const BACKUP_ENDPOINT_KEY = 'BACKUP_ENDPOINT';

export async function getStoredBackupEndpoint(): Promise<string | null> {
  try {
    const value = await AsyncStorage.getItem(BACKUP_ENDPOINT_KEY);
    return value || null;
  } catch {
    return null;
  }
}

export async function setStoredBackupEndpoint(value: string): Promise<void> {
  await AsyncStorage.setItem(BACKUP_ENDPOINT_KEY, value);
}

export async function clearStoredBackupEndpoint(): Promise<void> {
  await AsyncStorage.removeItem(BACKUP_ENDPOINT_KEY);
}

export async function getEffectiveBackupEndpoint(): Promise<string> {
  const stored = await getStoredBackupEndpoint();
  if (stored) return stored;
  return BUILD_BACKUP_ENDPOINT;
}
