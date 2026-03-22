# Code Style Standard

## Purpose

Keep React 19, TypeScript, and Vite code predictable, reviewable, and easy to extend without pushing unrelated cleanup into small changes.

## Applies To

- `components/**/*.tsx`
- `pages/**/*.tsx`
- `hooks/**/*.ts`
- `lib/**/*.ts`
- `services/**/*.ts`
- `api/**/*.ts`
- `tests/**/*.ts`
- `utils/**/*.ts`
- `scripts/**/*`

## REQUIRED

- Use TypeScript for new application code unless a tool or runtime requires a different format.
- Match the repo naming pattern:
  - React pages and UI components use `PascalCase.tsx`.
  - API handlers, utility modules, and shared logic use kebab-case or descriptive lowercase module names such as `submit-lead.ts` and `lead-logic.ts`.
- Keep each file focused on one primary responsibility. Split files that combine unrelated UI, validation, transport, and provider logic.
- Keep render functions pure. Put subscriptions, timers, DOM access, and browser-only behavior inside `useEffect` or isolated helpers.
- Use existing shared helpers before creating new local variants for validation, network behavior, rate limiting, or payload normalization.
- Keep private helpers close to the module that owns them. Promote helpers to `lib/` or `services/` only when they are truly shared.
- Keep comments for intent, tradeoffs, or non-obvious constraints. Do not add commentary for straightforward code.
- Preserve the local export style of the area you are editing:
  - Route components and main UI components may use a default export.
  - Utility and helper modules should prefer named exports.
- Favor clear control flow with early returns over deep nesting.
- Use explicit types at boundaries where data crosses runtime or provider edges.

## RECOMMENDED

- Group imports in this order: framework, third-party, internal absolute, internal relative.
- Use the `@/` alias when it improves clarity for cross-project imports. Use relative imports for nearby modules. Do not mix styles randomly inside one file.
- Keep component props and local interfaces near the component that uses them.
- Extract magic strings, repeated response messages, and numeric thresholds into local constants when reused.
- Keep Tailwind class lists grouped by purpose rather than alphabetized mechanically. A readable order is:
  - layout and positioning
  - sizing and spacing
  - typography
  - color and backgrounds
  - borders, shadows, and effects
  - state and motion
- Prefer small, composable helpers over large inline callbacks inside JSX or handlers.
- Split large effects by responsibility when one effect is handling unrelated concerns.

## AVOID

- Introducing new formatting or linting conventions that are not enforced in the repo today.
- Adding `any`, broad type assertions, or implicit shape assumptions where a runtime boundary exists.
- Leaving debug-only `console.log` calls in UI code or shared modules after the task is complete.
- Deeply nested ternaries, hidden side effects during render, or giant anonymous functions in JSX.
- Mixing provider-specific business logic directly into presentation components when it belongs in hooks, services, or `lib/`.

## Examples

- `pages/Home.tsx` is a good example of a route component that keeps render logic readable and isolates browser behavior in separate effects.
- `api/submit-lead.ts` is a good example of keeping a large handler manageable by extracting request ID, response, parsing, and provider helpers.
- `lib/lead-logic.ts` is the right kind of place for shared sanitization and normalization that multiple API flows depend on.
- A new reusable transformation for lead payloads belongs in `lib/` or `services/`, not inside `components/AIChat.tsx`.

## Exceptions

- Generated or machine-maintained files such as `data/blogManifest.ts` may use shapes or formatting that differ from hand-written modules.
- Runtime-specific integration files may need uncommon exports or top-level constructs required by Vercel, Vite, or Playwright.
- A lightly touched legacy file may keep local style if a full refactor would expand scope without improving the task outcome. Document the exception when the mismatch is material.
