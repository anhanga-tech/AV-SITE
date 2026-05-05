# Spec: Visible H1 for Orlando Landing (FEL-114)

## Context
The Orlando landing page currently has an `h1.sr-only` for SEO and a separate `<p aria-hidden="true">` for visual presentation. This creates a weak SEO signal and potential (though minor) accessibility/cloaking risks.

## Goal
Promote the main heading to a single, visible `<h1>` that contains both the descriptive SEO text and the visual "Orlando É SURREAL" branding.

## Proposed Design (Option B: Combined H1)
We will unify the heading structure into a single `<h1>` tag containing two main parts:
1.  **Descriptive Label:** The current H1 text ("Pacote para Orlando 2026...") will become a visible, secondary-style line within the `<h1>`.
2.  **Branding Title:** The "Orlando É SURREAL." text will be moved inside the `<h1>`, maintaining its large, stylized appearance.

### Markup Change
In `components/landings/orlando/OrlandoApp.tsx`:

```tsx
// FROM:
<h1 style={{...}}>Pacote para Orlando 2026: Roteiro Personalizado Disney e Universal</h1>
<div className="title-collage">
    <p aria-hidden="true">
        <span className="highlight-blue">Orlando</span>
        <span className="highlight-pink">É SURREAL.</span>
    </p>
</div>

// TO:
<h1>
    <span className="hero-label">Pacote para Orlando 2026: Roteiro Personalizado Disney e Universal</span>
    <span className="title-collage">
        <span className="highlight-blue">Orlando</span>
        <span className="highlight-pink">É SURREAL.</span>
    </span>
</h1>
```

### CSS Change
In `pages/landings/orlando.css`:
- Update `.landing-orlando h1` to remove the "hidden" styles (`font-size: 1px`, `height: 1px`, etc.).
- Reset default `h1` margins/paddings.
- Add `.hero-label` styling (current H1 inline styles moved to CSS).
- Ensure `.title-collage` still functions correctly when it's a `<span>` instead of a `<div>`.

## Success Criteria
- [ ] Exactly one `<h1>` on the `/orlando` page.
- [ ] The `<h1>` must be visible to users.
- [ ] The `<h1>` must contain the text "Pacote para Orlando 2026" and "Orlando É SURREAL".
- [ ] Automated test (Playwright) verifies the presence and visibility of the H1.

## Risks
- **CSS Specificity:** Nested spans in an H1 might inherit unwanted styles.
- **Visual Impact:** Adding the descriptive line might slightly shift the layout; we must ensure it feels integrated.
