# Anhangá Viagens — Design System

The working design system for **Anhangá Viagens**, a Brazilian-Portuguese concierge travel agency. Pulled from the production codebase (`AV-SITE`, Vite + React + Tailwind) and consolidated here as a neutral, tool-agnostic reference for new designs.

---

## 1 · About the brand

> **Anhangá é a agência de viagens que cuida de cada detalhe da sua próxima aventura — no seu tempo, do seu jeito.**

- **Product:** boutique travel agency selling custom itineraries, not packages. There is a sister brand "Anhangá Tech" (see `assets/logo-anhanga-tech.svg`), but this system covers the traveler-facing experience.
- **Language:** 100% **Brazilian Portuguese**. Tone is warm, second-person plural ("a gente", "você"), conversational but precise. Avoid corporate/agency jargon.
- **Voice pillars:**
  - **Humano** — there's a real person on the other side.
  - **Artesanal** — each trip is handmade, no templates.
  - **Acompanhado** — we walk with you from first idea to last sunset.
- **Mood words:** sincero, artesanal, sonhador, aconchegante, bem-feito.

---

## 2 · Visual language (one-paragraph brief)

Warm cream paper canvas (`#fffdf5`), heavy **Poppins 800/900** display type with negative tracking, and a **neobrutalist signature** of 2px dark outlines + flat offset shadows (`4px 4px 0 #0f172a`). Energy comes from a single vivid **yellow (#FFD600)** used as tape, highlights, stamps, and primary-CTA fill; the brand blue `#0056D2` lives mostly in the logo, while `sky-500 #0ea5e9` carries interactive/action states. Imagery is treated like a **scrapbook**: tilted polaroids, washi tape, rubber stamps ("Achado Anhangá"), underline scribbles, Merriweather-italic pull-quotes. Accent colors (orange/emerald/sky/blue) are used pastel-tinted to differentiate card families — never saturated.

**Do**
- Commit to one bold yellow accent per screen.
- Let cards tilt (-2°/+2°) on hover, snap back on click.
- Use Merriweather italic *only* for testimonials and hand-written moments.
- Pair every primary CTA with an arrow that slides on hover.

**Don't**
- Use gradients bigger than text highlights or avatar chips.
- Mix more than two accent card-colors in one section.
- Use emoji as iconography — use the line-icon placeholders.
- Round below 8px or above 48px.

---

## 3 · Files in this project

| File | What it is |
|---|---|
| `colors_and_type.css` | All tokens — palette, type scale, radii, shadows, spacing, motion — as CSS custom properties. Import this into any new design. |
| `SKILL.md` | How to use this system to create new designs. |
| `assets/logo-anhanga-viagens-azul.svg` | Primary logo. Use on light (≥ `#F4F8FF`) surfaces. |
| `assets/logo-anhanga-viagens-branco.svg` | Inverted logo. Use on `#0f172a` / photography. |
| `assets/logo-anhanga-tech.svg` | Sister brand — don't mix unless the design is specifically about AV Tech. |
| `assets/noise.svg` | Subtle paper noise overlay (use ~5% opacity on hero blocks). |
| `preview/*.html` | Design-system cards shown in the review panel. Also a quick component reference. |

---

## 4 · Core tokens (summary)

```
Brand          #0056D2 blue · #FFD600 yellow · #0f172a dark
Action         sky-500 #0ea5e9   sky-600 hover #0284c7
Canvas         cream #fffdf5 (home)   sky-tinted #F4F8FF (alt sections)
Accents        orange-100/600 · emerald-100/600 · sky-50/500 · blue-100/600
Neutrals       Tailwind gray 50-900
Display font   Poppins 800 · tracking -0.035em at hero scale
Body font      Poppins 400/600/700 · line-height 1.6
Editorial font Merriweather 400/700 + italic · blog & pull-quotes
Radius         8 · 12 · 16 · 24 · 32 · 40 · 48 · full
Signature shadow   4 4 0 #0f172a    (+ 8 8 0 rgba(0,0,0,.05) on cards)
Button shadow      4 4 0 yellow on dark   · 4 4 0 dark on yellow
```

All of the above are available as CSS variables prefixed `--av-*` — see `colors_and_type.css`.

---

## 5 · Signature patterns

- **Hero H1** — 72–96px Poppins 800, the keyword wrapped in `.av-scribble` with the yellow gradient.
- **Section eyebrow** — `.av-badge` pill above every H2 (uppercase, 20% tracking).
- **CTA (primary)** — yellow pill, 2px dark border, 4/4/0 dark shadow, arrow slides on hover.
- **Polaroid** — white card, `-2deg` rotate, washi tape tab on top, optional rubber stamp at top-right, italic caption.
- **"Achado Anhangá" sticker** — emerald dashed border, letter-spaced uppercase.
- **How-it-works step** — large numbered badge in yellow, rotated -4deg, tucked into top-left of card.
