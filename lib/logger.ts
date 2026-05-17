type LogPayload = unknown;
type LogWriter = (prefix: string, message: string, payload?: LogPayload) => void;

function isDebugEnabled(): boolean {
    return typeof process !== 'undefined' && process.env.DEBUG === 'true';
}

function writeLog(writer: LogWriter, prefix: string, message: string, payload?: LogPayload): void {
    if (payload === undefined) {
        writer(prefix, message);
        return;
    }

    writer(prefix, message, payload);
}

export const logger = {
    debug: (message: string, data?: LogPayload): void => {
        if (!isDebugEnabled()) {
            return;
        }

        writeLog(console.log, '[debug]', message, data);
    },
    info: (message: string, data?: LogPayload): void => {
        writeLog(console.log, '[info]', message, data);
    },
    warn: (message: string, data?: LogPayload): void => {
        writeLog(console.warn, '[warn]', message, data);
    },
    error: (message: string, error?: LogPayload): void => {
        writeLog(console.error, '[error]', message, error);
    },
};
