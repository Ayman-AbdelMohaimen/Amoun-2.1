import { useState, useEffect } from 'react';
import { Check, SlidersHorizontal, ArrowRight, SkipForward } from 'lucide-react';

export interface SelectionOption {
  id: string;
  label: string;
}

export interface SelectionField {
  id: string;
  label: string;
  type: 'single' | 'multiple';
  options: SelectionOption[];
  defaultSelected?: string | string[];
}

export interface SelectionCardProps {
  title?: string;
  subtitle?: string;
  fields?: SelectionField[];
  timeoutSeconds?: number;
  onSubmit: (result: Record<string, unknown>, formattedText: string) => void;
  onSkip?: () => void;
  isRtl?: boolean;
}

const DEFAULT_FIELDS: SelectionField[] = [
  {
    id: 'style',
    label: 'نمط التصميم',
    type: 'single',
    options: [
      { id: 'pro', label: 'احترافي راقي' },
      { id: 'warm', label: 'تعليمي دافئ' },
      { id: 'modern', label: 'حديث لطيف' },
      { id: 'neon', label: 'نيون خفيف' },
    ],
    defaultSelected: 'pro',
  },
  {
    id: 'audience',
    label: 'الجمهور المستهدف',
    type: 'single',
    options: [
      { id: 'pro_user', label: 'محترف / موظف' },
      { id: 'student', label: 'طالب / متعلم' },
      { id: 'general', label: 'مستخدم عادي' },
      { id: 'public', label: 'عرض عام' },
    ],
    defaultSelected: 'general',
  },
  {
    id: 'length',
    label: 'طول المحتوى',
    type: 'single',
    options: [
      { id: 'detailed', label: 'تفصيلية' },
      { id: 'brief', label: 'مختصرة' },
      { id: 'medium', label: 'متوسطة' },
    ],
    defaultSelected: 'medium',
  },
  {
    id: 'sections',
    label: 'الأقسام المطلوبة',
    type: 'multiple',
    options: [
      { id: 'overview', label: 'نظرة عامة' },
      { id: 'features', label: 'المميزات' },
      { id: 'dev_system', label: 'نظام التطوير' },
      { id: 'how_to_use', label: 'كيفية الاستخدام' },
      { id: 'screenshots', label: 'صور من البرنامج' },
      { id: 'cta', label: 'رابط / CTA' },
      { id: 'ai', label: 'الذكاء الاصطناعي' },
    ],
    defaultSelected: ['overview', 'features', 'dev_system', 'cta'],
  },
  {
    id: 'tone',
    label: 'لغة الكتابة',
    type: 'single',
    options: [
      { id: 'marketing', label: 'تسويقي' },
      { id: 'formal', label: 'رسمي محترم' },
      { id: 'casual', label: 'ودي بسيط' },
    ],
    defaultSelected: 'casual',
  },
  {
    id: 'primaryColor',
    label: 'اللون الأساسي',
    type: 'single',
    options: [
      { id: 'purple', label: 'بنفسجي' },
      { id: 'sky', label: 'أزرق سماوي' },
      { id: 'emerald', label: 'أخضر زمردي' },
      { id: 'navy_gold', label: 'كحلي + ذهبي' },
    ],
    defaultSelected: 'navy_gold',
  },
];

