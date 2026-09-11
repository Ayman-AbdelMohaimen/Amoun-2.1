import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { loginUser, registerUser, loginOAuth } from '@/services/AuthService';
import {
  recordHoneypotTrigger,
  HONEYPOT_LOGIN_FIELDS,
} from '@/services/security/HoneypotService';

export default function LoginModal() {
  const { currentLanguage, setUser, setShowLoginModal } = useWorkspaceStore();
  const isRtl = currentLanguage === 'ar';
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget as HTMLFormElement);
      for (const fieldName of HONEYPOT_LOGIN_FIELDS) {
        const val = formData.get(fieldName)?.toString() ?? '';
        if (val.trim()) {
          const hp = await recordHoneypotTrigger(fieldName, val);
          if (hp.banned) {
            setError(isRtl ? 'تم حظر الوصول مؤقتاً' : 'Access temporarily blocked');
          } else {
            setError(isRtl ? 'بيانات الدخول غير صحيحة' : 'Invalid credentials');
          }
          setLoading(false);
          return;
        }
      }

      let user;
      if (isRegister) {
        if (!name.trim()) { setError(isRtl ? 'الاسم مطلوب' : 'Name is required'); setLoading(false); return; }
        user = await registerUser(name, email, password);
      } else {
        user = await loginUser(email, password);
      }
      setUser(user);
      setShowLoginModal(false);
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      setError(err.message ?? (isRtl ? 'بيانات الدخول غير صحيحة' : 'Invalid credentials'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setOauthLoading(true);
    try {
      // Dynamic import to avoid bundling firebase/auth when not needed
      const { getAuth, GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const { displayName, email: gEmail, photoURL } = result.user;
      if (!gEmail) throw new Error(isRtl ? 'لم يتم الحصول على البريد من Google' : 'Could not get email from Google');
      const user = await loginOAuth(displayName ?? gEmail, gEmail, photoURL ?? undefined);
      setUser(user);
      setShowLoginModal(false);
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      // User closed popup — not a real error
      if (err?.code !== 'auth/popup-closed-by-user' && err?.code !== 'auth/cancelled-popup-request') {
        setError(err.message ?? (isRtl ? 'فشل تسجيل الدخول بـ Google' : 'Google login failed'));
      }
    } finally {
      setOauthLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="glass glow-lg rounded-2xl p-6 w-full max-w-sm space-y-5"
          onClick={e => e.stopPropagation()}
        >
          <div className="text-center space-y-2">
            <img
              src="/logo.png"
              alt="𓂀"
              className="w-16 h-16 mx-auto select-none pointer-events-none drop-shadow-[0_0_20px_rgba(251,191,36,0.35)] rounded-full"
              draggable={false}
            />
            <h2 className="text-xl font-bold font-[var(--font-display)] text-[var(--text-primary)]">
              {isRegister
                ? (isRtl ? 'حساب جديد' : 'Create Account')
                : (isRtl ? 'تسجيل الدخول' : 'Login')}
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              {isRtl ? 'أدخل بياناتك للوصول إلى وزير' : 'Enter your credentials to access Wazeer'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {isRegister && (
              <input
                type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder={isRtl ? 'الاسم' : 'Name'} required
                className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-dim)] text-sm focus:outline-none focus:border-[var(--accent-500)] transition-colors"
              />
            )}
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder={isRtl ? 'البريد الإلكتروني' : 'Email'} required dir="ltr"
              className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-dim)] text-sm focus:outline-none focus:border-[var(--accent-500)] transition-colors"
            />
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder={isRtl ? 'كلمة المرور' : 'Password'} required dir="ltr"
              className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-dim)] text-sm focus:outline-none focus:border-[var(--accent-500)] transition-colors"
            />
            {/* Honeypot fields — invisible to humans, bots will fill these */}
            <input
              name="wazeer_login_company"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none', height: 0, width: 0 }}
            />
            <input
              name="wazeer_login_city"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none', height: 0, width: 0 }}
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-lg bg-[var(--accent-500)] text-[var(--bg-outer)] font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50 cursor-pointer">
              {loading
                ? (isRtl ? 'جاري...' : 'Loading...')
                : (isRegister
                  ? (isRtl ? 'إنشاء حساب' : 'Create Account')
                  : (isRtl ? 'دخول' : 'Login'))}
            </button>
          </form>

          <button
            onClick={() => { setIsRegister(!isRegister); setError(''); }}
            className="w-full py-2 text-sm text-[var(--text-dim)] hover:text-[var(--text-muted)] transition-colors cursor-pointer"
          >
            {isRegister
              ? (isRtl ? 'لديك حساب؟ سجل دخول' : 'Already have an account? Login')
              : (isRtl ? 'ليس لديك حساب؟ أنشئ واحد' : 'No account? Create one')}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[var(--border)]" />
            <span className="text-xs text-[var(--text-dim)]">{isRtl ? 'أو' : 'or'}</span>
            <div className="flex-1 h-px bg-[var(--border)]" />
          </div>

          {/* Google OAuth */}
          <button
            onClick={handleGoogleLogin}
            disabled={oauthLoading || loading}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-lg bg-white/5 border border-[var(--border)] text-[var(--text-primary)] text-sm font-medium hover:bg-white/10 transition-all disabled:opacity-50 cursor-pointer"
          >
            {oauthLoading ? (
              <span className="w-4 h-4 rounded-full border-2 border-[var(--accent-500)] border-t-transparent animate-spin" />
            ) : (
              <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            {isRtl ? 'تسجيل الدخول بـ Google' : 'Continue with Google'}
          </button>

          <button
            onClick={() => setShowLoginModal(false)}
            className="w-full py-2 text-xs text-[var(--text-dim)] hover:text-[var(--text-muted)] transition-colors cursor-pointer"
          >
            {isRtl ? 'متابعة بدون تسجيل' : 'Continue without login'}
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
