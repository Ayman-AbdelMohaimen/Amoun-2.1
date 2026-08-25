import { useState, useEffect } from 'react';
import {
  Key, Palette, Globe, Mic, Volume2, Trash2, Save, Eye, EyeOff, Check,
  Sparkles, ShieldCheck, RefreshCw, Cpu, Zap
} from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { wazeerDB } from '@/lib/db';
import { THEME_PRESETS, PROVIDERS } from '@/constants';
import { testModel } from '@/services/AIGateway';
import GovernanceCouncil from '@/components/settings/GovernanceCouncil';
import type { CustomModel, ThemePreset } from '@/types';

export default function SettingsView() {
  const {
    currentLanguage, setLanguage, theme, setTheme, accentColor, setAccentColor,
    voiceEnabled, toggleVoice, voiceGender, setVoiceGender,
    customModels, removeCustomModel,
    hasCompletedOnboarding, setShowOnboardingWizard,
  } = useWorkspaceStore();

  const isRtl = currentLanguage === 'ar';
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);

  // ⚡ Model tester state — per provider or custom model id
  const [testState, setTestState] = useState<Record<string, { status: 'running' | 'ok' | 'fail'; message: string }>>({});

  const handleTestProvider = async (providerId: string) => {
    const provider = PROVIDERS.find(p => p.id === providerId);
    const firstModel = provider?.models[0];
    if (!provider || !firstModel) return;
    setTestState(prev => ({ ...prev, [providerId]: { status: 'running', message: '' } }));
    const result = await testModel(provider.id, firstModel.modelId, undefined, isRtl);
    setTestState(prev => ({
      ...prev,
      [providerId]: { status: result.ok ? 'ok' : 'fail', message: `${firstModel.displayName}: ${result.message}` },
    }));
  };

  const handleTestCustom = async (cm: CustomModel) => {
    setTestState(prev => ({ ...prev, [cm.id]: { status: 'running', message: '' } }));
    const result = cm.providerId
      ? await testModel(cm.providerId, cm.modelId, undefined, isRtl)
      : await testModel('custom', cm.modelId, cm, isRtl);
    setTestState(prev => ({
      ...prev,
      [cm.id]: { status: result.ok ? 'ok' : 'fail', message: `${cm.displayName ?? cm.modelId}: ${result.message}` },
    }));
  };

  const loadKeys = async () => {
    const k = await wazeerDB.getApiKeys();
    setApiKeys(k);
  };

  useEffect(() => {
    loadKeys();
  }, []);

  const saveKeys = async () => {
    await wazeerDB.saveApiKeys(apiKeys);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const updateKey = (provider: string, value: string) => {
    setApiKeys(prev => ({ ...prev, [provider]: value }));
  };

  const deleteKey = (provider: string) => {
    const next = { ...apiKeys };
    delete next[provider];
    setApiKeys(next);
  };

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6 max-w-4xl mx-auto custom-scrollbar">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
        <div>
          <h1 className="text-xl font-bold font-[var(--font-display)] text-[var(--text-primary)]">
            {isRtl ? 'الإعدادات' : 'Settings'}
          </h1>
          <p className="text-xs text-[var(--text-dim)] mt-0.5">
            {isRtl ? 'تخصيص المفاتيح والمظهر وسلوك الوزير' : 'Configure API keys, appearance, and voice options'}
          </p>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
          <ShieldCheck size={13} />
          <span>BYOK • {isRtl ? 'مشفر محلياً' : 'Local Encryption'}</span>
        </div>
      </div>

      {/* ── API Keys Section (BYOK) ─────────────────────────────────── */}
      <div className="glass rounded-2xl p-5 border border-white/5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Key size={16} className="text-[var(--accent-400)]" />
            {isRtl ? 'مفاتيح الـ API (BYOK)' : 'API Keys (Bring Your Own Key)'}
          </h2>
          <button
            onClick={loadKeys}
            className="text-xs text-[var(--accent-400)] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw size={12} />
            {isRtl ? 'تحميل المفاتيح' : 'Reload Keys'}
          </button>
        </div>

        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          {isRtl
            ? 'يتم تخزين جميع المفاتيح في متصفحك محلياً عبر قاعدة بيانات مشفرة (IndexedDB) ولا يتم إرسالها لأي خادم وسيط.'
            : 'All API keys are securely stored locally inside your browser via IndexedDB and never touch an intermediate server.'}
        </p>

        {/* Form wrapper: browser consoles warn about standalone password fields.
            Submit (button click OR Enter key) saves the keys. */}
        <form className="space-y-3 pt-2" onSubmit={e => { e.preventDefault(); saveKeys(); }}>
          {PROVIDERS.map(p => (
            <div key={p.id} className="flex flex-col sm:flex-row sm:items-center gap-2 p-2.5 rounded-xl bg-white/2 border border-white/5 hover:border-white/10 transition-colors">
              {/* Provider name — no icon (it crowded the label); full name with tooltip on overflow */}
              <label
                className="sm:w-36 shrink-0 text-xs font-mono font-medium text-[var(--text-secondary)] truncate cursor-default"
                title={p.displayName || p.id}
              >
                {p.displayName || p.id}
              </label>

              <div className="flex-1">
                <div className="relative flex items-center">
                  <input
                    type={showKeys[p.id] ? 'text' : 'password'}
                    value={apiKeys[p.id] ?? ''}
                    onChange={e => updateKey(p.id, e.target.value)}
                    placeholder={isRtl ? `أدخل مفتاح ${p.displayName}...` : `Enter ${p.displayName} key...`}
                    dir="ltr"
                    className="w-full bg-black/40 border border-[var(--border)] rounded-lg px-3 py-2 text-xs outline-none focus:border-[var(--accent-400)] text-[var(--text-primary)] placeholder:text-[var(--text-dim)] font-mono pe-[76px]"
                  />

                  <div className="absolute end-2 flex items-center gap-1">
                    {/* ⚡ Connection tester — pings the provider's primary model */}
                    <button
                      type="button"
                      onClick={() => handleTestProvider(p.id)}
                      disabled={testState[p.id]?.status === 'running'}
                      className={`p-1 rounded transition-colors cursor-pointer disabled:opacity-60 ${
                        testState[p.id]?.status === 'ok'
                          ? 'text-emerald-400'
                          : testState[p.id]?.status === 'fail'
                            ? 'text-red-400'
                            : 'text-[var(--text-dim)] hover:text-[var(--accent-400)] hover:bg-white/10'
                      }`}
                      title={isRtl ? 'فحص الاتصال' : 'Test connection'}
                    >
                      <Zap size={13} className={testState[p.id]?.status === 'running' ? 'animate-pulse' : ''} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowKeys(prev => ({ ...prev, [p.id]: !prev[p.id] }))}
                      className="p-1 rounded text-[var(--text-dim)] hover:text-[var(--text-primary)] hover:bg-white/10 transition-colors cursor-pointer"
                      title={showKeys[p.id] ? (isRtl ? 'إخفاء' : 'Hide') : (isRtl ? 'إظهار' : 'Show')}
                    >
                      {showKeys[p.id] ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteKey(p.id)}
                      className="p-1 rounded text-[var(--text-dim)] hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                      title={isRtl ? 'حذف' : 'Delete'}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                {/* Test result line */}
                {testState[p.id]?.message && (
                  <p className={`text-[10px] mt-1 font-mono ${testState[p.id].status === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {testState[p.id].message}
                  </p>
                )}
              </div>
            </div>
          ))}

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg ${
                saved
                  ? 'bg-emerald-500 text-black shadow-emerald-500/30'
                  : 'bg-[var(--accent-400)] text-black hover:opacity-90 shadow-[0_0_20px_rgba(45,212,191,0.3)]'
              }`}
            >
              {saved ? (
                <>
                  <Check size={15} />
                  <span>{isRtl ? 'تم حفظ المفاتيح بنجاح!' : 'Keys Saved Successfully!'}</span>
                </>
              ) : (
                <>
                  <Save size={15} />
                  <span>{isRtl ? 'حفظ المفاتيح' : 'Save Keys'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ── Theme & Appearance ──────────────────────────────────────── */}
      <div className="glass rounded-2xl p-5 border border-white/5 shadow-xl space-y-4">
        <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Palette size={16} className="text-[var(--accent-400)]" />
          {isRtl ? 'المظهر والألوان' : 'Appearance & Themes'}
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {(['emerald', 'cyber-blue', 'crimson', 'purple'] as ThemePreset[]).map(t => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`p-3 rounded-xl text-center transition-all cursor-pointer border ${
                theme === t
                  ? 'border-[var(--accent-400)] bg-[var(--accent-500)]/15 shadow-[0_0_15px_rgba(45,212,191,0.2)]'
                  : 'border-white/5 bg-white/2 hover:bg-white/5'
              }`}
            >
              <div
                className="w-7 h-7 rounded-full mx-auto mb-2 shadow-md"
                style={{ background: THEME_PRESETS[t].accent400 }}
              />
              <span className="text-xs font-medium text-[var(--text-secondary)] capitalize block">
                {t.replace('-', ' ')}
              </span>
            </button>
          ))}

          {/* Custom Hex Color Picker */}
          <div className="p-3 rounded-xl text-center border border-white/5 bg-white/2 flex flex-col items-center justify-center">
            <input
              type="color"
              value={accentColor.startsWith('#') ? accentColor : '#2dd4bf'}
              onChange={e => {
                setTheme('custom');
                setAccentColor(e.target.value);
              }}
              className="w-7 h-7 rounded-full cursor-pointer bg-transparent border-0 mb-1"
            />
            <span className="text-xs font-medium text-[var(--text-muted)]">
              {isRtl ? 'لون مخصص' : 'Custom'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Language & Voice ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Language */}
        <div className="glass rounded-2xl p-5 border border-white/5 space-y-3">
          <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Globe size={16} className="text-[var(--accent-400)]" />
            {isRtl ? 'لغة الواجهة' : 'Interface Language'}
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setLanguage('ar')}
              className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                currentLanguage === 'ar'
                  ? 'bg-[var(--accent-500)]/20 text-[var(--accent-400)] border-[var(--accent-400)]'
                  : 'border-white/5 text-[var(--text-muted)] hover:bg-white/5'
              }`}
            >
              🇪🇬 العربية (AR)
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                currentLanguage === 'en'
                  ? 'bg-[var(--accent-500)]/20 text-[var(--accent-400)] border-[var(--accent-400)]'
                  : 'border-white/5 text-[var(--text-muted)] hover:bg-white/5'
              }`}
            >
              🇺🇸 English (EN)
            </button>
          </div>
        </div>

        {/* Voice Options */}
        <div className="glass rounded-2xl p-5 border border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Mic size={16} className="text-[var(--accent-400)]" />
              {isRtl ? 'الصوت والقراءة (TTS)' : 'Voice & Speech'}
            </h2>
            <button
              onClick={toggleVoice}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                voiceEnabled ? 'bg-[var(--accent-500)]' : 'bg-white/10'
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                  voiceEnabled ? (isRtl ? 'end-1' : 'start-6') : (isRtl ? 'end-6' : 'start-1')
                }`}
              />
            </button>
          </div>

          {voiceEnabled && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => setVoiceGender('male')}
                className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  voiceGender === 'male'
                    ? 'bg-[var(--accent-400)]/20 text-[var(--accent-400)] font-bold'
                    : 'text-[var(--text-muted)] hover:bg-white/5'
                }`}
              >
                <Volume2 size={13} /> {isRtl ? 'صوت ذكر' : 'Male Voice'}
              </button>
              <button
                onClick={() => setVoiceGender('female')}
                className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  voiceGender === 'female'
                    ? 'bg-[var(--accent-400)]/20 text-[var(--accent-400)] font-bold'
                    : 'text-[var(--text-muted)] hover:bg-white/5'
                }`}
              >
                <Volume2 size={13} /> {isRtl ? 'صوت أنثى' : 'Female Voice'}
              </button>
            </div>
          )}
        </div>

      </div>

      {/* ── Custom Models Section ───────────────────────────────────── */}
      {customModels.length > 0 && (
        <div className="glass rounded-2xl p-5 border border-white/5 space-y-3">
          <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Cpu size={16} className="text-[var(--accent-400)]" />
            {isRtl ? 'النماذج المخصصة المضافة' : 'Custom Models'}
          </h2>
          <div className="space-y-2">
            {customModels.map(m => (
              <div key={m.id} className="p-2.5 rounded-xl bg-white/2 border border-white/5">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                      {m.displayName ?? `${m.providerName} — ${m.modelId}`}
                    </p>
                    <p className="text-[10px] text-[var(--text-dim)] font-mono truncate" dir="ltr">
                      {m.endpoint ?? m.providerName}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {/* ⚡ Connection tester for user-added models */}
                    <button
                      type="button"
                      onClick={() => handleTestCustom(m)}
                      disabled={testState[m.id]?.status === 'running'}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-60 ${
                        testState[m.id]?.status === 'ok'
                          ? 'text-emerald-400'
                          : testState[m.id]?.status === 'fail'
                            ? 'text-red-400'
                            : 'text-[var(--text-dim)] hover:text-[var(--accent-400)] hover:bg-white/10'
                      }`}
                      title={isRtl ? 'فحص الاتصال' : 'Test connection'}
                    >
                      <Zap size={13} className={testState[m.id]?.status === 'running' ? 'animate-pulse' : ''} />
                    </button>
                    <button
                      onClick={() => removeCustomModel(m.id)}
                      className="p-1.5 rounded-lg text-[var(--text-dim)] hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                {testState[m.id]?.message && (
                  <p className={`text-[10px] mt-1.5 font-mono ${testState[m.id].status === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {testState[m.id].message}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Onboarding Setup Wizard ─────────────────────────────────── */}
      <div className="glass rounded-2xl p-5 border border-white/5 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-[var(--text-primary)] mb-0.5 flex items-center gap-1.5">
            <Sparkles size={14} className="text-[var(--accent-400)]" />
            {isRtl ? 'معالج الإعداد التوجيهي' : 'Setup Wizard'}
          </p>
          <p className="text-xs text-[var(--text-dim)]">
            {hasCompletedOnboarding
              ? (isRtl ? 'تم إكمال الإعداد مسبقاً' : 'Completed previously')
              : (isRtl ? 'لم يكتمل بعد' : 'Not yet completed')}
          </p>
        </div>
        <button
          onClick={() => setShowOnboardingWizard(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[var(--accent-500)]/15 text-[var(--accent-400)] hover:bg-[var(--accent-500)]/25 transition-colors cursor-pointer"
        >
          <Sparkles size={13} />
          {isRtl ? (hasCompletedOnboarding ? 'إعادة التشغيل' : 'ابدأ الآن') : (hasCompletedOnboarding ? 'Restart' : 'Start Now')}
        </button>
      </div>

      {/* ── Governance Council — Memory Optimizer & Reset ───────────── */}
      <GovernanceCouncil />

    </div>
  );
}