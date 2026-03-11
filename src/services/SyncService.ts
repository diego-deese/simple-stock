import NetInfo from '@react-native-community/netinfo';
import * as FileSystem from 'expo-file-system';
import { reportService } from './ReportService';
import { exportService } from './ExportService';
import { SYNC_ENDPOINT } from './SyncConfig';

/**
 * Initializes network listener for syncing. Call once on app start.
 */
let syncInProgress = false;

export function initSyncListener() {
  NetInfo.addEventListener(state => {
    if (state.isConnected && !syncInProgress) {
      syncInProgress = true;
      console.log('[SyncService] network connected – starting sync');
      syncData()
        .catch(e => console.error('[SyncService] syncData failed', e))
        .finally(() => { syncInProgress = false; });
    }
  });
}

/**
 * Performs synchronization of unsynced reports (and optionally DB backup).
 * Marks records as synced only when the server responds with 200.
 */
export async function syncData(): Promise<void> {
  if (!SYNC_ENDPOINT) {
    console.warn('[SyncService] no SYNC_ENDPOINT configured');
    return;
  }

  // Ensure we only attempt sync while online
  const netState = await NetInfo.fetch();
  if (!netState.isConnected) {
    console.log('[SyncService] offline, skipping sync');
    return;
  }

  try {
    const unsynced = await reportService.getUnsyncedReports();
    console.log('[SyncService] unsynced reports count', unsynced.length);
    if (unsynced.length === 0) {
      return; // nothing to do
    }

    const payload: any = {
      metadata: {
        date: new Date().toISOString(),
        deviceId: await getDeviceId(),
        reportCount: unsynced.length,
      },
      rows: unsynced.map(r => ({
        id: r.id,
        date: r.date,
        type: r.type,
        related_report_id: r.related_report_id || null,
      })),
    };
    console.log('[SyncService] payload prepared', payload);

    // append full report CSV (same used by "exportar todo" button)
    try {
      const csv = await exportService.generateFullReportCSV();
      payload.full_report_csv = csv;
      console.log('[SyncService] attached full report csv (length)', csv.length);
    } catch (e) {
      console.warn('[SyncService] could not generate full report csv', e);
    }

    // Optionally include full DB file if it's end of month or other rule
    if (shouldAttachDatabase()) {
      try {
        const dbUri = await getDatabaseFileUri();
        const fs: any = FileSystem;
        const base64 = await fs.readAsStringAsync(dbUri, { encoding: fs.EncodingType?.Base64 });
        payload.file_b64 = base64;
      } catch (e) {
        console.warn('[SyncService] could not read DB file', e);
      }
    }

    const resp = await fetch(SYNC_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const text = await resp.text();
    console.log('[SyncService] sync response', resp.status, text);

    if (resp.ok) {
      // mark synced
      const ids = unsynced.map(r => r.id);
      await reportService.markReportsSynced(ids);
      console.log('[SyncService] marked synced', ids);
    } else {
      console.error('[SyncService] server responded error', resp.status, text);
    }
  } catch (error) {
    console.error('[SyncService] error during sync', error);
    // do not mark anything as synced
  }
}

/**
 * Placeholder: decide when to attach the full database backup.
 * Here we simply send it if today is the last day of the month.
 */
function shouldAttachDatabase(): boolean {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  return tomorrow.getDate() === 1; // last day of month
}

/**
 * Returns the URI where the SQLite file lives (Expo default location).
 */
async function getDatabaseFileUri(): Promise<string> {
  // expo-sqlite stores DB in <DocumentDirectory>/SQLite/<DB_NAME>
  const dbName = 'simplestock.db';
  const fs: any = FileSystem;
  const uri = `${fs.documentDirectory}SQLite/${dbName}`;
  return uri;
}

/**
 * Get deterministic device identifier; fallback to installation id.
 * For simplicity we return a constant or random string stored in AsyncStorage.
 */
async function getDeviceId(): Promise<string> {
  // could use expo-application or expo-device; simplified here
  return 'device-unknown';
}
