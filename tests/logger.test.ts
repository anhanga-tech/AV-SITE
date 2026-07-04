import test from 'node:test';
import assert from 'node:assert/strict';

import { logger } from '../lib/logger.ts';
import {
    resetErrorTrackerForTests,
    setErrorTrackerForTests,
    type ErrorCaptureContext,
} from '../lib/error-tracking.ts';

type ConsoleMethod = (...args: unknown[]) => void;

function captureConsole(method: 'log' | 'info' | 'warn' | 'error') {
    const original = console[method];
    const calls: unknown[][] = [];

    console[method] = ((...args: unknown[]) => {
        calls.push(args);
    }) as ConsoleMethod;

    return {
        calls,
        restore: () => {
            console[method] = original;
        },
    };
}

test('logger.debug escreve apenas quando DEBUG=true', () => {
    const originalDebug = process.env.DEBUG;
    const log = captureConsole('log');

    try {
        delete process.env.DEBUG;
        logger.debug('debug oculto', { source: 'test' });
        assert.deepEqual(log.calls, []);

        process.env.DEBUG = 'true';
        logger.debug('debug visivel', { source: 'test' });
        assert.deepEqual(log.calls, [['[debug]', 'debug visivel', { source: 'test' }]]);
    } finally {
        if (originalDebug === undefined) {
            delete process.env.DEBUG;
        } else {
            process.env.DEBUG = originalDebug;
        }
        log.restore();
    }
});

test('logger.debug não quebra quando process é indefinido (bundle do browser)', () => {
    const globalWithProcess = globalThis as { process?: NodeJS.Process };
    const originalProcess = globalWithProcess.process;
    const log = captureConsole('log');

    try {
        // Simula o bundle do browser, onde `process` não existe: a leitura
        // desprotegida de process.env.DEBUG lançava ReferenceError.
        delete globalWithProcess.process;
        assert.doesNotThrow(() => logger.debug('debug sem process', { source: 'test' }));

        // Alguns ambientes/mocks definem `process` como null: `!process.env`
        // sem optional chaining lançaria TypeError.
        globalWithProcess.process = null as unknown as NodeJS.Process;
        assert.doesNotThrow(() => logger.debug('debug com process null', { source: 'test' }));

        assert.deepEqual(log.calls, []);
    } finally {
        globalWithProcess.process = originalProcess;
        log.restore();
    }
});

test('logger escreve os níveis públicos com prefixos estáveis', () => {
    const info = captureConsole('info');
    const warn = captureConsole('warn');
    const error = captureConsole('error');

    try {
        logger.info('info sem dados');
        logger.warn('warn com dados', { code: 'WARN_TEST' });
        logger.error('error com causa', new Error('falha'));

        assert.deepEqual(info.calls, [['[info]', 'info sem dados']]);
        assert.deepEqual(warn.calls, [['[warn]', 'warn com dados', { code: 'WARN_TEST' }]]);
        assert.equal(error.calls.length, 1);
        assert.deepEqual(error.calls[0]?.slice(0, 2), ['[error]', 'error com causa']);
        assert.ok(error.calls[0]?.[2] instanceof Error);
    } finally {
        info.restore();
        warn.restore();
        error.restore();
    }
});

test('logger chama métodos do console preservando o binding do objeto', () => {
    const originalInfo = console.info;
    const calls: unknown[][] = [];

    try {
        console.info = function boundConsoleCapture(this: Console, ...args: unknown[]) {
            assert.equal(this, console);
            calls.push(args);
        } as typeof console.info;

        logger.info('info com binding preservado');

        assert.deepEqual(calls, [['[info]', 'info com binding preservado']]);
    } finally {
        console.info = originalInfo;
    }
});

test('logger.debug normaliza DEBUG antes de comparar', () => {
    const originalDebug = process.env.DEBUG;
    const log = captureConsole('log');

    try {
        process.env.DEBUG = 'TRUE';
        logger.debug('debug maiusculo');

        assert.deepEqual(log.calls, [['[debug]', 'debug maiusculo']]);
    } finally {
        if (originalDebug === undefined) {
            delete process.env.DEBUG;
        } else {
            process.env.DEBUG = originalDebug;
        }
        log.restore();
    }
});

