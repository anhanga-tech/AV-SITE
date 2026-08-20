import React, { Suspense, lazy, memo, useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChatCircleDots, CircleNotch } from '@phosphor-icons/react';
import ChunkErrorBoundary from './ChunkErrorBoundary';
import { triggerHaptic } from '../utils/haptics';

const AIChatPanel = lazy(() => import('./AIChatPanel'));

// Delay before auto-sending a message from the `toggle-ai-chat` custom event —
// short enough to feel responsive since the trigger already implies intent.
const TOGGLE_EVENT_AUTO_SEND_DELAY_MS = 400;
// Delay before auto-sending a message from a `?chat=open&destino=` deep link —
// lets the drawer's slide-in animation (duration-500) settle first.
const DEEP_LINK_AUTO_SEND_DELAY_MS = 600;

const ChatPanelLoadingFallback: React.FC = () => (
  <div
    role="status"
    aria-live="polite"
    className="fixed bottom-[calc(5.5rem+var(--cookie-banner-h,0px))] right-4 sm:right-6 z-[9999] flex items-center gap-3 bg-white text-zinc-600 shadow-[0_8px_30px_rgba(0,0,0,0.12)] px-5 py-4 rounded-2xl border border-zinc-100"
  >
    <CircleNotch className="size-5 animate-spin text-brand-vibrant" weight="bold" aria-hidden="true" />
    <span className="text-sm font-medium">Carregando assistente…</span>
  </div>
);

// AIChat renders as a sibling of routed page content, not inside a fixed
// wrapper — the default ChunkErrorBoundary fallback (a full-width
// min-h-[40vh] section meant for route-level failures) would render inline
// in the normal document flow and read as a full-page error. This stays
// fixed-position and widget-sized, matching where the trigger button lives.
const ChatPanelErrorFallback: React.FC = () => (
  <div
    role="alert"
    className="fixed bottom-[calc(5.5rem+var(--cookie-banner-h,0px))] right-4 sm:right-6 z-[9999] flex items-center gap-3 bg-white text-zinc-700 shadow-[0_8px_30px_rgba(0,0,0,0.12)] px-5 py-4 rounded-2xl border border-zinc-100 max-w-[280px]"
  >
    <span className="text-sm font-medium flex-1">Não foi possível carregar o assistente.</span>
    <button
      type="button"
      onClick={() => window.location.reload()}
      className="shrink-0 text-xs font-bold text-brand-vibrant underline underline-offset-2"
    >
      Recarregar
    </button>
  </div>
);

/**
 * AIChat — always-mounted floating trigger for the travel-advice chatbot.
 *
 * PERFORMANCE: the button itself is cheap (icon + haptics), but the full chat
 * implementation (message history, react-markdown rendering, lead-capture form,
 * Gemini calls) is lazy-loaded via `AIChatPanel` only once the visitor expresses
 * intent to chat — a click/keyboard activation, the `toggle-ai-chat` custom
 * event, or a `?chat=open`/`?chat=1` deep link. Visitors who never open the
 * chat never download that implementation.
 */
