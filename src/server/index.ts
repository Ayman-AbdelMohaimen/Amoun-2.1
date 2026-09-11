/**
 * Wazeer OS v2.1 — Express Server
 * Proxy-only + Admin API endpoints.
 * Firebase Admin SDK for server-side Firestore operations.
 *
 * Security as Mindset: Admin endpoints require session token + admin role.
 * Green Code: Modular route binding.
 * Scalable Architecture: Stateless proxy, stateless admin middleware.
 */

import 'dotenv/config';
import express from 'express';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { bindLlmRouters } from './providers';
import { bindOpencodeRoutes } from './opencode';

// ═══════════════════════════════════════════════════════════════════
// ES MODULE DIRNAME FIX
// ═══════════════════════════════════════════════════════════════════

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');

// ═══════════════════════════════════════════════════════════════════
// FIREBASE ADMIN (lazy init — only if FIREBASE_SERVICE_ACCOUNT is set)
// ═══════════════════════════════════════════════════════════════════

let adminDb: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any
let adminAuth: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any

async function initFirebaseAdmin() {
  try {
    const saStr = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!saStr || saStr === '{}') {
      console.warn('[FirebaseAdmin] No FIREBASE_SERVICE_ACCOUNT set — admin endpoints disabled');
      return;
    }
    const serviceAccount = typeof saStr === 'string' ? JSON.parse(saStr) : saStr;
    const { initializeApp: initAdmin, cert } = await import('firebase-admin/app');
    const { getFirestore: getAdminFirestore } = await import('firebase-admin/firestore');
    const app = initAdmin({ credential: cert(serviceAccount) });
    adminDb = getAdminFirestore(app);
    adminAuth = (await import('firebase-admin/auth')).getAuth(app);
    console.log('[FirebaseAdmin] Initialized successfully');
  } catch (err) {
    console.warn('[FirebaseAdmin] Init failed:', err);
  }
}

// ═══════════════════════════════════════════════════════════════════
// APP
// ═══════════════════════════════════════════════════════════════════

const app = express();
const PORT = parseInt(process.env.PORT ?? '3000', 10);

// ═══════════════════════════════════════════════════════════════════
// SECURITY HEADERS
// ═══════════════════════════════════════════════════════════════════

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      connectSrc: ["'self'", "https:", "wss:", "https://firestore.googleapis.com", "https://firebase.googleapis.com"],
      frameSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: { policy: 'credentialless' },
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
}));

// ═══════════════════════════════════════════════════════════════════
// RATE LIMITING
// ═══════════════════════════════════════════════════════════════════

const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests', retryAfter: 60 },
});

const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Admin rate limit exceeded', retryAfter: 60 },
});

app.use('/api/', globalLimiter);

// ═══════════════════════════════════════════════════════════════════
// LLM PROXY ROUTERS
// ⚠️ MUST be bound BEFORE compression()/express.json(): those middlewares
// consume the request stream, and the proxy would forward an empty body
// upstream (NVIDIA & co. respond ERR_EMPTY_RESPONSE).
// ═══════════════════════════════════════════════════════════════════

bindLlmRouters(app);

// ═══════════════════════════════════════════════════════════════════
// MIDDLEWARE (body parsing — only for our own routes below)
// ═══════════════════════════════════════════════════════════════════

app.use(compression());
app.use(express.json({ limit: '10mb' }));

// ═══════════════════════════════════════════════════════════════════
// OPENCODE INTEGRATION ROUTES
// (after body parsing — these consume JSON; before the SPA fallback)
// ═══════════════════════════════════════════════════════════════════

bindOpencodeRoutes(app);

// ═══════════════════════════════════════════════════════════════════
// HEALTH CHECK
// ═══════════════════════════════════════════════════════════════════

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    version: '2.1.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    adminEnabled: !!adminDb,
  });
});

// ═══════════════════════════════════════════════════════════════════
// ADMIN API ROUTES
// ═══════════════════════════════════════════════════════════════════

app.use('/api/admin', adminLimiter);