test('logger redige chaves sensíveis na saída de console em todos os níveis', () => {
    const info = captureConsole('info');
    const warn = captureConsole('warn');
    const error = captureConsole('error');

    try {
        resetErrorTrackerForTests();

        const payload = {
            requestId: 'req_123',
            email: 'cliente@example.com',
            token: 'super-secret-token',
            nested: { phone: '+55 11 99999-9999' },
        };
        const expected = {
            requestId: 'req_123',
            email: '[redacted]',
            token: '[redacted]',
            nested: { phone: '[redacted]' },
        };

        logger.info('SUBMIT_LEAD info', payload);
        logger.warn('SUBMIT_LEAD warn', payload);
        logger.error('SUBMIT_LEAD error', payload);

        assert.deepEqual(info.calls[0], ['[info]', 'SUBMIT_LEAD info', expected]);
        assert.deepEqual(warn.calls[0], ['[warn]', 'SUBMIT_LEAD warn', expected]);
        assert.deepEqual(error.calls[0], ['[error]', 'SUBMIT_LEAD error', expected]);

        // O objeto original não deve ser mutado pela redação.
        assert.equal(payload.email, 'cliente@example.com');
        assert.equal(payload.token, 'super-secret-token');
    } finally {
        info.restore();
        warn.restore();
        error.restore();
    }
});

test('logger preserva objetos nativos (Date) sem achatá-los em {}', () => {
    const info = captureConsole('info');

    try {
        resetErrorTrackerForTests();
        const when = new Date('2026-07-03T12:00:00.000Z');

        logger.info('EVENTO', { when, count: 3 });

        const logged = info.calls[0]?.[2] as { when: unknown; count: number };
        assert.equal(logged.when, when, 'Date deve ser preservada como valor, não virar {}');
        assert.equal(logged.count, 3);
    } finally {
        info.restore();
    }
});

test('logger.error captura erros no error tracker registrado', () => {
    const error = captureConsole('error');
    const captured: Array<{ error: unknown; context?: ErrorCaptureContext }> = [];

    try {
        setErrorTrackerForTests((capturedError, context) => {
            captured.push({ error: capturedError, context });
        });

        const cause = new Error('falha upstream');
        logger.error('SERVER: falha ao consultar provider', cause);

        assert.equal(captured.length, 1);
        assert.equal(captured[0]?.error, cause);
        assert.deepEqual(captured[0]?.context, {
            extra: {
                message: 'SERVER: falha ao consultar provider',
            },
        });
    } finally {
        resetErrorTrackerForTests();
        error.restore();
    }
});

test('logger.error omite captura externa sem tracker registrado e mascara PII obvia no contexto', () => {
    const error = captureConsole('error');
    const captured: Array<{ error: unknown; context?: ErrorCaptureContext }> = [];

    try {
        resetErrorTrackerForTests();

        logger.error('SUBMIT_LEAD', {
            requestId: 'req_123',
            email: 'cliente@example.com',
            token: 'super-secret-token',
            nested: {
                phone: '+55 11 99999-9999',
            },
        });

        assert.equal(captured.length, 0);

        setErrorTrackerForTests((capturedError, context) => {
            captured.push({ error: capturedError, context });
        });

        logger.error('SUBMIT_LEAD', {
            requestId: 'req_123',
            email: 'cliente@example.com',
            token: 'super-secret-token',
            nested: {
                phone: '+55 11 99999-9999',
            },
        });

        assert.equal(captured.length, 1);
        const firstCapture = captured[0];
        assert.ok(firstCapture);
        assert.ok(firstCapture.error instanceof Error);
        assert.equal(firstCapture.error.message, 'SUBMIT_LEAD');
        assert.deepEqual(firstCapture.context, {
            extra: {
                message: 'SUBMIT_LEAD',
                data: {
                    requestId: 'req_123',
                    email: '[redacted]',
                    token: '[redacted]',
                    nested: {
                        phone: '[redacted]',
                    },
                },
            },
        });
    } finally {
        resetErrorTrackerForTests();
        error.restore();
    }
});