const AIChat: React.FC = memo(() => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasIntent, setHasIntent] = useState(false);
  const [pendingAutoSendMessage, setPendingAutoSendMessage] = useState<string | undefined>();
  const [pendingAutoSendDelayMs, setPendingAutoSendDelayMs] = useState<number | undefined>();
  const [pendingInputPrefill, setPendingInputPrefill] = useState<string | undefined>();
  const triggerRef = useRef<HTMLElement | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const isOrlandoPage = location.pathname.startsWith('/orlando');

  const openChatDrawer = useCallback((enableHaptics: boolean = true) => {
    triggerRef.current = document.activeElement as HTMLElement | null;
    if (enableHaptics) {
      void triggerHaptic('light');
    }
    setHasIntent(true);
    setIsOpen(true);
  }, []);

  const closeChatDrawer = useCallback(() => {
    setIsOpen(false);
  }, []);

  const consumePending = useCallback(() => {
    setPendingAutoSendMessage(undefined);
    setPendingAutoSendDelayMs(undefined);
    setPendingInputPrefill(undefined);
  }, []);

  useEffect(() => {
    const handleToggle = (event: Event) => {
      const customEvent = event as CustomEvent;
      openChatDrawer(false);
      if (customEvent.detail?.message) {
        setPendingAutoSendMessage(customEvent.detail.message);
        setPendingAutoSendDelayMs(TOGGLE_EVENT_AUTO_SEND_DELAY_MS);
      }
    };
    window.addEventListener('toggle-ai-chat', handleToggle);

    // Deep-link support — open chat and optionally pre-fill a destination message
    const CHAT_URL_PARAM = 'chat';
    const DESTINATION_URL_PARAM = 'destino';

    const searchParams = new URLSearchParams(location.search);
    const chatParam = searchParams.get(CHAT_URL_PARAM);
    const destinationParam = searchParams.get(DESTINATION_URL_PARAM);

    if (chatParam === 'open') {
      // One-shot deep-link handler: opening the chat is an unavoidable side effect of
      // a URL param (not a user event), and this same effect also rewrites the URL via
      // navigate() below — so the state can't be derived during render.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional one-shot open driven by URL, fires once per navigation
      setHasIntent(true);
      setIsOpen(true);

      if (destinationParam) {
        // Sanitize: allow only letters (incl. accented), spaces, hyphens, and apostrophes
        // to prevent prompt injection attacks via the URL parameter
        const sanitizedDestination = destinationParam
          .trim()
          .slice(0, 100)
          .replace(/[^\p{L}\s\-']/gu, '');

        if (sanitizedDestination) {
          const message = `Olá! Gostaria de informações sobre viagem para ${sanitizedDestination}.`;
          setPendingAutoSendMessage(message);
          setPendingAutoSendDelayMs(DEEP_LINK_AUTO_SEND_DELAY_MS);
        }
      }

      // Clean URL — remove params to avoid re-triggering on navigation
      searchParams.delete(CHAT_URL_PARAM);
      searchParams.delete(DESTINATION_URL_PARAM);
      const newSearch = searchParams.toString();
      const newPath = `${location.pathname}${newSearch ? `?${newSearch}` : ''}${location.hash}`;
      void navigate(newPath, { replace: true });
    }

    return () => window.removeEventListener('toggle-ai-chat', handleToggle);
  }, [location, navigate, openChatDrawer]);

  // Deep-link handling (chat=1, m/message, destino)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const shouldOpenChat = urlParams.get('chat') === '1';

    if (shouldOpenChat) {
      // Same one-shot deep-link pattern as above (?chat=1): URL-driven open, not derivable
      // during render.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional one-shot open driven by URL, fires once per navigation
      setHasIntent(true);
      setIsOpen(true);

      const customMessage = urlParams.get('m') || urlParams.get('message');
      const destination = urlParams.get('destino');

      // Pré-preenche o input em vez de auto-enviar para evitar prompt injection
      if (customMessage) {
        setPendingInputPrefill(customMessage);
      } else if (destination) {
        setPendingInputPrefill(`Olá! Gostaria de um roteiro personalizado para ${destination}.`);
      }

      // Remove apenas os parâmetros de deep-link, preservando UTMs e outros params de rastreamento
      ['chat', 'm', 'message', 'destino'].forEach(p => urlParams.delete(p));
      const newSearch = urlParams.toString();
      window.history.replaceState({}, '', window.location.pathname + (newSearch ? `?${newSearch}` : '') + window.location.hash);
    }
  }, []);

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        type="button"
        onClick={(event) => {
          openChatDrawer();
          // Move focus off the trigger before the re-render makes it aria-hidden —
          // otherwise it stays document.activeElement while excluded from the
          // accessibility tree, an invalid ARIA state, until AIChatPanel finishes
          // loading and takes focus itself. openChatDrawer() already captured this
          // button into triggerRef above, so blurring here doesn't affect focus
          // restoration on close.
          event.currentTarget.blur();
        }}
        className={`fixed ${isOpen ? 'translate-y-32 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}
                    bottom-[calc(1rem+var(--cookie-banner-h,0px))] right-4 sm:bottom-[calc(1.5rem+var(--cookie-banner-h,0px))] sm:right-6 z-[9990]
                    flex items-center justify-center gap-3
                    bg-brand-vibrant text-white
                    shadow-[0_8px_30px_theme(colors.brand.cyan/30%)] hover:shadow-[0_8px_30px_theme(colors.brand.cyan/50%)] hover:-translate-y-1
                    transition-[bottom,transform,opacity,box-shadow] duration-300
                    size-16 rounded-2xl sm:w-auto sm:h-auto sm:px-6 sm:py-3.5 sm:rounded-full
                    focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-vibrant/30
                    ${isOrlandoPage ? 'orlando-chat-glow' : ''}`}
        aria-label="Abrir assistente virtual"
        aria-hidden={isOpen}
        tabIndex={isOpen ? -1 : 0}
      >
        <div className="relative flex items-center justify-center">
          <ChatCircleDots className="size-7" weight="fill" />
          <span className="absolute -top-1 -right-1 size-3 bg-red-500 rounded-full animate-pulse border-2 border-brand-vibrant"></span>
        </div>

        <div className="text-left hidden sm:flex sm:flex-col">
          <span className="text-[10px] font-bold tracking-widest text-white/90 uppercase opacity-90">Roteiro IA</span>
          <span className="text-sm font-bold leading-none capitalize mt-0.5">Ajuda & Cotação</span>
        </div>
      </button>

      {hasIntent && (
        <ChunkErrorBoundary fallback={<ChatPanelErrorFallback />}>
          <Suspense fallback={<ChatPanelLoadingFallback />}>
            <AIChatPanel
              isOpen={isOpen}
              onClose={closeChatDrawer}
              triggerRef={triggerRef}
              initialAutoSendMessage={pendingAutoSendMessage}
              initialAutoSendDelayMs={pendingAutoSendDelayMs}
              initialInputPrefill={pendingInputPrefill}
              onConsumePending={consumePending}
            />
          </Suspense>
        </ChunkErrorBoundary>
      )}
    </>
  );
});

AIChat.displayName = 'AIChat';

export default AIChat;
