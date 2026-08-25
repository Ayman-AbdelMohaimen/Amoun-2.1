/**
 * Wazeer OS v2.1 — Authentication Service
 * Hybrid auth: Firebase Google OAuth + local IndexedDB for email/password.
 * Firestore sync for centralized user management.
 *
 * Security as Mindset: Password hashes never leave the device.
 * Green Code: Stateless exports, no classes.
 * Separation of Concerns: Auth logic only, no UI.
 */

import type { User, AuthLog, UserRole } from '@/types';
import { wazeerDB } from '@/lib/db';
import { ADMIN_EMAILS } from '@/constants';
import { syncUserToFirestore, logAuthEventToFirestore } from '@/lib/firestore';

// ═══════════════════════════════════════════════════════════════════
// PASSWORD HASHING (SHA-256)
// ═══════════════════════════════════════════════════════════════════

/** Hash a password string using SHA-256 via Web Crypto API. */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ═══════════════════════════════════════════════════════════════════
// SESSION MANAGEMENT
// ═══════════════════════════════════════════════════════════════════

function createSessionToken(): string {
  return crypto.randomUUID();
}

function saveSessionToken(token: string): void {
  try {
    localStorage.setItem('wazir_session_token', token);
  } catch {
    console.warn('[AuthService] localStorage unavailable for session token');
  }
}

function getSessionToken(): string | null {
  try {
    return localStorage.getItem('wazir_session_token');
  } catch {
    return null;
  }
}

function clearSessionToken(): void {
  try {
    localStorage.removeItem('wazir_session_token');
  } catch {
    // Ignore
  }
}

// ═══════════════════════════════════════════════════════════════════
// ROLE RESOLUTION
// ═══════════════════════════════════════════════════════════════════

/**
 * Resolve the user's role.
 * Priority: ADMIN_EMAILS hardcoded > first user > 'user'
 */
function resolveRole(email: string): UserRole {
  if (ADMIN_EMAILS.includes(email)) return 'admin';
  return 'user';
}

// ═══════════════════════════════════════════════════════════════════
// AUTH LOGGING (dual: IndexedDB local + Firestore centralized)
// ═══════════════════════════════════════════════════════════════════

/** Log an authentication event. Writes to both IndexedDB and Firestore. */
export async function logAuthEvent(
  event: AuthLog['event'],
  email: string,
  details?: string,
  userId?: string,
): Promise<void> {
  const logId = crypto.randomUUID();
  const log: AuthLog = {
    id: logId,
    userId: userId ?? '',
    event,
    email,
    timestamp: new Date().toISOString(),
    details,
  };

  // Local IndexedDB (always)
  try {
    await wazeerDB.init();
    await wazeerDB.put('auth_logs', log);
  } catch (err) {
    console.warn('[AuthService] Failed to log auth event locally:', err);
  }

  // Firestore (centralized — fire-and-forget)
  logAuthEventToFirestore(log).catch(() => {
    // Non-critical
  });
}

// ═══════════════════════════════════════════════════════════════════
// REGISTER
// ═════════════════════════════════════════════════════════════════

/**
 * Register a new user with email and password.
 * Saves to IndexedDB (users store) + syncs to Firestore.
 */
export async function registerUser(
  name: string,
  email: string,
  password: string,
): Promise<User> {
  await wazeerDB.init();

  const normalizedEmail = email.trim().toLowerCase();
  const passwordHash = await hashPassword(password);

  // Check for existing user
  const existing = await wazeerDB.get<User>('users', normalizedEmail);
  if (existing) {
    await logAuthEvent('failed_login', normalizedEmail, 'Registration: email already exists');
    throw new Error('هذا البريد الإلكتروني مسجل مسبقاً');
  }

  const role = resolveRole(normalizedEmail);
  const now = new Date().toISOString();

  const user: User = {
    id: crypto.randomUUID(),
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    role,
    preferences: {
      language: 'ar',
      theme: 'dark',
      accentColor: 'theme-emerald',
      voiceEnabled: false,
      voiceGender: 'male',
    },
    createdAt: now,
    lastLogin: now,
  };

  // Save to IndexedDB
  await wazeerDB.put('users', user);
  await wazeerDB.saveUser(user);

  // Sync to Firestore
  syncUserToFirestore(user).catch(() => {});

  // Auto-login
  const token = createSessionToken();
  saveSessionToken(token);

  await logAuthEvent('register', normalizedEmail, 'Registered via email/password', user.id);

  return user;
}

// ═══════════════════════════════════════════════════════════════════
// LOGIN (email/password)
// ═════════════════════════════════════════════════════════════════

/**
 * Login with email and password.
 * Checks IndexedDB for user, compares SHA-256 hashes.
 */
