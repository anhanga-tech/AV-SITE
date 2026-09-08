import { triggerHaptic, type HapticPattern } from './haptics';

interface OpenAiChatOptions {
  message?: string;
  haptic?: HapticPattern | 'none';
}

// O AIChat é lazy() (App.tsx) — seu listener de `toggle-ai-chat` só existe depois que o
// chunk monta. Um dispatch antes disso (ex.: submit do MobileHeroForm na home, que é SSR
// síncrona e monta antes do AIChat) se perderia silenciosamente. Este módulo é importado
// tanto pelo dispatcher (MobileHeroForm etc.) quanto pelo AIChat, então um flag de módulo
// diz se o listener já está vivo: se não estiver, o intent fica bufferizado e é drenado
// quando o AIChat montar (registerAiChatToggleListener).
let aiChatListenerRegistered = false;
let bufferedOpen: OpenAiChatOptions | undefined;

export function registerAiChatToggleListener(): void {
  aiChatListenerRegistered = true;
  if (bufferedOpen) {
    const pending = bufferedOpen;
    bufferedOpen = undefined;
    dispatchOpenAiChat(pending);
  }
}

export function openAiChat(options: OpenAiChatOptions = {}): void {
  if (typeof window === 'undefined') {
    return;
  }

  const { message, haptic = 'light' } = options;

  if (haptic !== 'none') {
    void triggerHaptic(haptic);
  }

  if (!aiChatListenerRegistered) {
    // AIChat ainda não montou — guarda o intent para drenar na montagem.
    bufferedOpen = { message, haptic: 'none' };
    return;
  }

  dispatchOpenAiChat({ message, haptic: 'none' });
}

function dispatchOpenAiChat(options: OpenAiChatOptions): void {
  const { message } = options;
  const detail = message ? { message } : undefined;
  window.dispatchEvent(new CustomEvent('toggle-ai-chat', { detail }));
}
