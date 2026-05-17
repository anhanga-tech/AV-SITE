type LogPayload = unknown;
type LogMethod = 'log' | 'warn' | 'error';

function isDebugEnabled(): boolean {
    if (typeof process === 'undefined') {
        return false;
    }

    const debugValue = process.env.DEBUG;
    return debugValue?.toLowerCase() === 'true';
}

function writeLog(method: LogMethod, prefix: string, message: string, payload?: LogPayload): void {
    if (payload === undefined) {
        console[method](prefix, message);
        return;
    }

    console[method](prefix, message, payload);
}

export const logger = {
    debug: (message: string, data?: LogPayload): void => {
        if (!isDebugEnabled()) {
            return;
        }

        writeLog('log', '[debug]', message, data);
    },
    info: (message: string, data?: LogPayload): void => {
        writeLog('log', '[info]', message, data);
    },
    warn: (message: string, data?: LogPayload): void => {
        writeLog('warn', '[warn]', message, data);
    },
    error: (message: string, error?: LogPayload): void => {
        writeLog('error', '[error]', message, error);
    },
};