export async function loginUser(
  email: string,
  password: string,
): Promise<User> {
  await wazeerDB.init();

  const normalizedEmail = email.trim().toLowerCase();
  const inputHash = await hashPassword(password);

  const user = await wazeerDB.get<User>('users', normalizedEmail);
  if (!user || !user.passwordHash) {
    await logAuthEvent('failed_login', normalizedEmail, 'User not found or OAuth user');
    throw new Error('بريد إلكتروني أو كلمة مرور غير صحيحة');
  }

  if (user.passwordHash !== inputHash) {
    await logAuthEvent('failed_login', normalizedEmail, 'Invalid password');
    throw new Error('بريد إلكتروني أو كلمة مرور غير صحيحة');
  }

  // Check banned status
  if (user.role === 'banned') {
    await logAuthEvent('failed_login', normalizedEmail, 'Account is banned', user.id);
    throw new Error('هذا الحساب محظور. تواصل مع المدير إذا كان هذا خطأ.');
  }

  // Update lastLogin and re-resolve role
  const updatedUser: User = {
    ...user,
    lastLogin: new Date().toISOString(),
    role: resolveRole(normalizedEmail), // Re-check admin status
  };

  await wazeerDB.put('users', updatedUser);
  await wazeerDB.saveUser(updatedUser);

  // Sync to Firestore
  syncUserToFirestore(updatedUser).catch(() => {});

  const token = createSessionToken();
  saveSessionToken(token);

  await logAuthEvent('login', normalizedEmail, 'Login via email/password', updatedUser.id);

  return updatedUser;
}

// ═══════════════════════════════════════════════════════════════════
// OAUTH LOGIN (Google)
// ═════════════════════════════════════════════════════════════════

/**
 * Login or register via Google OAuth.
 * Auto-registers if user doesn't exist. No password for OAuth users.
 */
export async function loginOAuth(
  name: string,
  email: string,
  avatarUrl?: string,
): Promise<User> {
  await wazeerDB.init();

  const normalizedEmail = email.trim().toLowerCase();
  const now = new Date().toISOString();

  let user = await wazeerDB.get<User>('users', normalizedEmail);

  if (!user) {
    // Auto-register OAuth user
    const role = resolveRole(normalizedEmail);

    user = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: normalizedEmail,
      role,
      avatarUrl,
      preferences: {
        language: 'ar',
        theme: 'dark',
        accentColor: 'theme-emerald',
        voiceEnabled: false,
        voiceGender: 'male',
      },
      createdAt: now,
      lastLogin: now,
    };

    await wazeerDB.put('users', user);
    await logAuthEvent('register', normalizedEmail, 'Registered via OAuth', user.id);
  } else {
    // Update existing
    user = {
      ...user,
      lastLogin: now,
      avatarUrl: avatarUrl ?? user.avatarUrl,
      name: name.trim() || user.name,
      role: resolveRole(normalizedEmail),
    };
    await logAuthEvent('oauth_login', normalizedEmail, 'OAuth login', user.id);
  }

  // Check banned
  if (user.role === 'banned') {
    await logAuthEvent('failed_login', normalizedEmail, 'Banned account attempted OAuth', user.id);
    throw new Error('هذا الحساب محظور. تواصل مع المدير إذا كان هذا خطأ.');
  }

  // Save and sync
  await wazeerDB.put('users', user);
  await wazeerDB.saveUser(user);
  syncUserToFirestore(user).catch(() => {});

  const token = createSessionToken();
  saveSessionToken(token);

  return user;
}

// ═══════════════════════════════════════════════════════════════════
// SILENT RE-AUTH (app boot)
// ═════════════════════════════════════════════════════════════════

/**
 * Attempt to restore session on app boot.
 * Reads session token + user from IndexedDB.
 */
export async function silentReAuth(): Promise<User | null> {
  try {
    await wazeerDB.init();

    const token = getSessionToken();
    if (!token) {
      await logoutUser();
      return null;
    }

    const user = await wazeerDB.getUser();
    if (!user) {
      await logoutUser();
      return null;
    }

    // Re-resolve role (admin emails may have changed)
    user.role = resolveRole(user.email);
    await wazeerDB.saveUser(user);

    return user;
  } catch (err) {
    console.warn('[AuthService] silentReAuth failed:', err);
    await logoutUser();
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════
// LOGOUT
// ═════════════════════════════════════════════════════════════════

/** Clear session. */
export async function logoutUser(): Promise<void> {
  const user = await wazeerDB.getUser();
  if (user) {
    logAuthEvent('logout', user.email, 'User logged out', user.id).catch(() => {});
  }

  clearSessionToken();

  try {
    await wazeerDB.init();
    await wazeerDB.put('config', { id: 'wazir_user' });
  } catch {
    // Ignore
  }
}
