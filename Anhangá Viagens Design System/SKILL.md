# SKILL — Designing for Anhangá Viagens

This is the skill the design system wants you to run whenever a user asks for a new Anhangá design (landing section, email, deck slide, campaign visual, etc.).

---

## 1 · Before you open a file

1. **Read `README.md`.** It has the voice, the Do/Don'ts, and the one-paragraph visual brief. Don't skip it — the tokens alone won't give you the handmade scrapbook mood. **Fonts loaded: Poppins 400/600/700/800 and Merriweather 400/700 regular + italic — only these.** Requesting 500 or 900 falls back and looks wrong.
2. **Decide the surface.** Web section? Phone mockup? Print? Deck slide? Pick the right starter component (`ios_frame.jsx`, `browser_window.jsx`, `deck_stage.js`, `design_canvas.jsx`). Anhangá designs usually need a *real* phone or browser frame — the brand is strongly about craft.
3. **Ask** (if the brief is ambiguous): what page/flow, how many variations, tone (more sonhador vs. more prático), locale (Brazilian Portuguese is default, always).

---

## 2 · Setup

Every new HTML file should:

```html
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <link rel="stylesheet" href="colors_and_type.css">
  <!-- Poppins + Merriweather come from the @import inside colors_and_type.css -->
</head>
<body>…</body>
</html>
```

`lang="pt-BR"` is not optional — all copy is Brazilian Portuguese.

---

## 3 · Composition rules (the parts that aren't in the CSS)

### Layout
- **Canvas = cream `#fffdf5`**. Alternate sections on `#F4F8FF` (sky-tinted) or full-bleed dark `#0f172a` for emphasis.
- Max content width `1200px`, generous breathing room (`96px` vertical between sections).
- Never center-align a body paragraph longer than two lines — left-align.

### Type hierarchy per screen
- One H1 only. Keyword wrapped in `.av-scribble`.
- Every H2 preceded by an `.av-badge` eyebrow.
- Pull-quotes use Merriweather italic with a **yellow** opening quote glyph.

### Color discipline
- Pick **one** accent family per card grid (all orange, all emerald, or all sky). Don't rainbow.
- Yellow `#FFD600` is reserved for: primary CTAs, tape, stamps, scribble highlights. Don't fill backgrounds with it.
- Brand blue `#0056D2` appears almost only in the logo — use `sky-500 #0ea5e9` for interactive blue.

### The "scrapbook" kit
Use at most **two** of these per section, never all at once:
- Washi tape (`rgba(254,249,195,.92)` with a slight rotate)
- Rubber stamp ("Achado Anhangá", dashed border, rotated 8–14°)
- Polaroid tilt (`-2deg` / `+1.5deg`, alternating)
- Scribble underline / highlight (`.av-scribble`)
- Italic hand-note caption in Merriweather

### Buttons
- Primary → yellow pill, dark border, `4 4 0` dark shadow, arrow slides +3px on hover.
- Secondary → dark pill with yellow `4 4 0` shadow.
- Ghost → white pill with dark `4 4 0` shadow.
- Hover → translate `-2px,-2px`, shadow grows to `6 6 0`. This is the system's signature.

### Imagery
- You usually won't have real photos. Use **labeled placeholders** (see `preview/cards-content.html`): a gradient rectangle + a mono-font label like `"PATAGÔNIA · BR→AR"` positioned bottom-left.
- Add a tape or stamp on top to still feel handmade.
- Ask the user for real imagery before final polish.

### Copywriting (Pt-BR)
Anhangá's voice examples to emulate:
- "Sem script, sem pacote engessado."
- "A gente acompanha do embarque ao último pôr-do-sol."
- "Respondemos em até 24h — com gente de verdade."
- CTA verbs: *Planejar*, *Começar a sonhar*, *Falar com a gente*, *Ver destinos*. Avoid *Clique aqui*, *Saiba mais* as primary CTAs.

---

## 4 · Variations — what to explore

When giving multiple options (almost always), vary along these axes:

1. **Mood** — one quieter/editorial, one louder/scrapbook.
2. **Layout rhythm** — asymmetric hero vs. centered hero; alternating split sections vs. stacked cards.
3. **Accent family** — orange-led vs. emerald-led vs. sky-led.
4. **Imagery treatment** — polaroid grid, magazine collage, single full-bleed with sticker overlay.

Expose variations as **Tweaks** (see `Make tweakable` skill) when they're knobs on a single design, or as side-by-side slides in `design_canvas.jsx` when they're fundamentally different directions.

---

## 5 · Checklist before calling `done`

- [ ] `lang="pt-BR"` on `<html>`
- [ ] `colors_and_type.css` linked
- [ ] No raw hex in your markup — use `var(--av-*)` tokens
- [ ] At least one scrapbook element per section (tape, stamp, polaroid, scribble)
- [ ] Every primary CTA has the yellow-on-dark hard shadow + arrow
- [ ] All copy is Brazilian Portuguese, warm, second person
- [ ] H1 appears once, keyword in `.av-scribble`
- [ ] Section H2s have an `.av-badge` eyebrow
- [ ] No emoji unless the user specifically asked
- [ ] Images are either real (user-supplied) or honest labeled placeholders — never fake stock
