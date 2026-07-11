import { useCallback, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { HONEYPOT_FIELD, ELAPSED_TIME_FIELD } from '../lib/bot-detection';

/**
 * Client half of the anti-bot contract (server half in `lib/bot-detection`).
 *
 * A form calls `useAntiBot()` once, spreads `honeypotProps` onto a visually
 * hidden `<input>`, and merges `getAntiBotFields()` into its POST body. That
 * ships two zero-friction signals to the `submit-*` handlers:
 *  - the honeypot value (empty for humans; a blind form-filler populates it)
 *  - `elapsedMs`, the client-measured time since mount, so implausibly fast
 *    submits are visible without any cross-clock comparison.
 *
 * The hidden input stays in the layout (off-screen, not `display:none`) so naive
 * bots still "see" it, while `tabIndex=-1` / `aria-hidden` / `autoComplete=off`
 * keep humans, keyboard users, screen readers and password managers away from it.
 */

const HIDDEN_STYLE: CSSProperties = {
    position: 'absolute',
    left: '-9999px',
    top: 'auto',
    width: 1,
    height: 1,
    overflow: 'hidden',
    opacity: 0,
};

export interface HoneypotProps {
    ref: RefObject<HTMLInputElement | null>;
    type: 'text';
    name: string;
    tabIndex: -1;
    autoComplete: 'off';
    'aria-hidden': true;
    style: CSSProperties;
}

export interface AntiBotFields {
    [HONEYPOT_FIELD]: string;
    [ELAPSED_TIME_FIELD]: number;
}

export interface UseAntiBotResult {
    /** Fields to spread into the request body just before submit. */
    getAntiBotFields: () => AntiBotFields;
    /** Props for the hidden honeypot `<input>` the form must render. */
    honeypotProps: HoneypotProps;
}

export function useAntiBot(): UseAntiBotResult {
    // Captured once at first render via lazy state init (not `useRef(Date.now())`,
    // which would call the impure `Date.now()` during every render); the value is
    // stable across re-renders.
    const [renderedAt] = useState(() => Date.now());
    const honeypotRef = useRef<HTMLInputElement | null>(null);

    const getAntiBotFields = useCallback((): AntiBotFields => ({
        [HONEYPOT_FIELD]: honeypotRef.current?.value ?? '',
        // Elapsed computed here (submit time − mount time), both on the client, so
        // the wire value carries no absolute timestamp and no clock-skew exposure.
        [ELAPSED_TIME_FIELD]: Date.now() - renderedAt,
    }), [renderedAt]);

    const honeypotProps: HoneypotProps = {
        ref: honeypotRef,
        type: 'text',
        name: HONEYPOT_FIELD,
        tabIndex: -1,
        autoComplete: 'off',
        'aria-hidden': true,
        style: HIDDEN_STYLE,
    };

    return { getAntiBotFields, honeypotProps };
}
