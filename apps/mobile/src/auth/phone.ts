/**
 * 将用户输入规范为 E.164（当前主要支持中国大陆 11 位手机号，也可输入带 + 的国际格式）。
 */
export function normalizePhoneToE164(raw: string): string | null {
  const s = raw.trim().replace(/\s/g, "");
  if (!s) return null;
  if (s.startsWith("+")) {
    const digits = s.slice(1).replace(/\D/g, "");
    if (!digits) return null;
    return `+${digits}`;
  }
  const digits = s.replace(/\D/g, "");
  if (digits.length === 11 && /^1\d{10}$/.test(digits)) {
    return `+86${digits}`;
  }
  if (digits.length >= 8 && digits.length <= 15) {
    return `+${digits}`;
  }
  return null;
}