export default function InteractiveSelectionCard({
  title = 'تأكيد التفضيلات (Confirm Preferences)',
  subtitle = 'حدد تفضيلاتك وسيتولى وزير صياغة المطلوب بدقة:',
  fields = DEFAULT_FIELDS,
  timeoutSeconds = 30,
  onSubmit,
  onSkip,
  isRtl = true,
}: SelectionCardProps) {
  const [selections, setSelections] = useState<Record<string, string | string[]>>(() => {
    const initial: Record<string, string | string[]> = {};
    for (const f of fields) {
      if (f.defaultSelected) {
        initial[f.id] = f.defaultSelected;
      } else {
        initial[f.id] = f.type === 'multiple' ? [] : f.options[0]?.id ?? '';
      }
    }
    return initial;
  });

  const [remarks, setRemarks] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(timeoutSeconds);
  const [submitted, setSubmitted] = useState(false);

  // Auto countdown
  useEffect(() => {
    if (secondsLeft <= 0) {
      handleFinalSubmit();
      return;
    }
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  const handleSingleSelect = (fieldId: string, optionId: string) => {
    setSelections((prev) => ({ ...prev, [fieldId]: optionId }));
  };

  const handleMultipleSelect = (fieldId: string, optionId: string) => {
    setSelections((prev) => {
      const current = Array.isArray(prev[fieldId]) ? (prev[fieldId] as string[]) : [];
      const updated = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId];
      return { ...prev, [fieldId]: updated };
    });
  };

  const formatSummaryText = (): string => {
    const lines: string[] = ['[تفضيلات تم تأكيدها]:'];
    for (const f of fields) {
      const val = selections[f.id];
      if (f.type === 'single') {
        const opt = f.options.find((o) => o.id === val);
        lines.push(`• ${f.label}: ${opt ? opt.label : val}`);
      } else if (f.type === 'multiple' && Array.isArray(val)) {
        const labels = val.map((id) => f.options.find((o) => o.id === id)?.label || id);
        lines.push(`• ${f.label}: ${labels.join(', ')}`);
      }
    }
    if (remarks.trim()) {
      lines.push(`• ملاحظات إضافية: ${remarks.trim()}`);
    }
    return lines.join('\n');
  };

  const handleFinalSubmit = () => {
    if (submitted) return;
    setSubmitted(true);
    const summary = formatSummaryText();
    onSubmit({ ...selections, remarks }, summary);
  };

  const handleSkip = () => {
    if (submitted) return;
    setSubmitted(true);
    if (onSkip) {
      onSkip();
    } else {
      onSubmit({ skipped: true }, isRtl ? 'تم تخطي تحديد التفضيلات، استمر بالإعدادات الافتراضية.' : 'Preferences skipped, proceed with defaults.');
    }
  };

  if (submitted) {
    return (
      <div className="glass rounded-2xl p-4 border border-emerald-500/30 bg-emerald-950/15 text-xs text-emerald-300 flex items-center justify-between">
        <span className="flex items-center gap-2">
          <Check size={16} />
          {isRtl ? 'تم تأكيد التفضيلات وإرسالها للوزير ✓' : 'Preferences confirmed & sent to Minister ✓'}
        </span>
      </div>
    );
  }

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="glass rounded-2xl p-4 sm:p-5 border border-[var(--accent-400)]/30 shadow-xl bg-black/40 space-y-4 max-w-2xl my-3 text-start"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={17} className="text-[var(--accent-400)]" />
          <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] font-[var(--font-display)]">
            {title}
          </h3>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[var(--accent-300)]">
          {secondsLeft}s
        </span>
      </div>

      <p className="text-[11px] text-[var(--text-dim)] leading-relaxed">
        {subtitle}
      </p>

      {/* Fields */}
      <div className="space-y-3.5">
        {fields.map((field) => {
          const isMultiple = field.type === 'multiple';
          const currentVal = selections[field.id];

          return (
            <div key={field.id} className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">
                  {field.label}
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 font-mono text-[var(--text-dim)]">
                  {isMultiple ? (isRtl ? 'متعدد' : 'Multiple') : (isRtl ? 'أحادي' : 'Single')}
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {field.options.map((opt) => {
                  const isSelected = isMultiple
                    ? Array.isArray(currentVal) && currentVal.includes(opt.id)
                    : currentVal === opt.id;

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        isMultiple
                          ? handleMultipleSelect(field.id, opt.id)
                          : handleSingleSelect(field.id, opt.id)
                      }
                      className={`text-xs px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-[var(--accent-500)]/20 border-[var(--accent-400)] text-[var(--accent-300)] shadow-sm font-medium'
                          : 'bg-white/5 border-white/10 text-[var(--text-muted)] hover:border-white/20 hover:text-[var(--text-secondary)]'
                      }`}
                    >
                      {isMultiple && (
                        <span
                          className={`w-3.5 h-3.5 rounded flex items-center justify-center border text-[9px] ${
                            isSelected
                              ? 'bg-[var(--accent-400)] border-[var(--accent-400)] text-black'
                              : 'border-white/30'
                          }`}
                        >
                          {isSelected && <Check size={10} />}
                        </span>
                      )}
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Remarks optional textarea */}
        <div className="space-y-1 pt-1">
          <label className="text-xs font-semibold text-[var(--text-secondary)] block">
            {isRtl ? 'ملاحظات إضافية (اختياري)' : 'Remarks (Optional)'}
          </label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder={isRtl ? 'أضف أي تفاصيل أو متطلبات خاصة ترغب بها...' : 'Add any specific details or preferences...'}
            rows={2}
            className="w-full text-xs text-[var(--text-primary)] bg-white/5 rounded-xl p-2.5 border border-white/10 focus:border-[var(--accent-400)]/60 focus:outline-none resize-none placeholder:text-[var(--text-dim)]"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-white/10">
        <button
          type="button"
          onClick={handleSkip}
          className="flex items-center gap-1 text-xs text-[var(--text-dim)] hover:text-white transition-colors cursor-pointer py-1 px-2"
        >
          <SkipForward size={13} />
          <span>{isRtl ? 'تخطي' : 'Skip'}</span>
        </button>

        <button
          type="button"
          onClick={handleFinalSubmit}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent-400)] text-black font-bold text-xs hover:opacity-90 transition-all shadow-md cursor-pointer"
        >
          <span>{isRtl ? `متابعة (${secondsLeft}s)` : `Continue (${secondsLeft}s)`}</span>
          <ArrowRight size={14} className={isRtl ? 'rotate-180' : ''} />
        </button>
      </div>
    </div>
  );
}
