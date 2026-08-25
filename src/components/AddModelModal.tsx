import { useState } from 'react';
import { X, Globe, Key, Server, Cpu, Eye, Wifi, Layers, Trash2, Tag } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { wazeerDB } from '@/lib/db';
import { PROVIDERS } from '@/constants';
import type { CustomModel, LLMProviderId } from '@/types';

export default function AddModelModal() {
  const { showAddModelModal, setShowAddModelModal, customModels, addCustomModel, removeCustomModel, currentLanguage } = useWorkspaceStore();
  const isRtl = currentLanguage === 'ar';

  // 'provider' → add a model inside a built-in provider group (uses its key)
  // 'custom'   → fully custom endpoint with its own key
  const [mode, setMode] = useState<'provider' | 'custom'>('provider');
  const [providerId, setProviderId] = useState<string>('openrouter');
  const [providerName, setProviderName] = useState('');
  const [modelId, setModelId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [hasVision, setHasVision] = useState(false);
  const [error, setError] = useState('');

  if (!showAddModelModal) return null;

  const selectedProvider = PROVIDERS.find(p => p.id === providerId);

  const handleSubmit = async () => {
    setError('');
    const slug = modelId.trim();
    if (!slug) {
      setError(isRtl ? 'معرف النموذج مطلوب' : 'Model ID is required');
      return;
    }

    if (mode === 'provider') {
      if (!selectedProvider) {
        setError(isRtl ? 'اختار الـ Provider' : 'Pick a provider');
        return;
      }
      if (customModels.some(m => m.providerId === selectedProvider.id && m.modelId === slug)) {
        setError(isRtl ? 'الموديل ده موجود بالفعل في المجموعة' : 'Model already exists in this group');
        return;
      }
      const model: CustomModel = {
        id: crypto.randomUUID(),
        providerId: selectedProvider.id,
        providerName: selectedProvider.displayName,
        modelId: slug,
        displayName: displayName.trim() || slug,
        apiKeyConfigKey: selectedProvider.id, // uses the provider key from Settings
        hasVision,
        hasStreaming: true,
        createdAt: new Date().toISOString(),
      };
      addCustomModel(model);
    } else {
      if (!providerName.trim() || !apiKey.trim() || !endpoint.trim()) {
        setError(isRtl ? 'كل الحقول مطلوبة' : 'All fields are required');
        return;
      }
      try { new URL(endpoint); } catch {
        setError(isRtl ? 'رابط غير صالح' : 'Invalid URL');
        return;
      }
      const configKey = `custom_${providerName.toLowerCase().replace(/\s+/g, '_')}`;
      const keys = await wazeerDB.getApiKeys();
      keys[configKey] = apiKey;
      await wazeerDB.saveApiKeys(keys);

      const model: CustomModel = {
        id: crypto.randomUUID(),
        providerName: providerName.trim(),
        modelId: slug,
        displayName: displayName.trim() || `${providerName.trim()} / ${slug}`,
        endpoint: endpoint.trim(),
        apiKeyConfigKey: configKey,
        hasVision,
        hasStreaming: true,
        createdAt: new Date().toISOString(),
      };
      addCustomModel(model);
    }
    resetAndClose();
  };

  const resetAndClose = () => {
    setMode('provider'); setProviderId('openrouter'); setProviderName(''); setModelId('');
    setDisplayName(''); setApiKey(''); setEndpoint('');
    setHasVision(false); setError(''); setShowAddModelModal(false);
  };

  const modeTabs = [
    { id: 'provider' as const, icon: Layers, labelAr: 'موديل جوه Provider', labelEn: 'Provider Model' },
    { id: 'custom' as const, icon: Globe, labelAr: 'Endpoint مخصص', labelEn: 'Custom Endpoint' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={resetAndClose}>
      <div className="glass rounded-2xl w-full max-w-md p-6 space-y-4 max-h-[90dvh] overflow-y-auto custom-scrollbar" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold font-[var(--font-display)]">{isRtl ? 'إضافة نموذج' : 'Add Model'}</h2>
          <button onClick={resetAndClose} className="p-1 rounded-lg hover:bg-white/10 text-[var(--text-muted)]"><X size={18} /></button>
        </div>

        {/* Mode tabs */}
        <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-white/5">
          {modeTabs.map(t => (
            <button
              key={t.id}
              onClick={() => { setMode(t.id); setError(''); }}
              className={"flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer " +
                (mode === t.id ? 'bg-[var(--accent-500)]/20 text-[var(--accent-400)]' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]')}
            >
              <t.icon size={13} /> {isRtl ? t.labelAr : t.labelEn}
            </button>
          ))}
        </div>

        <form className="space-y-3" onSubmit={e => { e.preventDefault(); handleSubmit(); }}>
          {mode === 'provider' ? (
            <>
              {/* Provider group picker */}
              <div>
                <label className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-1.5">
                  <Layers size={13} /> {isRtl ? 'مجموعة الـ Provider' : 'Provider Group'}
                </label>
                <select
                  value={providerId}
                  onChange={e => setProviderId(e.target.value)}
                  className="w-full bg-white/5 border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-400)] transition-colors cursor-pointer"
                >
                  {PROVIDERS.map(p => (
                    <option key={p.id} value={p.id} className="bg-[#161822] text-white">
                      {p.displayName}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-[var(--text-dim)] mt-1">
                  {isRtl
                    ? `هيستخدم مفتاح ${selectedProvider?.displayName} من صفحة الإعدادات`
                    : `Will use the ${selectedProvider?.displayName} key from Settings`}
                </p>
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-1.5">
                  <Cpu size={13} /> {isRtl ? 'معرف النموذج (Slug)' : 'Model ID (slug)'}
                </label>
                <input
                  type="text" value={modelId} onChange={e => setModelId(e.target.value)}
                  placeholder="e.g. meta-llama/llama-3.3-70b-instruct:free" dir="ltr"
                  className="w-full bg-white/5 border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-dim)] outline-none focus:border-[var(--accent-400)] transition-colors font-mono"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-1.5">
                  <Server size={13} /> {isRtl ? 'اسم المزود' : 'Provider Name'}
                </label>
                <input
                  type="text" value={providerName} onChange={e => setProviderName(e.target.value)}
                  placeholder="e.g. Groq, DeepSeek" dir="auto"
                  className="w-full bg-white/5 border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-dim)] outline-none focus:border-[var(--accent-400)] transition-colors"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-1.5">
                  <Key size={13} /> API Key
                </label>
                <input
                  type="password" autoComplete="off" value={apiKey} onChange={e => setApiKey(e.target.value)}
                  placeholder={isRtl ? 'أدخل مفتاح الـ API' : 'Enter API key'} dir="ltr"
                  className="w-full bg-white/5 border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-dim)] outline-none focus:border-[var(--accent-400)] transition-colors"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-1.5">
                  <Globe size={13} /> {isRtl ? 'رابط الـ Endpoint' : 'Endpoint URL'}
                </label>
                <input
                  type="url" value={endpoint} onChange={e => setEndpoint(e.target.value)}
                  placeholder="https://api.groq.com/openai/v1/chat/completions" dir="ltr"
                  className="w-full bg-white/5 border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-dim)] outline-none focus:border-[var(--accent-400)] transition-colors"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-1.5">
                  <Cpu size={13} /> {isRtl ? 'معرف النموذج' : 'Model ID'}
                </label>
                <input
                  type="text" value={modelId} onChange={e => setModelId(e.target.value)}
                  placeholder="e.g. llama-3.3-70b-versatile" dir="ltr"
                  className="w-full bg-white/5 border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-dim)] outline-none focus:border-[var(--accent-400)] transition-colors font-mono"
                />
              </div>
            </>
          )}

          {/* Shared: display name + vision */}
          <div>
            <label className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-1.5">
              <Tag size={13} /> {isRtl ? 'اسم العرض (اختياري)' : 'Display Name (optional)'}
            </label>
            <input
              type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
              placeholder={isRtl ? 'مثال: لاما 70B المجاني' : 'e.g. Llama 70B Free'} dir="auto"
              className="w-full bg-white/5 border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-dim)] outline-none focus:border-[var(--accent-400)] transition-colors"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer w-fit">
            <div className={"w-9 h-5 rounded-full transition-colors relative " + (hasVision ? 'bg-[var(--accent-500)]' : 'bg-white/10')} onClick={() => setHasVision(!hasVision)}>
              <div className={"absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all " + (hasVision ? 'start-0.5' : 'start-[18px]')} />
            </div>
            <span className="text-sm text-[var(--text-secondary)] flex items-center gap-1.5"><Eye size={14} /> {isRtl ? 'يدعم الصور (Vision)' : 'Vision Support'}</span>
          </label>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={resetAndClose} className="flex-1 py-2.5 rounded-xl text-sm text-[var(--text-secondary)] hover:bg-white/5 transition-colors cursor-pointer">{isRtl ? 'إلغاء' : 'Cancel'}</button>
            <button type="submit" className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-[var(--accent-400)] text-black hover:brightness-110 transition-all cursor-pointer">{isRtl ? 'إضافة' : 'Add Model'}</button>
          </div>
        </form>

        {customModels.length > 0 && (
          <div className="border-t border-[var(--border)] pt-3">
            <p className="text-xs text-[var(--text-dim)] mb-2">
              {isRtl ? 'النماذج المضافة (اضغط 🗑 للحذف):' : 'Added models (click 🗑 to remove):'}
            </p>
            <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
              {customModels.map(m => (
                <div key={m.id} className="flex items-center justify-between gap-2 text-xs text-[var(--text-muted)] p-1.5 rounded bg-white/3">
                  <span className="truncate" title={`${m.providerName} — ${m.modelId}`}>
                    <span className="text-[var(--text-secondary)] font-medium">{m.displayName ?? m.modelId}</span>
                    <span className="text-[var(--text-dim)]"> · {m.providerName}</span>
                  </span>
                  <span className="flex items-center gap-1.5 shrink-0">
                    <Wifi size={12} className={m.hasVision ? 'text-[var(--accent-400)]' : 'text-[var(--text-dim)] opacity-40'} />
                    <button
                      onClick={() => removeCustomModel(m.id)}
                      className="p-1 rounded text-[var(--text-dim)] hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                      title={isRtl ? 'حذف' : 'Remove'}
                    >
                      <Trash2 size={12} />
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
