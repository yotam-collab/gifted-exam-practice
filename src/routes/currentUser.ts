import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { setActiveUserId } from '../services/storage';
import { migrateLegacyDataToUser } from '../services/migrateLocalData';

/**
 * Identity seam. Before login (or in local-only mode) practice data belongs
 * to the legacy 'child_itamar' bucket; after login it belongs to the Supabase
 * uid. This hook also keeps storage's active namespace in sync and runs the
 * one-time legacy-data migration on first login.
 */
export const LOCAL_CHILD_USER_ID = 'child_itamar';

export function useCurrentUserId(): string {
  const { user } = useAuth();
  const uid = user?.id;

  useEffect(() => {
    if (uid) {
      setActiveUserId(uid);
      migrateLegacyDataToUser(uid);
    } else {
      setActiveUserId(null); // 'local' — legacy unsuffixed keys
    }
  }, [uid]);

  return uid ?? LOCAL_CHILD_USER_ID;
}
