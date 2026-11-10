/**
 * Styles of the proposal page (#1901, #1926), "O Diário de Bordo" (DESIGN.md).
 *
 * Inline in the page: its CSP allows `style-src 'unsafe-inline'`, no
 * stylesheet URL. Poppins comes from our own origin (`font-src 'self'`),
 * copies of src/fonts at a versioned path: a changed file gets a new
 * `/fonts/vN/`, because `/fonts/*` is cached as immutable (public/_headers).
 * The `latin` subset alone covers Portuguese.
 */

export const PROPOSAL_FONT_WEIGHTS = [400, 700, 900] as const;

export const proposalFontUrl = (weight: (typeof PROPOSAL_FONT_WEIGHTS)[number]) => `/fonts/v1/poppins-${weight}-latin.woff2`;

export const PROPOSAL_FONT_FACES = PROPOSAL_FONT_WEIGHTS.map((weight) => `@font-face{font-family:Poppins;font-style:normal;font-weight:${weight};font-display:swap;src:url(${proposalFontUrl(weight)}) format('woff2')}`).join('\n');

export const PROPOSAL_FONT_PRELOADS = PROPOSAL_FONT_WEIGHTS
    .map((weight) => `<link rel="preload" href="${proposalFontUrl(weight)}" as="font" type="font/woff2" crossorigin>`)
    .join('\n');

export const PROPOSAL_FONT_STACK = "Poppins,ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif";

/*
 * Tokens: light is Névoa de Amanhecer with white surfaces; dark (the system
 * setting) is Ardósia Profunda with "branco rebaixado" text. The price block
 * is the deep surface in both, and the WhatsApp button is the page's only
 * Âmbar Vivo. Céu Tinta / Safira for text on light, never Céu Vivo.
 */
