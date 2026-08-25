/**
 * Wazeer OS v2.1 — Firebase Firestore Client
 * Centralized Firestore access for the client-side.
 * Used by: AuthService (user sync), AdminView (dashboard data).
 *
 * Security as Mindset: Firestore Security Rules must enforce:
 *   - Users can only read/write their own document
 *   - Admin collection is admin-only
 *   - Auth logs: users read own, admins read all
 *
 * Green Code: Lazy-initialized singleton.
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, limit, Timestamp, updateDoc, serverTimestamp } from 'firebase/firestore';
import type { User, AuthLog, UserRole } from '../types';

// ═══════════════════════════════════════════════════════════════════
// FIREBASE INIT
// ═══════════════════════════════════════════════════════════════════

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ═══════════════════════════════════════════════════════════════════
// COLLECTION REFS
// ═══════════════════════════════════════════════════════════════════

const USERS_COL = collection(db, 'users');
const AUTH_LOGS_COL = collection(db, 'auth_logs');
const BANNED_NODES_COL = collection(db, 'banned_nodes');
const ADMIN_SETTINGS_COL = collection(db, 'admin_settings');

// ═══════════════════════════════════════════════════════════════════
// USER SYNC (called from AuthService on register/login)
// ═══════════════════════════════════════════════════════════════════

/** Convert a local User to a Firestore-safe document (no passwordHash, no sensitive data). */
function userToFirestoreDoc(user: User): Record<string, unknown> {
  return {
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl ?? null,
    createdAt: user.createdAt,
    lastLogin: user.lastLogin,
    preferences: user.preferences,
    // passwordHash is NEVER sent to Firestore
  };
}

/**
 * Sync user profile to Firestore on register or login.
 * Uses setDoc with merge to preserve any server-side fields.
 */
export async function syncUserToFirestore(user: User): Promise<void> {
  try {
    const userRef = doc(db, 'users', user.id);
    await setDoc(userRef, {
      ...userToFirestoreDoc(user),
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.warn('[Firestore] Failed to sync user:', err);
    // Non-blocking — local auth still works
  }
}

/**
 * Fetch user's role from Firestore.
 * Falls back to 'user' if Firestore is unavailable.
 */
export async function fetchUserRoleFromFirestore(userId: string): Promise<UserRole> {
  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data();
      return (data.role as UserRole) ?? 'user';
    }
  } catch (err) {
    console.warn('[Firestore] Failed to fetch user role:', err);
  }
  return 'user';
}

// ═══════════════════════════════════════════════════════════════════
// AUTH LOG (centralized)
// ═══════════════════════════════════════════════════════════════════

/** Log auth event to Firestore. Fire-and-forget. */
export async function logAuthEventToFirestore(authLog: AuthLog): Promise<void> {
  try {
    const logRef = doc(db, 'auth_logs', authLog.id);
    await setDoc(logRef, {
      ...authLog,
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.warn('[Firestore] Failed to log auth event:', err);
  }
}

// ═══════════════════════════════════════════════════════════════════
// ADMIN: Fetch dashboard data
// ═══════════════════════════════════════════════════════════════════

export interface AdminDashboardData {
  totalUsers: number;
  activeToday: number;
  bannedUsers: number;
  recentAuthLogs: AuthLog[];
  recentUsers: Array<{
    id: string;
    name: string;
    email: string;
    role: UserRole;
    lastLogin: string;
    createdAt: string;
    avatarUrl?: string;
  }>;
}

/**
 * Fetch admin dashboard data from Firestore.
 * MUST be called server-side or with admin Firestore rules.
 */
export async function fetchAdminDashboard(): Promise<AdminDashboardData> {
  // Fetch all users
  const usersSnap = await getDocs(USERS_COL);
  const allUsers: AdminDashboardData['recentUsers'] = [];
  let bannedCount = 0;
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  for (const docSnap of usersSnap.docs) {
    const d = docSnap.data();
    const user = {
      id: docSnap.id,
      name: d.name ?? '',
      email: d.email ?? '',
      role: (d.role as UserRole) ?? 'user',
      lastLogin: d.lastLogin ?? '',
      createdAt: d.createdAt ?? '',
      avatarUrl: d.avatarUrl ?? undefined,
    };
    allUsers.push(user);
    if (d.role === 'banned') bannedCount++;
  }

  // Sort by createdAt desc
  allUsers.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  // Active today
  const activeToday = allUsers.filter(u => u.lastLogin >= todayStart).length;

  // Recent auth logs (last 50)
  const logsQuery = query(AUTH_LOGS_COL, orderBy('timestamp', 'desc'), limit(50));
  const logsSnap = await getDocs(logsQuery);
  const recentLogs: AuthLog[] = logsSnap.docs.map(d => {
    const data = d.data();
    const ts = data.timestamp;
    return {
      id: d.id,
      userId: data.userId ?? '',
      event: data.event ?? 'login',
      email: data.email ?? '',
      timestamp: typeof ts === 'object' && ts?.toDate ? (ts as Timestamp).toDate().toISOString() : (ts as string ?? ''),
      ip: data.ip ?? undefined,
      details: data.details ?? undefined,
    };
  });

  return {
    totalUsers: allUsers.length,
    activeToday,
    bannedUsers: bannedCount,
    recentAuthLogs: recentLogs,
    recentUsers: allUsers.slice(0, 20),
  };
}

// ═══════════════════════════════════════════════════════════════════
// ADMIN: User management actions
// ═══════════════════════════════════════════════════════════════════

/** Change a user's role. Admin only. */
export async function updateUserRole(userId: string, newRole: UserRole): Promise<void> {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, { role: newRole, updatedAt: serverTimestamp() });
}

/** Ban a user. Admin only. */
export async function banUser(userId: string, reason: string, adminId: string): Promise<void> {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, { role: 'banned', bannedAt: serverTimestamp(), bannedReason: reason, bannedBy: adminId });

  // Also add to banned_nodes for quick lookup
  const banNodeRef = doc(db, 'banned_nodes', userId);
  await setDoc(banNodeRef, {
    userId,
    reason,
    timestamp: serverTimestamp(),
    permanent: true,
    bannedBy: adminId,
  });
}

/** Unban a user. Admin only. */
export async function unbanUser(userId: string): Promise<void> {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, { role: 'user', bannedAt: null, bannedReason: null, bannedBy: null });

  // Remove from banned_nodes
  const banNodeRef = doc(db, 'banned_nodes', userId);
  await setDoc(banNodeRef, {});
}

// ═══════════════════════════════════════════════════════════════════
// BAN CHECK (client-side guard)
// ═══════════════════════════════════════════════════════════════════

/** Check if a user is banned. Called on app boot. */
export async function isUserBanned(userId: string): Promise<boolean> {
  try {
    const banRef = doc(db, 'banned_nodes', userId);
    const snap = await getDoc(banRef);
    if (snap.exists()) {
      const data = snap.data();
      return !!data.timestamp;
    }
  } catch {
    // If Firestore is down, don't block the user
  }
  return false;
}
