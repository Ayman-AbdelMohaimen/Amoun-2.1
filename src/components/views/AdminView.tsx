/**
 * Wazeer OS v2.1 — Admin Dashboard View
 * Full enterprise admin panel: user monitoring, auth logs, ban/unban,
 * role management, create user.
 *
 * Security as Mindset: Admin-only access, no sensitive data exposed.
 * Enterprise Edition: Centralized Firestore data.
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  Users, Shield, ShieldBan, ShieldCheck, UserPlus, LogIn, LogOut, AlertTriangle,
  Eye, Ban, CheckCircle, Crown, Activity, Clock, Mail,
} from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { LOGO_GLYPH, ADMIN_EMAILS } from '@/constants';
import { fetchAdminDashboard, type AdminDashboardData } from '@/lib/firestore';
import type { UserRole } from '@/types';

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

type AdminTab = 'overview' | 'users' | 'auth-logs' | 'create-user';

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

function timeAgo(dateStr: string): string {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'الآن';
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  return `منذ ${days} يوم`;
}

const ROLE_BADGE: Record<UserRole, { label: string; cls: string }> = {
  admin: { label: 'مدير', cls: 'bg-amber-500/20 text-amber-400' },
  user:  { label: 'مستخدم', cls: 'bg-emerald-500/20 text-emerald-400' },
  banned: { label: 'محظور', cls: 'bg-red-500/20 text-red-400' },
};

const EVENT_ICON: Record<string, typeof LogIn> = {
  login: LogIn,
  logout: LogOut,
  register: UserPlus,
  oauth_login: LogIn,
  failed_login: AlertTriangle,
  role_change: Shield,
  user_banned: ShieldBan,
  user_unbanned: ShieldCheck,
};

const EVENT_COLOR: Record<string, string> = {
  login: 'text-emerald-400',
  logout: 'text-gray-400',
  register: 'text-blue-400',
  oauth_login: 'text-purple-400',
  failed_login: 'text-red-400',
  role_change: 'text-amber-400',
  user_banned: 'text-red-500',
  user_unbanned: 'text-emerald-400',
};

// ═══════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════

export default function AdminView() {
  const { user, currentLanguage } = useWorkspaceStore();
  const isRtl = currentLanguage === 'ar';

  const [tab, setTab] = useState<AdminTab>('overview');
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Create user form
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('user');
  const [createResult, setCreateResult] = useState('');

  // Ban reason modal
  const [banModalFor, setBanModalFor] = useState<string | null>(null);
  const [banReason, setBanReason] = useState('');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchAdminDashboard();
      setData(result);
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      setError(err.message ?? 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  // Admin action via server
  const performAction = async (targetUserId: string, action: string, reason?: string) => {
    setActionLoading(targetUserId);
    try {
      const res = await fetch('/api/admin/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id ?? '',
          'x-user-role': user?.role ?? '',
          'x-user-email': user?.email ?? '',
        },
        body: JSON.stringify({ targetUserId, action, reason }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Action failed');
      await loadDashboard();
      setBanModalFor(null);
      setBanReason('');
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const createUser = async () => {
    if (!newName || !newEmail || !newPassword) return;
    setActionLoading('create');
    try {
      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id ?? '',
          'x-user-role': user?.role ?? '',
          'x-user-email': user?.email ?? '',
        },
        body: JSON.stringify({ name: newName, email: newEmail, password: newPassword, role: newRole }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to create user');
      setCreateResult(`تم إنشاء المستخدم: ${newEmail}`);
      setNewName(''); setNewEmail(''); setNewPassword('');
      loadDashboard();
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      setCreateResult(`خطأ: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // ── Guard: admin only ──────────────────────────────────────
  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-full cyber-grid">
        <div className="text-center space-y-3">
          <Shield className="mx-auto text-red-400" size={48} />
          <h1 className="text-xl font-bold text-[var(--text-primary)]">{isRtl ? 'غير مصرح' : 'Access Denied'}</h1>
          <p className="text-sm text-[var(--text-muted)]">{isRtl ? 'هذه الصفحة للمديرين فقط' : 'This page is for admins only'}</p>
        </div>
      </div>
    );
  }

  // ── Tabs ───────────────────────────────────────────────────
  const TABS: { id: AdminTab; label: string; icon: typeof Users }[] = [
    { id: 'overview', label: isRtl ? 'نظرة عامة' : 'Overview', icon: Activity },
    { id: 'users', label: isRtl ? 'المستخدمين' : 'Users', icon: Users },
    { id: 'auth-logs', label: isRtl ? 'سجل الدخول' : 'Auth Logs', icon: Clock },
    { id: 'create-user', label: isRtl ? 'إضافة مستخدم' : 'Add User', icon: UserPlus },
  ];

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="text-3xl glow-text">{LOGO_GLYPH}</span>
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] font-[var(--font-display)]">
            {isRtl ? 'لوحة تحكم المدير' : 'Admin Dashboard'}
          </h1>
          <p className="text-xs text-[var(--text-muted)]">{isRtl ? 'مراقبة وإدارة المستخدمين' : 'Monitor and manage users'}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors cursor-pointer ${
                tab === t.id
                  ? 'bg-[var(--accent-500)]/15 text-[var(--accent-400)]'
                  : 'text-[var(--text-muted)] hover:bg-white/5'
              }`}>
              <Icon size={16} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Loading / Error */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-[var(--accent-400)] border-t-transparent rounded-full" />
        </div>
      )}
      {error && (
        <div className="glass rounded-xl p-4 border border-red-500/30 text-red-400 text-sm">
          <AlertTriangle className="inline mr-2" size={16} /> {error}
        </div>
      )}

      {/* ═══ OVERVIEW TAB ═══ */}
      {!loading && data && tab === 'overview' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={Users} label={isRtl ? 'إجمالي المستخدمين' : 'Total Users'} value={data.totalUsers} accent="emerald" />
            <StatCard icon={Activity} label={isRtl ? 'نشط اليوم' : 'Active Today'} value={data.activeToday} accent="blue" />
            <StatCard icon={ShieldBan} label={isRtl ? 'محظورين' : 'Banned'} value={data.bannedUsers} accent="red" />
            <StatCard icon={LogIn} label={isRtl ? 'تسجيلات (24س)' : 'Logins (24h)'} value={data.activeToday} accent="purple" />
          </div>

          {/* Recent Auth */}
          <div className="glass rounded-xl p-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">{isRtl ? 'آخر الأنشطة' : 'Recent Activity'}</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {data.recentAuthLogs.slice(0, 15).map(log => {
                const Icon = EVENT_ICON[log.event] ?? Activity;
                const color = EVENT_COLOR[log.event] ?? 'text-gray-400';
                return (
                  <div key={log.id} className="flex items-center gap-3 py-1.5 border-b border-white/5 last:border-0">
                    <Icon size={14} className={color} />
                    <span className="text-sm text-[var(--text-secondary)] flex-1 truncate">{log.email}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${color}`}>{log.event}</span>
                    <span className="text-[10px] text-[var(--text-dim)] whitespace-nowrap">{timeAgo(log.timestamp)}</span>
                  </div>
                );
              })}
              {data.recentAuthLogs.length === 0 && (
                <p className="text-sm text-[var(--text-dim)] text-center py-4">لا توجد أنشطة بعد</p>
              )}
            </div>
          </div>

          {/* Recent Users */}
          <div className="glass rounded-xl p-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">{isRtl ? 'أحدث المستخدمين' : 'Newest Users'}</h3>
            <div className="space-y-2">
              {data.recentUsers.slice(0, 10).map(u => {
                const badge = ROLE_BADGE[u.role] ?? ROLE_BADGE.user;
                return (
                  <div key={u.id} className="flex items-center gap-3 py-1.5 border-b border-white/5 last:border-0">
                    <div className="w-8 h-8 rounded-full bg-[var(--accent-500)]/20 flex items-center justify-center text-xs text-[var(--accent-400)] font-bold">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-[var(--text-primary)] truncate">{u.name}</div>
                      <div className="text-[10px] text-[var(--text-dim)]">{u.email}</div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* ═══ USERS TAB ═══ */}
      {!loading && data && tab === 'users' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="glass rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
                    <th className="text-start px-4 py-3 font-medium">{isRtl ? 'المستخدم' : 'User'}</th>
                    <th className="text-start px-4 py-3 font-medium">{isRtl ? 'الدور' : 'Role'}</th>
                    <th className="text-start px-4 py-3 font-medium">{isRtl ? 'آخر دخول' : 'Last Login'}</th>
                    <th className="text-start px-4 py-3 font-medium">{isRtl ? 'تاريخ التسجيل' : 'Created'}</th>
                    <th className="text-start px-4 py-3 font-medium">{isRtl ? 'إجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentUsers.map(u => {
                    const badge = ROLE_BADGE[u.role] ?? ROLE_BADGE.user;
                    const isSuperAdmin = ADMIN_EMAILS.includes(u.email);
                    return (
                      <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[var(--accent-500)]/20 flex items-center justify-center text-xs text-[var(--accent-400)] font-bold shrink-0">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="text-[var(--text-primary)] truncate flex items-center gap-1">
                                {u.name} {isSuperAdmin && <Crown size={12} className="text-amber-400" />}
                              </div>
                              <div className="text-[10px] text-[var(--text-dim)]">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>
                        </td>
                        <td className="px-4 py-3 text-[var(--text-muted)] text-xs">{timeAgo(u.lastLogin)}</td>
                        <td className="px-4 py-3 text-[var(--text-muted)] text-xs">{timeAgo(u.createdAt)}</td>
                        <td className="px-4 py-3">
                          {isSuperAdmin ? (
                            <span className="text-[10px] text-amber-400">{isRtl ? 'سوبر أدمن' : 'Super Admin'}</span>
                          ) : (
                            <div className="flex items-center gap-1">
                              {u.role === 'user' && (
                                <button onClick={() => performAction(u.id, 'promote')} title="ترقية"
                                  className="p-1 rounded-lg hover:bg-amber-500/10 text-amber-400 transition-colors cursor-pointer"
                                  disabled={actionLoading === u.id}>
                                  <Crown size={14} />
                                </button>
                              )}
                              {u.role === 'admin' && (
                                <button onClick={() => performAction(u.id, 'demote')} title="تنزيل"
                                  className="p-1 rounded-lg hover:bg-orange-500/10 text-orange-400 transition-colors cursor-pointer"
                                  disabled={actionLoading === u.id}>
                                  <Shield size={14} />
                                </button>
                              )}
                              {u.role !== 'banned' ? (
                                <button onClick={() => setBanModalFor(u.id)} title="حظر"
                                  className="p-1 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors cursor-pointer"
                                  disabled={actionLoading === u.id}>
                                  <Ban size={14} />
                                </button>
                              ) : (
                                <button onClick={() => performAction(u.id, 'unban')} title="إلغاء الحظر"
                                  className="p-1 rounded-lg hover:bg-emerald-500/10 text-emerald-400 transition-colors cursor-pointer"
                                  disabled={actionLoading === u.id}>
                                  <CheckCircle size={14} />
                                </button>
                              )}
                              {actionLoading === u.id && (
                                <div className="animate-spin w-4 h-4 border-2 border-[var(--accent-400)] border-t-transparent rounded-full" />
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {data.recentUsers.length === 0 && (
                <p className="text-center py-8 text-[var(--text-dim)] text-sm">لا يوجد مستخدمين بعد</p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* ═══ AUTH LOGS TAB ═══ */}
      {!loading && data && tab === 'auth-logs' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-xl p-4">
          <div className="space-y-1 max-h-[70vh] overflow-y-auto">
            {data.recentAuthLogs.map(log => {
              const Icon = EVENT_ICON[log.event] ?? Activity;
              const color = EVENT_COLOR[log.event] ?? 'text-gray-400';
              return (
                <div key={log.id} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-white/5 transition-colors">
                  <Icon size={14} className={color} />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-[var(--text-primary)]">{log.email}</span>
                    {log.details && (
                      <p className="text-[10px] text-[var(--text-dim)] truncate">{log.details}</p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${color}`}>{log.event}</span>
                  <span className="text-[10px] text-[var(--text-dim)] whitespace-nowrap">{timeAgo(log.timestamp)}</span>
                  {log.ip && (
                    <span className="text-[10px] text-[var(--text-dim)] font-mono">{log.ip}</span>
                  )}
                </div>
              );
            })}
            {data.recentAuthLogs.length === 0 && (
              <p className="text-center py-8 text-[var(--text-dim)] text-sm">لا توجد سجلات بعد</p>
            )}
          </div>
        </motion.div>
      )}

      {/* ═══ CREATE USER TAB ═══ */}
      {tab === 'create-user' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-xl p-6 max-w-md space-y-4">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">{isRtl ? 'إضافة مستخدم جديد' : 'Add New User'}</h3>
          <InputField label={isRtl ? 'الاسم' : 'Name'} value={newName} onChange={setNewName} />
          <InputField label={isRtl ? 'البريد الإلكتروني' : 'Email'} value={newEmail} onChange={setNewEmail} type="email" />
          <InputField label={isRtl ? 'كلمة المرور' : 'Password'} value={newPassword} onChange={setNewPassword} type="password" />
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">{isRtl ? 'الدور' : 'Role'}</label>
            <select value={newRole} onChange={e => setNewRole(e.target.value as UserRole)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent-400)]">
              <option value="user">{isRtl ? 'مستخدم' : 'User'}</option>
              <option value="admin">{isRtl ? 'مدير' : 'Admin'}</option>
            </select>
          </div>
          <button onClick={createUser} disabled={actionLoading === 'create' || !newName || !newEmail || !newPassword}
            className="w-full py-2 rounded-lg bg-[var(--accent-500)] text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer">
            {actionLoading === 'create' ? '...' : (isRtl ? 'إنشاء المستخدم' : 'Create User')}
          </button>
          {createResult && (
            <p className={`text-sm ${createResult.startsWith('خطأ') ? 'text-red-400' : 'text-emerald-400'}`}>{createResult}</p>
          )}
        </motion.div>
      )}

      {/* ═══ BAN MODAL ═══ */}
      {banModalFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setBanModalFor(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-2xl p-6 w-full max-w-sm mx-4 space-y-4"
            onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">{isRtl ? 'حظر المستخدم' : 'Ban User'}</h3>
            <textarea value={banReason} onChange={e => setBanReason(e.target.value)}
              placeholder={isRtl ? 'سبب الحظر...' : 'Reason for banning...'} rows={3}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-[var(--border)] text-[var(--text-primary)] text-sm resize-none focus:outline-none focus:border-red-400" />
            <div className="flex gap-2">
              <button onClick={() => performAction(banModalFor, 'ban', banReason || 'No reason provided')}
                className="flex-1 py-2 rounded-lg bg-red-500/20 text-red-400 font-medium text-sm hover:bg-red-500/30 transition-colors cursor-pointer">
                {isRtl ? 'تأكيد الحظر' : 'Confirm Ban'}
              </button>
              <button onClick={() => setBanModalFor(null)}
                className="flex-1 py-2 rounded-lg bg-white/5 text-[var(--text-muted)] text-sm hover:bg-white/10 transition-colors cursor-pointer">
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═════════════════════════════════════════════════════════════════

function StatCard({ icon: Icon, label, value, accent }: { icon: typeof Users; label: string; value: number; accent: string }) {
  const colors: Record<string, string> = {
    emerald: 'from-emerald-500/20 to-emerald-500/5 text-emerald-400',
    blue: 'from-blue-500/20 to-blue-500/5 text-blue-400',
    red: 'from-red-500/20 to-red-500/5 text-red-400',
    purple: 'from-purple-500/20 to-purple-500/5 text-purple-400',
  };
  const cls = colors[accent] ?? colors.emerald;
  return (
    <div className={`bg-gradient-to-br ${cls} rounded-xl p-4`}>
      <Icon size={20} className="mb-2 opacity-70" />
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs opacity-70 mt-1">{label}</div>
    </div>
  );
}

function InputField({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-xs text-[var(--text-muted)] mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent-400)]" />
    </div>
  );
}