/** Middleware: require admin role from Firestore */
async function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!adminDb) {
    return res.status(503).json({ error: 'Admin panel not configured. Set FIREBASE_SERVICE_ACCOUNT.' });
  }

  const userId = req.headers['x-user-id'] as string;
  const userRole = req.headers['x-user-role'] as string;

  if (!userId || userRole !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
}

/** GET /api/admin/dashboard — fetch aggregated metrics */
app.get('/api/admin/dashboard', requireAdmin, async (_req, res) => {
  try {
    const usersSnap = await adminDb.collection('users').get();
    const allUsers: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any
    let bannedCount = 0;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);

    for (const doc of usersSnap.docs) {
      const d = doc.data();
      allUsers.push({ id: doc.id, ...d });
      if (d.role === 'banned') bannedCount++;
    }

    allUsers.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));

    const activeToday = allUsers.filter(u => {
      const ll = u.lastLogin?.toDate?.() ?? new Date(u.lastLogin);
      return ll >= todayStart;
    }).length;

    const activeWeek = allUsers.filter(u => {
      const ll = u.lastLogin?.toDate?.() ?? new Date(u.lastLogin);
      return ll >= weekStart;
    }).length;

    // Recent auth logs
    const logsSnap = await adminDb.collection('auth_logs')
      .orderBy('timestamp', 'desc').limit(50).get();
    const recentLogs = logsSnap.docs.map(d => {
      const data = d.data();
      const ts = data.timestamp?.toDate?.() ?? new Date(data.timestamp);
      return { id: d.id, ...data, timestamp: ts.toISOString() };
    });

    // 24h login stats
    const dayAgo = new Date(Date.now() - 86_400_000);
    const logins24h = recentLogs.filter(l => new Date(l.timestamp) >= dayAgo && l.event === 'login').length;
    const failed24h = recentLogs.filter(l => new Date(l.timestamp) >= dayAgo && l.event === 'failed_login').length;

    res.json({
      totalUsers: allUsers.length,
      activeToday,
      activeThisWeek: activeWeek,
      bannedUsers: bannedCount,
      totalLogins24h: logins24h,
      failedLogins24h: failed24h,
      recentAuthLogs: recentLogs,
      recentUsers: allUsers.slice(0, 20).map(u => ({
        id: u.id,
        name: u.name ?? '',
        email: u.email ?? '',
        role: u.role ?? 'user',
        lastLogin: u.lastLogin?.toDate?.()?.toISOString() ?? u.lastLogin ?? '',
        createdAt: u.createdAt?.toDate?.()?.toISOString() ?? u.createdAt ?? '',
        avatarUrl: u.avatarUrl,
      })),
      topModels: [],
    });
  } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.error('[Admin] Dashboard error:', err);
    res.status(500).json({ error: err.message ?? 'Failed to load dashboard' });
  }
});

/** POST /api/admin/action — ban/unban/promote/demote a user */
app.post('/api/admin/action', requireAdmin, async (req, res) => {
  try {
    const { targetUserId, action, reason } = req.body;
    const adminId = req.headers['x-user-id'] as string;

    if (!targetUserId || !action) {
      return res.status(400).json({ error: 'targetUserId and action required' });
    }

    const validActions = ['ban', 'unban', 'promote', 'demote'];
    if (!validActions.includes(action)) {
      return res.status(400).json({ error: `Invalid action. Must be: ${validActions.join(', ')}` });
    }

    const userRef = adminDb.collection('users').doc(targetUserId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updateData: Record<string, any> = { updatedAt: new Date() }; // eslint-disable-line @typescript-eslint/no-explicit-any
    let logEvent = '';
    let logDetails = '';

    switch (action) {
      case 'ban':
        updateData.role = 'banned';
        updateData.bannedAt = new Date();
        updateData.bannedReason = reason ?? 'No reason provided';
        updateData.bannedBy = adminId;
        logEvent = 'user_banned';
        logDetails = `Banned by admin. Reason: ${reason}`;
        // Add to banned_nodes
        await adminDb.collection('banned_nodes').doc(targetUserId).set({
          userId: targetUserId,
          email: userSnap.data().email,
          reason: reason ?? 'No reason provided',
          timestamp: new Date(),
          permanent: true,
          bannedBy: adminId,
        });
        break;
      case 'unban':
        updateData.role = 'user';
        updateData.bannedAt = null;
        updateData.bannedReason = null;
        logEvent = 'user_unbanned';
        logDetails = 'Unbanned by admin';
        await adminDb.collection('banned_nodes').doc(targetUserId).delete();
        break;
      case 'promote':
        updateData.role = 'admin';
        logEvent = 'role_change';
        logDetails = 'Promoted to admin';
        break;
      case 'demote':
        updateData.role = 'user';
        logEvent = 'role_change';
        logDetails = 'Demoted to user';
        break;
    }

    await userRef.update(updateData);

    // Log the action
    await adminDb.collection('auth_logs').add({
      userId: adminId,
      event: logEvent,
      email: req.headers['x-user-email'] ?? 'admin',
      timestamp: new Date(),
      details: `${logDetails} | Target: ${targetUserId}`,
    });

    res.json({ success: true, action, targetUserId });
  } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.error('[Admin] Action error:', err);
    res.status(500).json({ error: err.message ?? 'Action failed' });
  }
});

