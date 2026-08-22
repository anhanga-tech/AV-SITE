import './helpers/dom-setup.ts';

import React, { useEffect } from 'react';
import test from 'node:test';
import assert from 'node:assert/strict';
import { render, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom';

import NotFound from '../pages/NotFound.tsx';

/*
  Regressão: a rota wildcard (App.tsx) reaproveita a mesma instância de
  NotFound quando a navegação client-side vai de um 404 direto para outro
  (ex.: /foo -> /bar, ambos não mapeados) sem passar por uma rota válida no
  meio. Um efeito com deps [] só dispararia no mount, perdendo o segundo 404.
  O componente agora depende de useLocation().pathname.
*/

type TraksCall = { name: string };

function withTraksStub(run: (calls: TraksCall[]) => void) {
    const calls: TraksCall[] = [];
    const previous = (window as { traks?: unknown }).traks;
    (window as { traks?: unknown }).traks = (...args: unknown[]) => {
        calls.push({ name: String(args[0]) });
    };
    try {
        run(calls);
    } finally {
        if (previous === undefined) {
            delete (window as { traks?: unknown }).traks;
        } else {
            (window as { traks?: unknown }).traks = previous;
        }
    }
}

type NavigateRef = React.RefObject<((path: string) => void | Promise<void>) | null>;

function NavCapture({ navRef }: { navRef: NavigateRef }) {
    const navigate = useNavigate();
    useEffect(() => {
        navRef.current = navigate;
    }, [navigate, navRef]);
    return null;
}

test('NotFound emite page_not_found em cada navegação 404->404 distinta', () => {
    withTraksStub((calls) => {
        const navRef: NavigateRef = { current: null };

        render(
            React.createElement(
                MemoryRouter,
                { initialEntries: ['/rota-quebrada-1'] },
                React.createElement(NavCapture, { navRef }),
                React.createElement(
                    Routes,
                    null,
                    React.createElement(Route, { path: '*', element: React.createElement(NotFound) }),
                ),
            ),
        );

        assert.equal(calls.length, 1, 'primeiro 404 deve emitir 1 evento');

        act(() => {
            navRef.current!('/rota-quebrada-2');
        });

        assert.equal(calls.length, 2, 'segundo 404 (rota diferente) deve emitir outro evento');

        act(() => {
            navRef.current!('/rota-quebrada-2');
        });

        assert.equal(calls.length, 2, 'navegar para a mesma rota 404 não deve duplicar o evento');
    });
});
