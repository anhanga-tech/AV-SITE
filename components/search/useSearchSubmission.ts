import { useCallback, useEffect, useRef, useState } from 'react';
import { openAiChat } from '../../utils/aiChat';
import { pushFormAnalyticsEvent } from '../../utils/formAnalytics';
import { buildSearchMessage } from './helpers';

interface SearchSubmissionInput {
  inputValue: string;
  startDate: Date | null;
  endDate: Date | null;
  adults: number;
  children: number;
  childAges: string[];
  tripType: string;
  budget: string;
}

type TrackedField = 'destination' | 'date' | 'budget';

export function useSearchSubmission({
  inputValue,
  startDate,
  endDate,
  adults,
  children,
  childAges,
  tripType,
  budget,
}: SearchSubmissionInput) {
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedRef = useRef(false);
  const completedFields = useRef<Set<TrackedField> | null>(null);

  useEffect(() => {
    pushFormAnalyticsEvent({
      event: 'form_view',
      formType: 'home_search',
      formId: 'hero-search',
    });
  }, []);

  const markStarted = useCallback((fieldName: TrackedField) => {
    if (!startedRef.current) {
      startedRef.current = true;
      pushFormAnalyticsEvent({
        event: 'form_start',
        formType: 'home_search',
        formId: 'hero-search',
      });
    }
    const trackedFields = completedFields.current ?? (completedFields.current = new Set());
    if (!trackedFields.has(fieldName)) {
      trackedFields.add(fieldName);
      pushFormAnalyticsEvent({
        event: 'field_complete',
        formType: 'home_search',
        formId: 'hero-search',
        fieldName,
      });
    }
  }, []);

  useEffect(() => {
    const timerRef = errorTimeoutRef;
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleSearch = useCallback(() => {
    if (!inputValue.trim()) {
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      setValidationError("Por favor, informe o destino.");
      pushFormAnalyticsEvent({
        event: 'field_error',
        formType: 'home_search',
        formId: 'hero-search',
        fieldName: 'destination',
        errorType: 'required',
      });
      void import('../../utils/haptics').then(m => m.triggerHaptic('medium'));
      errorTimeoutRef.current = setTimeout(() => setValidationError(null), 4000);
      return;
    }

    setIsSearchLoading(true);
    setValidationError(null);
    pushFormAnalyticsEvent({
      event: 'submit_attempt',
      formType: 'home_search',
      formId: 'hero-search',
      destination: inputValue,
    });

    openAiChat({
      haptic: 'medium',
      message: buildSearchMessage({
        inputValue,
        startDate,
        endDate,
        adults,
        children,
        childAges,
        tripType,
        budget,
      }),
    });
    pushFormAnalyticsEvent({
      event: 'submit_success',
      formType: 'home_search',
      formId: 'hero-search',
      destination: inputValue,
    });

    setTimeout(() => {
      setIsSearchLoading(false);
    }, 1000);
  }, [inputValue, startDate, endDate, adults, children, childAges, tripType, budget]);

  return { isSearchLoading, validationError, markStarted, handleSearch };
}
