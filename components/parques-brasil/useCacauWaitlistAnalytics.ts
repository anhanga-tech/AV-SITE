import { useCallback, useEffect, useRef } from 'react';
import { isFieldCompleteForAnalytics } from '../../lib/form-v1-validation';
import { pushFormAnalyticsEvent, type FormAnalyticsEvent } from '../../utils/formAnalytics';

/*
  Funil do formulário do Cacau Park no mesmo formato da lista do Lolla
  (form_view → form_start → field_complete → submit_*), para os painéis de
  funil compararem as duas listas sem tratamento especial.
*/

const FORM_ID = 'cacau-park-waitlist';
const DESTINATION = 'Cacau Park';

type CacauField = 'name' | 'email' | 'emailOptIn';

export function useCacauWaitlistAnalytics() {
  const started = useRef(false);
  const completed = useRef(new Set<CacauField>());

  const track = useCallback(
    (event: FormAnalyticsEvent['event'], extra: Pick<FormAnalyticsEvent, 'fieldName' | 'errorType'> = {}) => {
      pushFormAnalyticsEvent({ event, formType: 'waitlist', formId: FORM_ID, destination: DESTINATION, ...extra });
    },
    [],
  );

  useEffect(() => {
    track('form_view');
  }, [track]);

  const trackField = useCallback(
    (fieldName: CacauField, value: string | boolean) => {
      if (!started.current) {
        started.current = true;
        track('form_start');
      }
      if (completed.current.has(fieldName) || !isFieldCompleteForAnalytics(fieldName, value)) return;
      completed.current.add(fieldName);
      track('field_complete', { fieldName });
    },
    [track],
  );

  return { track, trackField };
}
