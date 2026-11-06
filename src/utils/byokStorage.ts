/**
 * BYOK (Bring Your Own Key) Client-Side Storage & Management Utility
 * 
 * Strict Privacy & Security Mandates:
 * - Keys are stored SOLELY in the user's browser localStorage under 'minnese_byok_config'.
 * - NEVER sent to analytics, telemetry, or server database.
 * - In-flight keys are transmitted only via ephemeral HTTP headers for immediate processing.
 * - Zero server-side persistence or console logging.
 */

export interface BYOKConfig {
  geminiApiKey?: string;
  deepseekApiKey?: string;
  provider?: 'gemini' | 'deepseek';
  updatedAt?: number;
}

export const BYOK_STORAGE_KEY = 'minnese_byok_config';
export const BYOK_UPDATED_EVENT = 'minnese_byok_updated';

/**
 * Retrieve current BYOK config from browser localStorage.
 */
export function getBYOKConfig(): BYOKConfig {
  if (typeof window === 'undefined') {
    return {};
  }
  try {
    const raw = localStorage.getItem(BYOK_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Save updated BYOK config to browser localStorage and broadcast update event.
 */
export function saveBYOKConfig(config: BYOKConfig): void {
  if (typeof window === 'undefined') return;
  try {
    const sanitized: BYOKConfig = {
      geminiApiKey: config.geminiApiKey?.trim() || undefined,
      deepseekApiKey: config.deepseekApiKey?.trim() || undefined,
      provider: config.provider || 'gemini',
      updatedAt: Date.now(),
    };
    localStorage.setItem(BYOK_STORAGE_KEY, JSON.stringify(sanitized));
    window.dispatchEvent(new CustomEvent(BYOK_UPDATED_EVENT, { detail: sanitized }));
  } catch (err) {
    console.warn('[BYOK] Could not save config to localStorage:', err);
  }
}

/**
 * Remove all personal API keys from localStorage.
 */
export function clearBYOKConfig(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(BYOK_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(BYOK_UPDATED_EVENT, { detail: {} }));
  } catch (err) {
    console.warn('[BYOK] Could not clear config from localStorage:', err);
  }
}

/**
 * Get active Gemini API Key if configured.
 */
export function getGeminiKey(): string | undefined {
  const config = getBYOKConfig();
  const key = config.geminiApiKey?.trim();
  return key && key.length > 5 ? key : undefined;
}

/**
 * Check if the user has a configured Gemini key.
 */
export function hasValidGeminiKey(): boolean {
  return Boolean(getGeminiKey());
}

/**
 * Build request headers including ephemeral BYOK keys if present.
 */
export function getBYOKHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = { ...customHeaders };
  const geminiKey = getGeminiKey();
  if (geminiKey) {
    headers['X-BYOK-Gemini-Key'] = geminiKey;
    headers['X-BYOK-Api-Key'] = geminiKey;
  }
  return headers;
}

export interface KeyTestResult {
  success: boolean;
  message: string;
  model?: string;
}

/**
 * Validate Gemini API Key via backend validation route or client-side check.
 * Strictly avoids logging key content.
 */
export async function testGeminiKey(apiKey: string): Promise<KeyTestResult> {
  const trimmed = apiKey?.trim();
  if (!trimmed) {
    return { success: false, message: 'Vui lòng nhập API Key trước khi kiểm tra.' };
  }
  if (!trimmed.startsWith('AIza') || trimmed.length < 25) {
    return {
      success: false,
      message: 'Định dạng Key không hợp lệ. Google Gemini API Key thường bắt đầu bằng "AIza...".',
    };
  }

  try {
    const res = await fetch('/api/byok/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-BYOK-Gemini-Key': trimmed,
      },
      body: JSON.stringify({}),
    });

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        success: true,
        message: data.message || 'Kết nối thành công! Key hợp lệ và sẵn sàng sử dụng.',
        model: data.model || 'Gemini 1.5/Flash',
      };
    }

    const errData = await res.json().catch(() => ({}));
    const errMsg = errData.message || errData.error || `Lỗi máy chủ (${res.status})`;
    return {
      success: false,
      message: errMsg,
    };
  } catch (err: any) {
    return {
      success: false,
      message: 'Không thể kết nối đến máy chủ để xác thực. Vui lòng kiểm tra mạng của bạn.',
    };
  }
}
