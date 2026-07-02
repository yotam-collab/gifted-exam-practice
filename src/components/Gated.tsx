import { useNavigate } from 'react-router';
import type { ReactNode } from 'react';
import { useEntitlement } from '../hooks/useEntitlement';
import type { ItemAccess } from '../config/library';

/**
 * Wraps a content-item action. Free items always pass through. Paid items pass
 * only when entitled; otherwise `onLockedClick` fires (default: go to paywall).
 * Per product rule the locked item stays VISIBLE — we never hide it.
 */
export function Gated({
  access,
  itemTitle,
  children,
  onUnlocked,
}: {
  access: ItemAccess;
  itemTitle?: string;
  children: (opts: { locked: boolean; open: () => void }) => ReactNode;
  onUnlocked: () => void;
}) {
  const navigate = useNavigate();
  const { isEntitled } = useEntitlement();
  const locked = access === 'paid' && !isEntitled;

  const open = () => {
    if (locked) {
      navigate(`/paywall${itemTitle ? `?item=${encodeURIComponent(itemTitle)}` : ''}`);
    } else {
      onUnlocked();
    }
  };

  return <>{children({ locked, open })}</>;
}
