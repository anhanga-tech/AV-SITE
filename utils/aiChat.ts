import { triggerHaptic, type HapticPattern } from './haptics';

interface OpenAiChatOptions {
  message?: string;
  haptic?: HapticPattern | 'none';
}

export function openAiChat(options: OpenAiChatOptions = {}): void {
  if (typeof window === 'undefined') {
    return;
  }

  const { message, haptic = 'light' } = options;

  if (haptic !== 'none') {
    void triggerHaptic(haptic);
  }

  const detail = message ? { message } : undefined;
  window.dispatchEvent(new CustomEvent('toggle-ai-chat', { detail }));
}
