export interface HeaderStyles {
    headerToneClass: string;
    headerSizeClass: string;
    logoHeightClass: string;
    navGapClass: string;
    actionGapClass: string;
    ctaPaddingClass: string;
    navTextClass: string;
    buttonClass: string;
    mobileToggleClass: string;
}

import { useMemo } from 'react';

export function useHeaderStyles(isScrolled: boolean, isInternalPage: boolean): HeaderStyles {
    return useMemo(() => {
        const useSolidHeader = isScrolled || isInternalPage;

        return {
            headerToneClass: useSolidHeader
                ? 'bg-white/90 text-brand-dark backdrop-blur-md shadow-lg'
                : 'bg-transparent text-white',

            headerSizeClass: isInternalPage
                ? 'py-2 md:py-2.5'
                : isScrolled
                    ? 'py-3'
                    : 'py-6',

            logoHeightClass: isInternalPage ? 'h-14 md:h-20' : 'h-24',
            navGapClass: isInternalPage ? 'gap-6' : 'gap-8',
            actionGapClass: isInternalPage ? 'gap-5' : 'gap-8',
            ctaPaddingClass: isInternalPage ? 'px-4 py-2' : 'px-5 py-2.5',

            navTextClass: useSolidHeader
                ? 'text-zinc-600 hover:text-brand-vibrant'
                : 'text-white/90 hover:text-white',

            buttonClass: useSolidHeader
                ? 'bg-brand-vibrant hover:bg-brand-blue text-white'
                : 'bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border border-white/30',

            mobileToggleClass: useSolidHeader ? 'text-zinc-700' : 'text-white',
        };
    }, [isScrolled, isInternalPage]);
}
