import NetInfo from '@react-native-community/netinfo';
// use legacy API for filesystem
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { exportService } from './ExportService';
import { reportService } from './ReportService';
import { BACKUP_ENDPOINT } from './BackupConfig';

// note: jsrsasign and Drive credentials are no longer used

let lastConnected = false;

// AsyncStorage keys and timing constants
const LAST_BACKUP_KEY = 'lastBackupTimestamp';
const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * Initialize the network listener. Should be called once on app start.
 */
export function initNetworkBackupListener() {
  NetInfo.addEventListener(state => {
    const connected = !!state.isConnected;
    if (!lastConnected && connected) {
      // Became online
      shouldBackupDue().then(due => {
        if (due) {
          backupNow().catch(e => console.error('[BackupService] backup failed', e));
        } else {
          console.log('[BackupService] backup not due yet');
        }
      });
    }
    lastConnected = connected;
  });
}

/**
 * Trigger a backup immediately. Can be called by a manual button or from
 * the network listener.
 */
function ensureBackupConfig(): void {
  if (!BACKUP_ENDPOINT) {
    throw new Error(
      'Backup endpoint is not configured. Set BACKUP_ENDPOINT in your environment or Expo extras.'
    );
  }
}

export async function backupNow(): Promise<void> {
  console.log('[BackupService] backupNow triggered');

  // Avoid showing an error alert when the device is offline.
  const net = await NetInfo.fetch();
  if (!net.isConnected) {
    console.log('[BackupService] device offline, skipping backup');
    return;
  }

  try {
    ensureBackupConfig();
    // optionally collect some metadata (e.g. number of reports)
    const reports = await reportService.getAllReports();
    console.log('[BackupService] reports to back up', reports.length);

    // checkpoint WAL so main database file is up to date
    try {
      const { dbConnection } = await import('@database/connection');
      const db = await dbConnection.connect();
      await db.execAsync('PRAGMA wal_checkpoint(TRUNCATE);');
      console.log('[BackupService] WAL checkpoint completed');
    } catch (e) {
      console.warn('[BackupService] could not checkpoint WAL', e);
    }

    // read the SQLite database file and send it
    const fs: any = FileSystem;
    const dbUri = await getDatabaseFileUri();
    const base64db = await fs.readAsStringAsync(dbUri, { encoding: fs.EncodingType?.Base64 });
    const filename = `backup-${new Date().toISOString()}.db`;

    // send to GAS endpoint
    const result = await postBackupToEndpoint(base64db, filename);
    console.log('[BackupService] endpoint call result', result);
    await recordLastBackup();
    Alert.alert('Backup', 'Copia de seguridad subida correctamente.');
  } catch (error: any) {
    console.error('[BackupService] error during backup', error);
    Alert.alert('Backup', 'Error al crear/o subir la copia: ' + (error.message || error));
  }
}

/**
 * Returns the URI where the SQLite file lives (Expo default location).
 */
async function getDatabaseFileUri(): Promise<string> {
  const dbName = 'simplestock.db';
  const fs: any = FileSystem;
  return `${fs.documentDirectory}SQLite/${dbName}`;
}

async function postBackupToEndpoint(base64db: string, filename: string): Promise<any> {
  const payload = {
    metadata: {
      date: new Date().toISOString(),
      deviceId: 'device-unknown',
      filename,
    },
    file_b64: base64db,
  };
  console.log('[BackupService] posting payload', { filename, size: base64db?.length });

  const resp = await fetch(BACKUP_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const text = await resp.text();
  let json;
  try { json = JSON.parse(text); } catch (_) { json = text; }
  console.log('[BackupService] endpoint response', resp.status, json);

  if (!resp.ok) {
    console.error('[BackupService] endpoint returned non-ok', resp.status, text);
    throw new Error(`Backup endpoint failed (${resp.status}): ${text}`);
  }

  return json;
}

// ----- timing helpers -------------------------------------------------------

export async function getLastBackup(): Promise<number | null> {
  const v = await AsyncStorage.getItem(LAST_BACKUP_KEY);
  return v ? parseInt(v, 10) : null;
}

export async function recordLastBackup(): Promise<void> {
  await AsyncStorage.setItem(LAST_BACKUP_KEY, Date.now().toString());
}

export async function shouldBackupDue(): Promise<boolean> {
  const last = await getLastBackup();
  if (!last) return true; // never backed up before
  return Date.now() - last >= TWO_WEEKS_MS;
}
