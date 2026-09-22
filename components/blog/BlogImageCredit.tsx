import React from 'react';
import { Info } from 'lucide-react';
import type { PostMeta } from '../../types/blog';

interface BlogImageCreditProps {
    post: PostMeta;
    compact?: boolean;
}

export const BlogImageCredit: React.FC<BlogImageCreditProps> = ({ post, compact = false }) => {
    if (post.imageCreditStatus === 'unknown') {
        return compact ? (
            <p className="mt-2 text-[10px] font-semibold leading-tight text-zinc-500">Crédito da imagem em verificação</p>
        ) : (
            <aside
                className="mb-8 flex gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600"
                aria-label="Aviso sobre o crédito da imagem"
            >
                <Info className="mt-0.5 size-4 shrink-0 text-anhanga-action" aria-hidden="true" />
                <p className="leading-relaxed">
                    Crédito da imagem em verificação. Se você é o autor ou titular dos direitos,{' '}
                    <a
                        href="/creditos-de-imagens/"
                        className="font-bold text-anhanga-action underline decoration-anhanga-action/40 underline-offset-2 hover:text-anhanga-actionDark"
                    >
                        veja como falar conosco
                    </a>{' '}
                    para corrigirmos a atribuição ou removermos a imagem.
                </p>
            </aside>
        );
    }

    if (post.imageCreditStatus === 'confirmed' && post.imageCredit) {
        if (compact) {
            return (
                <p className="mt-2 text-[10px] font-semibold leading-tight text-zinc-500">
                    Foto: {post.imageCredit} · Licença: {post.imageLicense}
                    {post.imageSource ? ` · Fonte: ${post.imageSource}` : ''}
                    {post.imageAdaptation ? ` · ${post.imageAdaptation}` : ''}
                </p>
            );
        }

        return (
            <p className="mb-8 text-xs leading-relaxed text-zinc-500">
                Crédito da capa: {post.imageSource ? <a href={post.imageSource} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">{post.imageCredit}</a> : post.imageCredit}
                {post.imageLicense ? (
                    <>
                        {' · '}
                        {post.imageLicenseUrl ? <a href={post.imageLicenseUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">{post.imageLicense}</a> : post.imageLicense}
                    </>
                ) : null}
                {post.imageAdaptation ? ` · ${post.imageAdaptation}` : ''}
            </p>
        );
    }

    return null;
};
