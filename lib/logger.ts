type LoggerData = unknown;

function isDebugEnabled(): boolean {
    return process.env.DEBUG === 'true';
}

export const logger = {
    debug(message: string, data?: LoggerData): void {
        if (!isDebugEnabled()) return;
        console.log('[debug]', message, data);
    },

    info(message: string, data?: LoggerData): void {
        console.log('[info]', message, data);
    },

    warn(message: string, data?: LoggerData): void {
        console.warn('[warn]', message, data);
    },

    error(message: string, data?: LoggerData): void {
        console.error('[error]', message, data);
    },
};
