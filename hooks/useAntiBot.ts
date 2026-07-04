import { useCallback, useRef, type CSSProperties, type RefObject } from 'react';
import { HONEYPOT_FIELD, RENDERED_AT_FIELD } from '../lib/bot-detection';

/**
 * Client half of the anti-bot contract (server half in `lib/bot-detection`).
 *
 * A form calls `useAntiBot()` once, spreads `honeypotProps` onto a visually
 * hidden `<input>`, and merges `getAntiBotFields()` into its POST body. That
 * ships two zero-friction signals to the `submit-*` handlers:
 *  - the honeypot value (empty for humans; a blind form-filler populates it)
 *  - `renderedAt`, captured at mount, so implausibly fast submits are visible.
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
    [RENDERED_AT_FIELD]: number;
}

export interface UseAntiBotResult {
    /** Fields to spread into the request body just before submit. */
    getAntiBotFields: () => AntiBotFields;
    /** Props for the hidden honeypot `<input>` the form must render. */
    honeypotProps: HoneypotProps;
}

export function useAntiBot(): UseAntiBotResult {
    // Captured once at mount; a ref keeps it stable across re-renders.
    const renderedAt = useRef(Date.now());
    const honeypotRef = useRef<HTMLInputElement | null>(null);

    const getAntiBotFields = useCallback((): AntiBotFields => ({
        [HONEYPOT_FIELD]: honeypotRef.current?.value ?? '',
        [RENDERED_AT_FIELD]: renderedAt.current,
    }), []);

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
