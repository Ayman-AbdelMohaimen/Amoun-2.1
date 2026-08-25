/**
 * Wazeer OS v2.1 — Error Humanizer (shared)
 * Translates raw provider/gateway errors into clear Egyptian-Arabic messages.
 * Used by: workspaceStore (chat bubbles) + AIGateway.testModel (model tester).
 */

/** Extracts the human-readable message from (possibly nested) provider JSON error bodies.
 *  Handles prefixed text ("Too Many Requests: {...}") and prefers OpenRouter's
 *  error.metadata.raw which carries the actually useful upstream message. */
export function unwrapErrorMessage(raw: string): string {
  let current = raw.trim();
  for (let depth = 0; depth < 3; depth++) {
    const start = current.indexOf('{');
    if (start === -1) break;
    try {
      const parsed: unknown = JSON.parse(current.slice(start));
      if (typeof parsed !== 'object' || parsed === null) break;
      const err = (parsed as { error?: { message?: unknown; metadata?: { raw?: unknown } }; message?: unknown }).error;
      const candidate =
        (typeof err?.metadata?.raw === 'string' && err.metadata.raw) ||
        (typeof err?.message === 'string' && err.message) ||
        (typeof (parsed as { message?: unknown }).message === 'string' && (parsed as { message: unknown }).message);
      if (typeof candidate === 'string' && candidate) {
        current = candidate;
        continue;
      }
      break;
    } catch {
      break; // not JSON — return as-is
    }
  }
  return current;
}

/**
 * Translates raw provider/gateway errors into clear Egyptian-Arabic messages.
 * Keeps the technical detail on a second line (capped) for debugging transparency.
 */
export function humanizeError(raw: string, isRtl: boolean): string {
  if (!isRtl) return raw;

  let arabic: string;
  if (/API key not configured/i.test(raw)) {
    const provider = raw.replace(/\s*API key not configured.*/i, '').trim();
    arabic = `🔑 مفتاح ${provider} مش مضبوط — ضيفه من صفحة الإعدادات`;
  } else if (/Failed to fetch|ERR_EMPTY_RESPONSE|NetworkError|network/i.test(raw)) {
    arabic = '🌐 فشل الاتصال بالـ Provider — اتأكد من الإنترنت، أو جرب موديل/بروفايدر تاني';
  } else if (/401|unauthorized|authentication failed|invalid.*key/i.test(raw)) {
    arabic = '🔑 المفتاح غلط أو منتهي — راجعه من صفحة الإعدادات';
  } else if (/429|rate.?limit|resource_exhausted|too many requests/i.test(raw)) {
    arabic = '⏳ الموديل ده واصل الحد المؤقت للطلبات — لو مجاني فبيتقاسم بين المستخدمين. استنى شوية وجرب تاني، أو ضيف مفتاحك الخاص';
  } else if (/404|no longer available|not found|deprecat/i.test(raw)) {
    arabic = '🤔 الموديل ده مش متاح حالياً — اختار موديل تاني من القايمة فوق';
  } else if (/max.?tokens|quota/i.test(raw)) {
    arabic = '📏 الرسالة أطول من حد الـ Tokens المسموح — جرب تصغّر المرفقات أو تبدأ محادثة جديدة';
  } else {
    return raw;
  }
  // Cap the technical detail — provider JSON blobs can be huge walls of text
  const detail = raw.length > 240 ? `${raw.slice(0, 240)}…` : raw;
  return `${arabic}\n\n_(تفاصيل تقنية: ${detail})_`;
}
