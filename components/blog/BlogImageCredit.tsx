import React from 'react';
import { Info } from 'lucide-react';

// O componente só lê os campos de crédito da capa — não o PostMeta inteiro. Tipar
// por esse subconjunto permite reusá-lo no teaser da home (HomeTeaserPost), que é uma
// projeção parcial do post e não carrega tags[]/readingTime.
export interface ImageCreditFields {
    imageCreditStatus?: 'confirmed' | 'unknown';
    imageCredit?: string;
    imageSource?: string;
    imageLicense?: string;
    imageLicenseUrl?: string;
    imageAdaptation?: string;
}

interface BlogImageCreditProps {
    post: ImageCreditFields;
    compact?: boolean;
}

function UnknownNotice({ compact }: { compact: boolean }) {
    if (compact) {
        return <p className="mt-2 text-[10px] font-semibold leading-tight text-zinc-500">Crédito da imagem em verificação</p>;
    }

    return (
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

function ConfirmedCredit({ post, compact }: { post: ImageCreditFields; compact: boolean }) {
    if (compact) {
        const author = post.imageSource ? (
            <a href={post.imageSource} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                {post.imageCredit}
                <span className="sr-only"> (abre em nova aba)</span>
            </a>
        ) : post.imageCredit;

        return (
            <p className="mt-2 text-[10px] font-semibold leading-snug text-zinc-500 break-words">
                Foto: {author}
                {post.imageLicense ? (
                    <>
                        {' · '}
                        {post.imageLicenseUrl ? (
                            <a href={post.imageLicenseUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                                {post.imageLicense}
                                <span className="sr-only"> (abre em nova aba)</span>
                            </a>
                        ) : post.imageLicense}
                    </>
                ) : null}
                {post.imageAdaptation ? ` · ${post.imageAdaptation}` : ''}
            </p>
        );
    }

    return (
        <p className="mb-8 text-xs leading-relaxed text-zinc-500">
            Crédito da capa: {post.imageSource ? (
                <a href={post.imageSource} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                    {post.imageCredit}
                    <span className="sr-only"> (abre em nova aba)</span>
                </a>
            ) : post.imageCredit}
            {post.imageLicense ? (
                <>
                    {' · '}
                    {post.imageLicenseUrl ? (
                        <a href={post.imageLicenseUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                            {post.imageLicense}
                            <span className="sr-only"> (abre em nova aba)</span>
                        </a>
                    ) : post.imageLicense}
                </>
            ) : null}
            {post.imageAdaptation ? ` · ${post.imageAdaptation}` : ''}
        </p>
    );
}

export const BlogImageCredit: React.FC<BlogImageCreditProps> = ({ post, compact = false }) => {
    if (post.imageCreditStatus === 'unknown') {
        return <UnknownNotice compact={compact} />;
    }

    if (post.imageCreditStatus === 'confirmed' && post.imageCredit) {
        return <ConfirmedCredit post={post} compact={compact} />;
    }

    return null;
};