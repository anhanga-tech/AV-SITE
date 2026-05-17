import test from 'node:test';
import assert from 'node:assert/strict';

import { logger } from '../lib/logger.ts';

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
