import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { loginUser, registerUser } from '@/services/AuthService';

export default function LoginModal() {
  const { currentLanguage, setUser, setShowLoginModal } = useWorkspaceStore();
  const isRtl = currentLanguage === 'ar';
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
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
