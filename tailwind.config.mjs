import typography from '@tailwindcss/typography';

const EASE_OUT_EXPO = 'cubic-bezier(0.16, 1, 0.3, 1)';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./pages/**/*.{js,ts,jsx,tsx}",
        "./services/**/*.{js,ts,jsx,tsx}",
        "./utils/**/*.{js,ts,jsx,tsx}",
        "./data/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // LEGADO — não usar em código novo. Namespace canônico: `anhanga-*`
                // (ver lib/design-tokens.ts). Congelado por tests/tailwind-brand-namespace-guard.test.ts;
                // migre usos de brand-* → anhanga-* oportunisticamente e abaixe o baseline do guard.
                brand: {
                    cyan: '#0ea5e9', // Sky 500
                    cyanDark: '#0284c7', // Sky 600
                    blue: '#1e40af', // Blue 800
                    vibrant: '#0ea5e9', // Cyan
                    yellow: '#FFD600', // Âmbar Vivo — canonical brand yellow
                    dark: '#0f172a', // Slate 900
                    light: '#f0f9ff', // Sky 50
                    surface: '#fffdf5', // Superfície Quente — warm cream background
                },
                'fun-yellow': '#FFD23F',
                'fun-blue': '#2563EB', // #1970: era #3B82F6 (3.7:1 sob texto branco)
                'fun-pink': '#D02A50', // #1970: era #EE4266 (3.7:1 sob texto branco)
                'fun-green': '#087F4D', // #1970: era #0EAD69 (2.9:1 sob texto branco)
                'fun-dark': '#0F172A',
                'fun-white': '#F8FAFC',
                anhanga: {
                    action:     '#0ea5e9',   // cor de ação (antigo brand-cyan / brand-vibrant)
                    actionDark: '#0284c7',   // hover de ação (antigo brand-cyanDark)
                    actionInk:  '#0369a1',   // Céu Vivo como TEXTO em fundo claro (5.9:1; #0ea5e9 mede 2.8:1)
                    dark:       '#0f172a',   // necessário para text-anhanga-dark / bg-anhanga-dark
                    blue: '#0056D2',
                    darkBlue: '#003B8E',
                    yellow: '#FFD600',
                    yellowHover: '#E5C000',
                    light: '#F4F8FF',
                    whatsapp: '#25D366',
                },
            },
            fontFamily: {
                // Arial antes da Roboto (#1982): um desktop com Roboto instalada continua na face
                // medida contra a Arial; no Android, sem Arial, cai na face medida contra a Roboto.
                sans: ['Poppins', 'Poppins Fallback', 'Poppins Fallback Android', 'sans-serif'],
                // 'Anhanga Serif' É o Merriweather, renomeado por exigência da OFL
                // (Reserved Font Name) ao ser subsetado — ver src/fonts.css.
                serif: ['Anhanga Serif', 'Georgia', 'serif'], // Fonte editorial para o blog
                // Sem o Poppins Fallback de propósito (#1972): o size-adjust é medido em texto
                // corrido, e em caixa alta a Poppins Black é ~8% mais estreita que a Arial Bold —
                // ajustado, o fallback deixava títulos como o "É SURREAL." da /orlando/ 18% mais
                // largos, estourando a tela a 320px e deslocando o H1 inteiro no swap.
                display: ['Poppins', 'sans-serif'], // Headings principais (Poppins 900)
            },
            boxShadow: {
                'glow': '0 0 20px rgba(14, 165, 233, 0.5)',
                'float': '0 10px 40px -10px rgba(0,0,0,0.15)',
                'float-lg': '0 20px 60px -15px rgba(0,0,0,0.2)',
                'hard': '4px 4px 0px 0px rgba(15, 23, 42, 1)',
                'hard-yellow': '4px 4px 0px 0px #FFD600',
                'hard-lg': '8px 8px 0px 0px rgba(15, 23, 42, 1)',
                'hard-hover': '6px 6px 0px 0px rgba(15, 23, 42, 1)',
            },
            animation: {
                'fade-in-up': 'fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                'fade-in-down': 'fadeInDown 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                'pop-in': `popIn 0.3s ${EASE_OUT_EXPO} forwards`,
                'draw': 'draw 1.5s ease-in-out forwards',
                'float': 'float 6s ease-in-out infinite',
                'blob': 'blob 10s infinite',
            },
            keyframes: {
                fadeInUp: {
                    '0%': { opacity: '0', transform: 'translateY(30px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                fadeInDown: {
                    '0%': { opacity: '0', transform: 'translateY(-20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                popIn: {
                    '0%': { opacity: '0', transform: 'scale(0.9) translateY(10px)' },
                    '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
                },
                draw: {
                    '0%': { strokeDasharray: '100', strokeDashoffset: '100' },
                    '100%': { strokeDashoffset: '0' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                blob: {
                    '0%': { transform: 'translate(0px, 0px) scale(1)' },
                    '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
                    '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
                    '100%': { transform: 'translate(0px, 0px) scale(1)' },
                }
            },
            transitionTimingFunction: {
                'spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
            }
        },
    },
    plugins: [
        typography,
    ],
}
