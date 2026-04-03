export const tokens = {
    color: {
        action:      'anhanga-action',      // #0ea5e9 — botões, links, foco
        actionDark:  'anhanga-actionDark',  // #0284c7 — hover de ação
        accent:      'anhanga-yellow',      // #FFD600 — CTAs principais
        accentHover: 'anhanga-yellowHover', // #E5C000
        brand:       'anhanga-blue',        // #0056D2 — identidade (logo, footer)
        surface:     'white',
        surfaceAlt:  'anhanga-light',       // #F4F8FF — fundos de seção
        dark:        'anhanga-dark',        // #0f172a — textos, footer
        muted:       'gray-500',
    },
    shadow: {
        hard:       'shadow-hard',          // 4px 4px 0 #0f172a
        hardYellow: 'shadow-hard-yellow',   // 4px 4px 0 #FFD600
        hardLg:     'shadow-hard-lg',
        float:      'shadow-float',
        floatLg:    'shadow-float-lg',
        glow:       'shadow-glow',
    },
    radius: {
        sm:   'rounded-lg',
        md:   'rounded-xl',
        lg:   'rounded-2xl',
        full: 'rounded-full',
    },
} as const;
