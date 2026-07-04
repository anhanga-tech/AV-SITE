import { captureLoggerError, sanitizeForErrorTracking } from './error-tracking';

type LoggerData = unknown;
type ConsoleMethod = 'log' | 'info' | 'warn' | 'error';

function isDebugEnabled(): boolean {
    // This logger is shared between server handlers and browser code. In the
    // browser bundle `process` is not defined (Vite only replaces the
    // `process.env.GEMINI_MODEL` token), so reading it unguarded throws a
    // ReferenceError and breaks the caller (e.g. the chat request path).
    if (typeof process === 'undefined' || !process?.env) return false;
    const debug = process.env.DEBUG;
    return typeof debug === 'string' && debug.toLowerCase() === 'true';
}

function writeLog(method: ConsoleMethod, prefix: string, message: string, data?: LoggerData): void {
    if (data !== undefined) {
        // Both the client Sentry setup and the Cloudflare middleware capture console
        // output, so redact sensitive keys before writing — never rely on the
        // error-tracker context alone (see captureLoggerError). Error instances are
        // passed through so console keeps the stack trace (parity with the tracker,
        // which also keeps the Error object rather than its data).
        const safe = data instanceof Error ? data : sanitizeForErrorTracking(data);
        console[method](prefix, message, safe);
        return;
    }

    console[method](prefix, message);
}

export const logger = {
    debug(message: string, data?: LoggerData): void {
        if (!isDebugEnabled()) return;
        writeLog('log', '[debug]', message, data);
    },

    info(message: string, data?: LoggerData): void {
        writeLog('info', '[info]', message, data);
    },

    warn(message: string, data?: LoggerData): void {
        writeLog('warn', '[warn]', message, data);
    },

    error(message: string, data?: LoggerData): void {
        captureLoggerError(message, data);
        writeLog('error', '[error]', message, data);
    },
};
