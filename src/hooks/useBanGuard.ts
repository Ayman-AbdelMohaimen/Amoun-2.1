/**
 * Wazeer OS v2.0 — Ban Guard Hook
 * On mount, checks if the current IP is banned.
 * Renders a block screen if banned.
 */

import { useEffect, useState } from 'react';
import type { BannedNode } from '@/types';
import { wazeerDB } from '@/lib/db';

export function useBanGuard(): { isBanned: boolean; banReason: string; loading: boolean } {
  const [isBanned, setIsBanned] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        await wazeerDB.init();

        // Fetch current IP
        let ip = '';
        try {
          const res = await fetch('https://ipapi.co/json/', {
            signal: AbortSignal.timeout(5000),
          });
          if (res.ok) {
            const data = await res.json();
            ip = data.ip ?? '';
          }
        } catch {
          // IP fetch failed — skip ban check
          if (!cancelled) setLoading(false);
          return;
        }

        if (!ip) {
          if (!cancelled) setLoading(false);
          return;
        }

        // Check against banned_nodes store
        const banned = await wazeerDB.get<BannedNode>('banned_nodes', ip);
        if (banned) {
          // Also check if it's expired and not permanent
          const now = new Date();
          const bannedAt = new Date(banned.timestamp);
          const isExpired =
            !banned.permanent &&
            (now.getTime() - bannedAt.getTime()) > 24 * 60 * 60 * 1000;

          if (!isExpired && !cancelled) {
            setIsBanned(true);
            setBanReason(banned.reason);
          } else if (isExpired) {
            // Remove expired ban
            await wazeerDB.delete('banned_nodes', ip);
          }
        }
      } catch (err) {
        console.warn('[useBanGuard] Check failed:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    check();

    return () => { cancelled = true; };
  }, []);

  return { isBanned, banReason, loading };
}
