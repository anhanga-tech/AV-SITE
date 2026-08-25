import React, { memo, useEffect, useRef, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { createLeadEventId, pushGenerateLeadDataLayerEvent } from '../hooks/useLeadCapture';
import type { SubmitLeadRequest } from '../types/leadCapture';
import {
  validateLeadForm,
  type FieldErrors,
  type LeadFinalizePayload,
  type LeadFinalizeResult,
} from '../lib/chat-lead-form-logic';
import { triggerHaptic } from '../utils/haptics';
import { trackTraksWhatsAppHandoff } from '../utils/traks';
import { openContactModal } from '../utils/contactForm';
import { reserveWhatsAppWindow, type WhatsAppHandoff } from '../utils/whatsappHandoff';
import { pushFormAnalyticsEvent } from '../utils/formAnalytics';
import { isFieldCompleteForAnalytics } from '../lib/form-v1-validation';
import { ChatLeadFormFields } from './chat-lead-form/ChatLeadFormFields';
import { ChatLeadFormFeedback } from './chat-lead-form/ChatLeadFormFeedback';
import { ChatLeadFormActions } from './chat-lead-form/ChatLeadFormActions';

export { TextField } from './chat-lead-form/TextField';

interface ChatLeadFormProps {
  destination?: string;
  defaultBantSummary?: string;
  whatsappMessage?: string;
  /** Whether the chat drawer is currently open — used to cancel a pending handoff if the visitor closes it mid-submit. */
  isOpen?: boolean;
  getWhatsAppUrl: (payload: LeadFinalizePayload) => string;
  prepareLeadSubmitPayload: (payload: LeadFinalizePayload, eventId: string) => SubmitLeadRequest;
  isSubmittingLead: boolean;
  onFinalizeLead: (payload: SubmitLeadRequest) => Promise<LeadFinalizeResult>;
}

const ChatLeadFormBase: React.FC<ChatLeadFormProps> = ({
  destination,
  defaultBantSummary,
  whatsappMessage,
  isOpen = true,
  getWhatsAppUrl,
  prepareLeadSubmitPayload,
  isSubmittingLead,
  onFinalizeLead,
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+55');
  const [whatsapp, setWhatsapp] = useState('');
  const [acceptedLGPD, setAcceptedLGPD] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [localError, setLocalError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);
  const [isLocallySubmitting, setIsLocallySubmitting] = useState(false);
  // Once a submission succeeds, block further ones: the form stays visible
  // (so the fallback link and any notice remain readable) but re-clicking
  // "Salvar e abrir WhatsApp" would otherwise send the same lead again with
  // a fresh event_id, creating a duplicate CRM opportunity.
  const [hasSucceeded, setHasSucceeded] = useState(false);
  const isProcessingRef = React.useRef(false);
  const eventIdRef = useRef<string | null>(null);
  const isOpenRef = useRef(isOpen);
  // Tracks the WhatsApp tab reserved by the in-flight submission (if any) so
  // the unmount cleanup below can close it immediately — a route change that
  // unmounts the whole chat (App.tsx removes <AIChat> on some landing pages)
  // wouldn't otherwise cancel a still-pending request's reserved tab.
  const activeHandoffRef = useRef<WhatsAppHandoff | null>(null);
  const startedRef = useRef(false);
  const completedFields = useRef<Set<string> | null>(null);
  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const whatsappRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    pushFormAnalyticsEvent({
      event: 'form_view',
      formType: 'ai_chatbot_lead',
      formId: 'chat-lead-form',
      destination,
    });
  }, [destination]);

  useEffect(() => {
    // One-way latch: only the transition to closed is recorded here. If the
    // drawer closes while a submission is pending and the visitor reopens it
    // (the always-mounted trigger allows that) before the CRM responds, the
    // dismissal must still stick for that in-flight request — reopening
    // shouldn't silently un-cancel a handoff the visitor already dismissed.
    // `submitLeadForm` re-latches this to `true` at the start of each new
    // attempt, when the drawer is necessarily open (the button is only
    // reachable then).
    if (!isOpen) {
      isOpenRef.current = false;
      // Closing the drawer doesn't unmount ChatLeadForm (only the dialog
      // hides), so the unmount cleanup below wouldn't run here — cancel any
      // tab reserved by a still-pending submission right away instead of
      // waiting for that request to eventually settle, which could leave a
      // blank tab open indefinitely if it's slow or hangs.
      activeHandoffRef.current?.cancel();
      activeHandoffRef.current = null;
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      activeHandoffRef.current?.cancel();
      activeHandoffRef.current = null;
    };
  }, []);

  useEffect(() => {
    const firstError = Object.keys(fieldErrors)[0] as keyof FieldErrors | undefined;
    if (!firstError) return;

    const refs: Partial<Record<keyof FieldErrors, React.RefObject<HTMLInputElement | null>>> = {
      firstName: firstNameRef,
      lastName: lastNameRef,
      email: emailRef,
      whatsapp: whatsappRef,
    };
    refs[firstError]?.current?.focus();
  }, [fieldErrors]);

  function trackField(fieldName: keyof FieldErrors, value: string | boolean) {
    if (!startedRef.current) {
      startedRef.current = true;
      pushFormAnalyticsEvent({
        event: 'form_start',
        formType: 'ai_chatbot_lead',
        formId: 'chat-lead-form',
        destination,
      });
    }

    const completed = isFieldCompleteForAnalytics(fieldName, value);
    const trackedFields = completedFields.current ?? (completedFields.current = new Set());
    if (completed && !trackedFields.has(fieldName)) {
      trackedFields.add(fieldName);
      pushFormAnalyticsEvent({
        event: 'field_complete',
        formType: 'ai_chatbot_lead',
        formId: 'chat-lead-form',
        fieldName,
        destination,
      });
    }
  }

  // Any field the visitor edits after a failed submit invalidates the retry
  // key preserved for that failure — otherwise a retry could resend corrected
  // data under the stale event_id, and the Odoo dedup would return the
  // already-created lead without applying the edit.
  const invalidateRetryKey = () => {
    eventIdRef.current = null;
  };

  const openLeadModal = () => {
    if (isSubmittingLead || isLocallySubmitting || isProcessingRef.current || hasSucceeded) return;
    void triggerHaptic('light');
    const modalOptions = {
      source: 'chatbot-direct',
      destination,
      ...(whatsappMessage ? { message: whatsappMessage } : {}),
    };
    openContactModal(modalOptions);
  };

  const submitLeadForm = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isSubmittingLead || isLocallySubmitting || isProcessingRef.current || hasSucceeded) return;
    e.preventDefault();
    isProcessingRef.current = true;
    // Re-latch: the button is only reachable while the drawer is open, so a
    // new attempt always starts from "open". A close mid-flight during this
    // specific attempt is what should stick (see the effect above).
    isOpenRef.current = true;
    setIsLocallySubmitting(true);
    setLocalError(null);
    setNotice(null);
    setWhatsappUrl(null);
    setFieldErrors({});
    pushFormAnalyticsEvent({
      event: 'submit_attempt',
      formType: 'ai_chatbot_lead',
      formId: 'chat-lead-form',
      destination,
    });

    const validation = validateLeadForm({
      firstName,
      lastName,
      email,
      whatsapp,
      countryCode,
      acceptedLGPD,
      destination,
      defaultBantSummary,
    });

    if (validation.ok === false) {
      setFieldErrors(validation.fieldErrors || {});
      setLocalError(validation.localError);
      const firstErrorField = validation.fieldErrors
        ? (Object.keys(validation.fieldErrors)[0] as keyof FieldErrors | undefined)
        : undefined;
      pushFormAnalyticsEvent({
        event: 'field_error',
        formType: 'ai_chatbot_lead',
        formId: 'chat-lead-form',
        fieldName: firstErrorField,
        errorType: firstErrorField ?? 'validation',
        destination,
      });
      setIsLocallySubmitting(false);
      isProcessingRef.current = false;
      return;
    }
    const { payload, marketingOptIn } = validation;

    void triggerHaptic('medium');

    const eventId = eventIdRef.current ?? createLeadEventId();
    eventIdRef.current = eventId;
    // Forward the LGPD/marketing consent so the handler sets x_lgpd_consent on
    // the Odoo res.partner; prepareLeadSubmitPayload only maps draft + tracking.
    const submitPayload: SubmitLeadRequest = {
      ...prepareLeadSubmitPayload(payload, eventId),
      marketingOptIn,
    };

    // Reserve the tab synchronously — before the `await` below — so Safari
    // still treats the navigation as a direct result of this click (see
    // utils/whatsappHandoff.ts). Confirm the CRM write before handing the
    // visitor to WhatsApp: the previous fire-and-forget order could open
    // WhatsApp while silently losing the lead.
    const whatsappHandoff = reserveWhatsAppWindow();
    activeHandoffRef.current = whatsappHandoff;

    // The isOpen-close effect above may already have cancelled and cleared
    // `activeHandoffRef` by the time this continuation resumes after an
    // `await` — guard so this function's own cancel calls don't redundantly
    // close an already-closed handle.
    const cancelActiveHandoff = () => {
      if (activeHandoffRef.current !== whatsappHandoff) return;
      activeHandoffRef.current = null;
      whatsappHandoff.cancel();
    };

    try {
      const result = await onFinalizeLead(submitPayload);

      if (!result.ok) {
        cancelActiveHandoff();
        pushFormAnalyticsEvent({
          event: 'submit_failure',
          formType: 'ai_chatbot_lead',
          formId: 'chat-lead-form',
          errorType: result.error ? 'api' : 'unknown',
          destination,
        });
        setLocalError('Não foi possível salvar seu contato. Tente novamente.');
        console.warn('Background lead submission failed:', { error: result.error, requestId: result.requestId });
        return;
      }

      // The CRM write is confirmed at this point — report the conversion and
      // clear the retry key regardless of whether the drawer is still open.
      // Fired only on confirmed success — pushing it before the CRM write
      // resolves would report failed submissions as conversions, and firing
      // it on every attempt would double-count a retry that reuses the same
      // preserved event_id.
      pushGenerateLeadDataLayerEvent(submitPayload);
      eventIdRef.current = null;
      setHasSucceeded(true);
      const whatsappLink = getWhatsAppUrl(payload);

      if (!isOpenRef.current) {
        // The visitor closed the chat drawer while this request was in
        // flight. AIChatPanel stays mounted (only its `isOpen` prop
        // toggles), so this continuation would otherwise still run and hand
        // off to WhatsApp after an explicit dismissal — cancel just the
        // navigation, the lead itself is already saved and reported above.
        // Still expose the WhatsApp link as a fallback: if the visitor
        // reopens the drawer, they'd otherwise see a disabled form with no
        // indication the lead was saved and no way to continue.
        cancelActiveHandoff();
        setWhatsappUrl(whatsappLink);
        if (result.notice) {
          setNotice(result.notice);
        }
        // The submission itself is confirmed successful — count it in form
        // analytics too, not just the generate_lead conversion above.
        pushFormAnalyticsEvent({
          event: 'submit_success',
          formType: 'ai_chatbot_lead',
          formId: 'chat-lead-form',
          destination,
        });
        return;
      }

      // If the component unmounted mid-flight (e.g. SPA navigation to a
      // landing route without <AIChat>) while the drawer was still open,
      // the unmount cleanup already cancelled and cleared activeHandoffRef
      // — distinct from the drawer-closed case above, which returns early.
      const handoffWasAbandoned = activeHandoffRef.current !== whatsappHandoff;
      const opened = whatsappHandoff.open(whatsappLink);
      if (!handoffWasAbandoned) {
        // Populate the fallback link even when the tab opened successfully:
        // hasSucceeded permanently disables the form, so a visitor switching
        // back from WhatsApp needs a usable confirmation state, not a
        // silently locked form with no indication anything happened.
        setWhatsappUrl(whatsappLink);
        pushFormAnalyticsEvent({
          event: 'whatsapp_opened',
          formType: 'ai_chatbot_lead',
          formId: 'chat-lead-form',
          destination,
        });
        // Only when the tab actually navigated — when it falls back to the
        // rendered link instead, the global `<a href="wa.me/...">` click
        // listener (utils/traks.ts) already tracks it if/when the visitor
        // clicks it, so tracking it here too would double-count the handoff.
        if (opened) {
          trackTraksWhatsAppHandoff();
        }
      }
      pushFormAnalyticsEvent({
        event: 'submit_success',
        formType: 'ai_chatbot_lead',
        formId: 'chat-lead-form',
        destination,
      });
      if (result.notice) {
        setNotice(result.notice);
      }
    } catch (error) {
      // onFinalizeLead is currently expected to always resolve (never
      // reject) — but nothing in its type contract guarantees that for
      // future callers. Without this, a thrown error would skip every
      // `whatsappHandoff.cancel()` call above, leaking the reserved blank
      // tab. Mirrors the catch block in hooks/useContactForm.ts's submit().
      cancelActiveHandoff();
      pushFormAnalyticsEvent({
        event: 'submit_failure',
        formType: 'ai_chatbot_lead',
        formId: 'chat-lead-form',
        errorType: 'unknown',
        destination,
      });
      setLocalError('Não foi possível salvar seu contato. Tente novamente.');
      console.warn('Background lead submission threw:', error);
    } finally {
      if (activeHandoffRef.current === whatsappHandoff) {
        activeHandoffRef.current = null;
      }
      setIsLocallySubmitting(false);
      isProcessingRef.current = false;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-brand-blue/10 shadow-[0_8px_30px_rgb(0,0,0,0.08)] w-full overflow-hidden transform transition hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-1">
      <div className="bg-gradient-to-r from-brand-vibrant/10 to-transparent p-3 flex items-center gap-2 border-b border-zinc-100">
        <CheckCircle2 className="size-5 text-green-500" />
        <span className="text-sm font-bold tracking-wide text-brand-dark uppercase">
          Link Gerado
        </span>
      </div>
      <div className="p-5 bg-gradient-to-br from-white to-zinc-50/50">
        <p className="text-sm text-zinc-600 mb-5 font-medium leading-relaxed">
          Sua solicitação para <strong className="font-bold text-brand-vibrant relative px-1"><span className="absolute inset-0 bg-brand-yellow/20 -skew-x-6 rounded"></span><span className="relative">{destination}</span></strong> está pronta. Finalize seus dados:
        </p>

        <ChatLeadFormFields
          firstName={firstName}
          lastName={lastName}
          email={email}
          whatsapp={whatsapp}
          countryCode={countryCode}
          acceptedLGPD={acceptedLGPD}
          fieldErrors={fieldErrors}
          disabled={isSubmittingLead || isLocallySubmitting || hasSucceeded}
          onFirstNameChange={(value) => { setFirstName(value); trackField('firstName', value); invalidateRetryKey(); }}
          onLastNameChange={(value) => { setLastName(value); trackField('lastName', value); invalidateRetryKey(); }}
          onEmailChange={(value) => { setEmail(value); trackField('email', value); invalidateRetryKey(); }}
          onWhatsappChange={(value) => { setWhatsapp(value); trackField('whatsapp', value); invalidateRetryKey(); }}
          onCountryCodeChange={(value) => { setCountryCode(value); invalidateRetryKey(); }}
          onLgpdChange={(value) => { setAcceptedLGPD(value); trackField('lgpd', value); invalidateRetryKey(); }}
          fieldRefs={{
            firstName: firstNameRef,
            lastName: lastNameRef,
            email: emailRef,
            whatsapp: whatsappRef,
          }}
        />

        <ChatLeadFormFeedback localError={localError} notice={notice} whatsappUrl={whatsappUrl} />

        <ChatLeadFormActions
          isSubmitting={isSubmittingLead || isLocallySubmitting}
          disabled={hasSucceeded}
          onSubmit={(e) => void submitLeadForm(e)}
          onOpenLeadModal={openLeadModal}
        />
      </div>
    </div>
  );
};

ChatLeadFormBase.displayName = 'ChatLeadForm';

export const ChatLeadForm = memo(ChatLeadFormBase);
