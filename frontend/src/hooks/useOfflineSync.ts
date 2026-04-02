'use client';

import { useEffect, useState, useCallback } from 'react';
import { getUnsyncedLogs, markLogSynced } from '../lib/db';
import { vitalsAPI } from '../lib/api';
import { toast } from 'sonner';

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? navigator.onLine : true);

  // Register Service Worker for Background Sync
  useEffect(() => {
    if ('serviceWorker' in navigator && 'SyncManager' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('[OfflineSync] SW Registered:', registration.scope);
        })
        .catch(err => {
          console.error('[OfflineSync] SW Registration failed:', err);
        });
    }
  }, []);

  const syncOfflineData = useCallback(async () => {
    try {
      const unsynced = await getUnsyncedLogs();
      if (unsynced.length === 0) return;

      console.log(`[OfflineSync] Attempting to sync ${unsynced.length} records...`);
      
      // If Service Worker + SyncManager is available, delegation to the SW
      if ('serviceWorker' in navigator && 'SyncManager' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        try {
          // Register a sync event that the SW will pick up
          // Use interface for SyncManager as it's not in standard TS types yet
          interface ExtendedSyncManager {
            register(tag: string): Promise<void>;
          }
          interface ExtendedServiceWorkerRegistration extends ServiceWorkerRegistration {
            sync: ExtendedSyncManager;
          }
          await (registration as unknown as ExtendedServiceWorkerRegistration).sync.register('health-sync');
          console.log('[OfflineSync] Registered health-sync event via SW');
          return;
        } catch (err) {
          console.warn('[OfflineSync] SW Sync registration failed, falling back to foreground sync:', err);
        }
      }

      // Fallback: Foreground sync loop
      for (const log of unsynced) {
        try {
          if (log.type === 'biometric') {
            await vitalsAPI.create({
              metric_type: log.data.metric_type || 'unknown',
              value: log.data.value || 0,
              unit: log.data.unit || '',
              recorded_at: log.timestamp,
            });
            await markLogSynced(log.id, 'vitals');
          }
        } catch (innerError) {
          console.error(`[OfflineSync] Failed to sync log ${log.id}:`, innerError);
          break; // Stop if there's a connectivity error during foreground sync
        }
      }

      toast.success('Sync Complete', {
        description: `${unsynced.length} health records updated to Digital Twin.`,
      });
    } catch (error) {
      console.error('[OfflineSync] Master sync failed:', error);
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('System Online', {
        description: 'Re-establishing secure data channels...',
      });
      syncOfflineData();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('System Offline', {
        description: 'Switching to local clinical vault (IndexedDB).',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncOfflineData]);

  return { isOnline, syncOfflineData };
}