/** POST /api/admin/create-user — admin creates a new user */
app.post('/api/admin/create-user', requireAdmin, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const adminId = req.headers['x-user-id'] as string;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email, and password required' });
    }

    // Check if user exists
    const existing = await adminDb.collection('users').where('email', '==', email.trim().toLowerCase()).get();
    if (!existing.empty) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Create user document (password will be hashed client-side when they first login, or we store it pre-hashed)
    const userId = `manual_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    await adminDb.collection('users').doc(userId).set({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: role ?? 'user',
      createdAt: new Date(),
      lastLogin: null,
      avatarUrl: null,
      createdBy: adminId,
    });

    // Log
    await adminDb.collection('auth_logs').add({
      userId: adminId,
      event: 'register',
      email: req.headers['x-user-email'] ?? 'admin',
      timestamp: new Date(),
      details: `Admin created user: ${email.trim().toLowerCase()} (${role ?? 'user'})`,
    });

    res.json({ success: true, userId, email: email.trim().toLowerCase() });
  } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.error('[Admin] Create user error:', err);
    res.status(500).json({ error: err.message ?? 'Failed to create user' });
  }
});

/** GET /api/admin/users — list all users */
app.get('/api/admin/users', requireAdmin, async (_req, res) => {
  try {
    const snap = await adminDb.collection('users').orderBy('createdAt', 'desc').get();
    const users = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        name: data.name ?? '',
        email: data.email ?? '',
        role: data.role ?? 'user',
        lastLogin: data.lastLogin?.toDate?.()?.toISOString() ?? data.lastLogin ?? '',
        createdAt: data.createdAt?.toDate?.()?.toISOString() ?? data.createdAt ?? '',
        avatarUrl: data.avatarUrl,
      };
    });
    res.json({ users });
  } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    res.status(500).json({ error: err.message ?? 'Failed to fetch users' });
  }
});

// ═══════════════════════════════════════════════════════════════════
// SPA FALLBACK
// ═══════════════════════════════════════════════════════════════════

const distPath = resolve(__dirname, '../../dist');
app.use(express.static(distPath));

app.get('*', (_req, res) => {
  res.sendFile(join(distPath, 'index.html'));
});

// ═══════════════════════════════════════════════════════════════════
// START
// ═══════════════════════════════════════════════════════════════════

const server = app.listen(PORT, async () => {
  console.log(`[WazeerServer] Running on port ${PORT}`);
  await initFirebaseAdmin();
  console.log(`[WazeerServer] Admin API: ${adminDb ? 'ENABLED' : 'DISABLED (set FIREBASE_SERVICE_ACCOUNT)'}`);
});

// ═══════════════════════════════════════════════════════════════════
// GRACEFUL SHUTDOWN
// ═════════════════════════════════════════════════════════════════

function shutdown(signal: string) {
  console.log(`[WazeerServer] ${signal} received, shutting down...`);
  server.close(() => {
    console.log('[WazeerServer] All connections closed');
    process.exit(0);
  });
  setTimeout(() => { console.warn('[WazeerServer] Forced shutdown'); process.exit(1); }, 10_000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export { app, server };
