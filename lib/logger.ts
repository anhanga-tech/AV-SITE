type LoggerData = unknown;
type ConsoleMethod = 'log' | 'info' | 'warn' | 'error';

function isDebugEnabled(): boolean {
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
        writeLog('error', '[error]', message, data);
    },
};
