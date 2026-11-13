import React from 'react';

// Só links internos no formato [texto](/caminho). `//host` e `/\host` ficam de fora porque
// o navegador os trata como URL externa; todo o resto do aviso continua texto puro.
const INTERNAL_LINK = /\[([^\]\n]+)\]\((\/(?![/\\])[^\s)\\]*)\)/g;

interface HistoricalNoticeTextProps {
    text: string;
}

export const HistoricalNoticeText: React.FC<HistoricalNoticeTextProps> = ({ text }) => {
    const nodes: React.ReactNode[] = [];
    let cursor = 0;

    for (const match of text.matchAll(INTERNAL_LINK)) {
        const [raw, label, href] = match;
        const start = match.index ?? 0;
        if (start > cursor) nodes.push(text.slice(cursor, start));
        nodes.push(
            <a key={start} href={href} className="font-bold underline underline-offset-2 hover:text-brand-dark/80">
                {label}
            </a>
        );
        cursor = start + raw.length;
    }

    if (cursor < text.length) nodes.push(text.slice(cursor));

    return <>{nodes}</>;
};