export const PROPOSAL_STYLES = `
${PROPOSAL_FONT_FACES}
:root{color-scheme:light dark;--bg:#F4F8FF;--surface:#fff;--ink:#0f172a;--muted:#475569;--accent:#0056D2;--tint:#e5eefc;--line:#d5dfee;--band:#0056D2;--deep:#0f172a;--deep-ink:rgba(255,255,255,.9);--deep-muted:rgba(255,255,255,.74);--deep-accent:#7dd3fc;--star:#b45309;--logo:#1762a7;--shadow:0 10px 40px -10px rgba(15,23,42,.18);--ease:cubic-bezier(.25,1,.5,1)}
@media (prefers-color-scheme:dark){:root{--bg:#0f172a;--surface:#1a2439;--ink:rgba(255,255,255,.9);--muted:#a9b6ca;--accent:#7dd3fc;--tint:rgba(125,211,252,.12);--line:rgba(255,255,255,.14);--band:#0056D2;--deep:#003B8E;--deep-muted:rgba(255,255,255,.78);--star:#fbbf24;--logo:#fff;--shadow:0 0 0 1px rgba(255,255,255,.08)}}
*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;text-size-adjust:100%}
body{margin:0;font-family:${PROPOSAL_FONT_STACK};font-size:1rem;line-height:1.6;color:var(--ink);background:var(--bg);-webkit-font-smoothing:antialiased}
img,svg{display:block;max-width:100%}
h1,h2,h3{text-wrap:balance}
p,li,dd{text-wrap:pretty}
p{margin:0 0 12px}
a{color:var(--accent);text-underline-offset:3px}
a:focus-visible,summary:focus-visible,.gallery:focus-visible{outline:3px solid #0ea5e9;outline-offset:3px;border-radius:8px}
.icon{width:1.25em;height:1.25em;flex:none;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.shell{width:100%;max-width:44rem;margin:0 auto;padding:0 16px}
.sr{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
.label{margin:0;font-size:.75rem;font-weight:900;letter-spacing:.1em;line-height:1.4;text-transform:uppercase}
.notice{margin:0;padding:10px 16px;font-size:.875rem;font-weight:700;text-align:center;color:#0f172a;background:#e0f2fe}
.top{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:64px}
.logo{display:block;width:auto;height:40px;color:var(--logo)}
@media (min-width:40rem){.top{min-height:72px}.logo{height:44px}}
.top .label{color:var(--muted)}

.hero{position:relative;isolation:isolate;display:flex;align-items:flex-end;min-height:min(80svh,34rem);overflow:hidden;color:rgba(255,255,255,.92);background:var(--band)}
.hero-photo{position:absolute;inset:0;z-index:-2;width:100%;height:100%;object-fit:cover;background:#1e293b}
@media (prefers-color-scheme:dark){.hero-photo{filter:brightness(.85)}}
.hero--plain{min-height:0}
.hero-text{width:100%;padding:112px max(16px,calc((100% - 44rem) / 2 + 16px)) 64px}
.hero--photo .hero-text{text-shadow:0 1px 16px rgba(15,23,42,.35);background:linear-gradient(to bottom,rgba(15,23,42,0) 0,rgba(15,23,42,.62) 96px,rgba(15,23,42,.9) 100%)}
.hero--plain .hero-text{padding-top:40px}
.hero h1{margin:0;font-weight:900;line-height:.95;letter-spacing:-.02em}
.hero-lead{display:block;margin:0 0 10px;font-size:1.0625rem;font-weight:700;line-height:1.35;letter-spacing:0}
.hero-place{display:block;font-size:clamp(2.5rem,12vw,4.75rem);overflow-wrap:anywhere;hyphens:auto;color:#fff}
.hero-place--long{font-size:clamp(2rem,8.5vw,3.5rem);line-height:1}
.hero-meta{display:flex;flex-wrap:wrap;gap:6px 20px;margin:20px 0 0;padding:0;list-style:none;font-size:1rem;line-height:1.4}
.hero-meta li{display:flex;align-items:center;gap:8px}
.hero-meta .icon{color:#7dd3fc}
.route-art{display:grid;grid-template-columns:auto 1fr auto;align-items:end;gap:12px;margin:0 0 28px;color:#fff}
.route-art .code{font-size:clamp(1.75rem,9vw,2.75rem);font-weight:900;line-height:1;letter-spacing:.02em}
.route-art .code small{display:block;margin-top:6px;font-size:.8125rem;font-weight:700;letter-spacing:0;color:rgba(255,255,255,.82)}
.route-art .code:last-child{text-align:right}
.route-arc{width:100%;height:auto;margin-bottom:12px;overflow:visible}
.route-arc .arc{fill:none;stroke:rgba(255,255,255,.62);stroke-width:2;stroke-dasharray:2 7;stroke-linecap:round}
.route-arc circle{fill:rgba(255,255,255,.9)}
.route-plane path{fill:var(--band);stroke:#fff;stroke-width:1.75;stroke-linecap:round;stroke-linejoin:round}
@media (min-width:48rem){.hero{max-width:60rem;margin:0 auto;border-radius:24px}.hero-text{padding-top:144px;padding-bottom:72px}}
@media (prefers-reduced-motion:no-preference){.hero-text>*{animation:rise .7s var(--ease) both}.hero-text>:nth-child(2){animation-delay:.08s}.hero-text>:nth-child(3){animation-delay:.16s}}
@keyframes rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}

.voucher{position:relative;margin-top:-36px}
.summary{padding:24px 20px;border-radius:20px 20px 0 0;background:var(--surface);box-shadow:var(--shadow)}
.summary h2{margin:0 0 16px;font-size:1.25rem;font-weight:900;line-height:1.25}
.summary-list{display:grid;gap:16px;margin:0;padding:0;list-style:none}
.summary-list li{display:grid;grid-template-columns:40px 1fr;gap:14px;align-items:start}
.summary-icon{display:grid;place-items:center;width:40px;height:40px;border-radius:50%;color:var(--accent);background:var(--tint)}
.summary-title{margin:0;font-weight:700;line-height:1.35}
.summary-sub{margin:2px 0 0;font-size:.875rem;line-height:1.45;color:var(--muted)}
.price{padding:24px 20px 28px;border-radius:0 0 20px 20px;color:var(--deep-ink);background:var(--deep)}
.price .label{color:var(--deep-accent)}
.amount{margin:6px 0 2px;font-size:clamp(2.25rem,10vw,3rem);font-weight:900;line-height:1.05;letter-spacing:-.02em;color:#fff}
.amount-alt{margin:0 0 4px;font-size:1.125rem;font-weight:700;color:#fff}
.price-for{margin:6px 0 20px;color:var(--deep-muted)}
.cta{display:flex;align-items:center;justify-content:center;gap:8px;min-height:56px;padding:14px 18px;border-radius:16px;font-weight:700;font-size:1rem;line-height:1.3;text-align:center;text-wrap:balance;color:#0f172a;text-decoration:none;background:#FFD600;box-shadow:4px 4px 0 0 #7dd3fc;transition:transform .15s var(--ease),box-shadow .15s var(--ease),background-color .15s}
.cta:hover{transform:translate(2px,2px);box-shadow:2px 2px 0 0 #7dd3fc;background:#E5C000}
.cta:active{transform:translate(4px,4px);box-shadow:none}
.cta:focus-visible{outline:3px solid #fff;outline-offset:4px}
@media (max-width:26rem){.cta .icon{display:none}}
.valid{margin:16px 0 0;font-size:.875rem;text-align:center;color:var(--deep-muted)}
.valid .icon{display:inline-block;width:1.15em;height:1.15em;margin-right:6px;vertical-align:-.2em}
.price-note{margin:14px 0 0;padding-top:14px;border-top:1px solid rgba(255,255,255,.14);font-size:.875rem;color:var(--deep-muted)}

.section{margin-top:56px}
.section>h2{display:flex;align-items:center;gap:10px;margin:0 0 16px;font-size:clamp(1.375rem,5.5vw,1.75rem);font-weight:900;line-height:1.15;letter-spacing:-.01em}
.section>h2 .icon{color:var(--accent)}
.lead{margin:-8px 0 16px;color:var(--muted)}
.box{margin:0 0 12px;padding:20px;border-radius:16px;background:var(--surface);box-shadow:var(--shadow)}
.box>:last-child{margin-bottom:0}
.title{margin:0;font-size:1.125rem;font-weight:700;line-height:1.35}
.subtitle{margin:2px 0 0;font-size:.9375rem;color:var(--muted)}
.muted{color:var(--muted)}
.fine{margin:8px 0 0;font-size:.8125rem;line-height:1.5;color:var(--muted)}
.fine ul,ul.fine{margin:8px 0 0;padding-left:18px}

.hotel-head{margin:0 0 16px}
.hotel-name{margin:0;font-size:1.25rem;font-weight:700;line-height:1.3}
.stars{display:inline-block;margin-left:6px;font-size:.9375rem;letter-spacing:2px;color:var(--star);white-space:nowrap}
.address{display:flex;align-items:flex-start;gap:6px;margin:6px 0 0;font-size:.9375rem;color:var(--muted)}
.address .icon{margin-top:3px;width:1em;height:1em}
.gallery{display:flex;gap:8px;margin:0 -16px;padding:0 16px 4px;overflow-x:auto;overscroll-behavior-x:contain;scroll-snap-type:x mandatory;scroll-padding:0 16px;scrollbar-width:none}
.gallery::-webkit-scrollbar{display:none}
.gallery img{flex:0 0 84%;width:84%;height:auto;aspect-ratio:4/3;object-fit:cover;border-radius:14px;scroll-snap-align:start;background:var(--line)}
.gallery-hint{margin:8px 0 0;font-size:.8125rem;color:var(--muted)}
@media (min-width:40rem){.gallery{display:grid;grid-template-columns:repeat(3,1fr);margin:0;padding:0;overflow:visible}.gallery img{width:100%}.gallery img:first-child{grid-column:span 2;grid-row:span 2;height:100%}.gallery-hint{display:none}}
.facts{display:grid;grid-template-columns:1fr 1fr;gap:16px 20px;margin:0}
.facts .wide{grid-column:1/-1}
.stay{margin-top:16px}
.facts div{min-width:0}
.facts dt{margin:0 0 2px;font-size:.75rem;font-weight:900;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
.facts dd{margin:0}
.facts ul{margin:0;padding-left:18px}
.about{margin:20px 0 0;max-width:68ch}

details{margin:12px 0 0}
summary{display:inline-flex;align-items:center;gap:6px;min-height:44px;font-weight:700;color:var(--accent);cursor:pointer;list-style:none}
summary::-webkit-details-marker{display:none}
summary .icon{width:1.125em;height:1.125em;transition:transform .2s var(--ease)}
details[open]>summary .icon{transform:rotate(180deg)}
.when-open,details[open]>summary .when-closed{display:none}
details[open]>summary .when-open{display:inline}
.amenities{columns:2 12rem;column-gap:24px;margin:4px 0 0;padding-left:18px;font-size:.875rem}
.amenities li{break-inside:avoid}

.pass{position:relative;margin:0 0 16px;overflow:hidden;border-radius:16px;background:var(--surface);box-shadow:var(--shadow)}
.pass-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 20px;color:#fff;background:var(--band)}
.pass-head>*{margin:0}
.pass-date{font-size:.875rem;font-weight:700}
.pass-body{padding:18px 20px 20px}
.flight-meta{display:flex;flex-wrap:wrap;justify-content:space-between;gap:4px 12px;margin:0 0 10px;font-size:.875rem;color:var(--muted)}
.flight-meta strong{color:var(--ink)}
.leg{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:start;gap:10px}
.end .code{display:block;font-size:2rem;font-weight:900;line-height:1;letter-spacing:.02em}
.end .code--name{font-size:1.0625rem;line-height:1.2;overflow-wrap:anywhere;hyphens:auto}
.end .time{display:block;margin-top:8px;font-size:1.125rem;font-weight:700;line-height:1.2}
.end .place{display:block;margin-top:2px;font-size:.8125rem;line-height:1.35;color:var(--muted);overflow-wrap:anywhere}
.end .next-day{display:block;font-size:.75rem;font-weight:700;white-space:nowrap;color:var(--accent)}
.end--to{text-align:right}
.path{display:flex;flex-direction:column;align-items:center;gap:6px;padding-top:6px;font-size:.75rem;line-height:1.2;color:var(--muted);white-space:nowrap}
.path-line{display:flex;align-items:center;gap:6px;color:var(--accent)}
.path-line::before,.path-line::after{content:'';width:18px;border-top:2px dotted currentColor;opacity:.6}
.path-line .icon{transform:rotate(45deg)}
.connection{display:flex;align-items:center;gap:10px;margin:18px 0;padding:10px 14px;border-radius:12px;font-size:.875rem;line-height:1.4;color:var(--ink);background:var(--tint)}
.connection strong,.connection small{display:block}
.connection small{font-size:.8125rem;color:var(--muted)}
.connection .icon{color:var(--accent)}
.pass-stub{position:relative;display:flex;flex-wrap:wrap;gap:6px 18px;margin:0;padding:14px 20px 16px;border-top:2px dashed var(--line);font-size:.875rem;color:var(--muted)}
.pass-stub::before,.pass-stub::after{content:'';position:absolute;top:-11px;width:20px;height:20px;border-radius:50%;background:var(--bg)}
.pass-stub::before{left:-10px}
.pass-stub::after{right:-10px}
.pass-stub span{display:inline-flex;align-items:center;gap:6px}
@media (max-width:22rem){.end .code{font-size:1.625rem}.path-line::before,.path-line::after{width:10px}}

.when{display:inline-flex;align-items:center;gap:6px;margin:0 0 6px;font-size:.875rem;font-weight:700;color:var(--accent)}
.when .icon{width:1em;height:1em}
.notes{margin:0;padding:0;list-style:none}
.notes li{position:relative;margin:0 0 10px;padding-left:22px}
.notes li::before{content:'';position:absolute;left:4px;top:.6em;width:7px;height:7px;border-radius:50%;background:var(--accent)}
.conditions{max-width:68ch}
footer{margin-top:56px;padding:24px 0 40px;border-top:1px solid var(--line);font-size:.8125rem;color:var(--muted)}
footer p{max-width:68ch}
@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important}}
`;
