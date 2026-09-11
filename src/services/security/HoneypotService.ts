/**
 * Wazeer OS v2.1 — Honeypot Anti-Bot Service
 * Production Review P0.5
 *
 * Pattern: Hidden form fields humans never fill.
 * Rule: 3 warnings → after 3rd trigger → actual ban (24h).
 * Logging: Every trigger written to auth_logs (IndexedDB).
 */

import { wazeerDB } from '@/lib/db';
import type { AuthLog, BannedNode } from '@/types';

const HONEYPOT_CONFIG_KEY = 'honeypot_strikes';
const MAX_STRIKES_BEFORE_BAN = 3;
const BAN_DURATION_HOURS = 24;

interface HoneypotStrikes {
  id: string;
  count: number;
  lastTrigger: string;
  ip?: string;
}

async function fetchClientIp(): Promise<string> {
  try {
    const res = await fetch('https://ipapi.co/json/', {
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json();
      return data.ip ?? '';
    }
  } catch {
    // IP fetch unavailable — proceed without IP association
  }
  return '';
}

function uid(): string {
  return `hp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

async function getStrikes(): Promise<HoneypotStrikes> {
  const existing = await wazeerDB.get<HoneypotStrikes>('config', HONEYPOT_CONFIG_KEY);
  if (existing) return existing;
  return { id: HONEYPOT_CONFIG_KEY, count: 0, lastTrigger: '' };
}

async function saveStrikes(strikes: HoneypotStrikes): Promise<void> {
  await wazeerDB.put('config', strikes);
}

async function logTrigger(
  inputName: string,
  value: string,
  strikes: number,
  ip: string,
  banned: boolean
): Promise<void> {
  const log: AuthLog = {
    id: uid(),
    userId: '',
    event: 'honeypot_trigger',
    email: '',
    timestamp: new Date().toISOString(),
    ip,
    details: JSON.stringify({
      field: inputName,
      valueLength: value.length,
      currentStrikes: strikes,
      banned,
    }),
  };
  await wazeerDB.put('auth_logs', log);
}

async function banIpForHoneypot(ip: string, strikes: number): Promise<void> {
  if (!ip) return;
  const ban: BannedNode = {
    ip,
    reason: `Honeypot ${MAX_STRIKES_BEFORE_BAN}x trigger (strikes=${strikes}) — ${BAN_DURATION_HOURS}h`,
    timestamp: new Date().toISOString(),
    permanent: false,
    bannedBy: 'system:honeypot',
  };
  await wazeerDB.put('banned_nodes', ban);

  const log: AuthLog = {
    id: uid(),
    userId: '',
    event: 'user_banned',
    email: '',
    timestamp: new Date().toISOString(),
    ip,
    details: JSON.stringify({
      source: 'honeypot',
      strikes,
      durationHours: BAN_DURATION_HOURS,
    }),
  };
  await wazeerDB.put('auth_logs', log);
}

export interface HoneypotResult {
  strikes: number;
  banned: boolean;
  warning: boolean;
}

/**
 * Records a honeypot trigger and applies the 3-strikes rule.
 * Call this ONLY when a honeypot hidden field has a non-empty value
 * (bots fill everything; humans never see invisible fields).
 */
export async function recordHoneypotTrigger(
  inputName: string,
  value: string
): Promise<HoneypotResult> {
  await wazeerDB.init();

  if (!value || !value.trim()) {
    return { strikes: 0, banned: false, warning: false };
  }

  const ip = await fetchClientIp();
  const strikes = await getStrikes();

  strikes.count += 1;
  strikes.lastTrigger = new Date().toISOString();
  if (ip) strikes.ip = ip;

  await saveStrikes(strikes);

  const isBanThreshold = strikes.count >= MAX_STRIKES_BEFORE_BAN;
  await logTrigger(inputName, value, strikes.count, ip, isBanThreshold);

  if (isBanThreshold) {
    await banIpForHoneypot(ip, strikes.count);
  }

  return {
    strikes: strikes.count,
    banned: isBanThreshold,
    warning: strikes.count < MAX_STRIKES_BEFORE_BAN,
  };
}

export const HONEYPOT_LOGIN_FIELDS = ['wazeer_login_company', 'wazeer_login_city'] as const;
export const HONEYPOT_ONBOARDING_FIELDS = ['wazeer_onb_company', 'wazeer_onb_city'] as const;
