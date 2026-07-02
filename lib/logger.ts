import { captureLoggerError } from './error-tracking';

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
        console[method](prefix, message, data);
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
