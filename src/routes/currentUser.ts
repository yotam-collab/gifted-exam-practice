/**
 * Temporary identity seam. Until Supabase auth lands (build step 5), every
 * screen that needs a userId gets it from here. When auth is wired, this
 * becomes a thin wrapper over useAuth().user?.id with the same fallback.
 */
export const LOCAL_CHILD_USER_ID = 'child_itamar';

export function useCurrentUserId(): string {
  return LOCAL_CHILD_USER_ID;
}
