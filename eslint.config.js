// Progressive lint ratchet (issue #1144). This config applies to the whole
// repo, but enforcement in CI is scoped to changed files only
// (`pnpm lint:changed`, see scripts/lint-changed.ts) — the existing codebase
// predates this config and is not expected to pass it today. `pnpm lint`
// (unscoped, full-repo) is available locally for gradually paying down that
// debt, but is informational, not a CI gate. See docs/standards/linting.md
// for the adoption path to widen the gate over time.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      '.prerender-ssr/**',
      'node_modules/**',
      'data/blogManifest.ts',
      'data/blogMarkdown.ts',
      'public/**',
      '.worktrees/**',
      '.claude/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,

      // Unsafe promises: a fire-and-forget promise that silently swallows a
      // rejection is exactly the class of bug docs/standards/security.md and
      // api-conventions.md ask handlers to avoid (unhandled provider-call
      // failures). Errors, not warnings — this is a correctness rule, not style.
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',

      // docs/standards/code-style.md AVOID: "Adding any, broad type
      // assertions, or implicit shape assumptions where a runtime boundary
      // exists." Warn (not error) — plenty of existing `any` is legitimate at
      // real boundaries (JSON.parse, third-party callback shapes); the ratchet
      // should nudge new code, not force re-litigating every prior judgment call.
      '@typescript-eslint/no-explicit-any': 'warn',

      // Unused vars are noise, not correctness bugs on their own — warn.
      // Allow the common `_`-prefixed intentional-unused convention.
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    // Root-level config files and build scripts (postcss.config.mjs,
    // scripts/*.mjs) run under Node outside the TS project service, so they
    // don't pick up the globals set on the `**/*.{ts,tsx}` block above —
    // without this, `console`/`process` are flagged as no-undef false
    // positives.
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  {
    // Regression/e2e tests run under node:test / Playwright, not a browser —
    // node globals apply, and test files legitimately use `any` more freely
    // for mock/fixture shaping.
    files: ['tests/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    // node:test regression files (flat `tests/*.test.ts`) call `test()`/
    // `describe()` at the top level; those return a Promise the runner awaits
    // internally, so the intentional "floating" call is the API contract, not
    // an unhandled rejection — the rule would otherwise fire on every one.
    // Scoped to the flat glob on purpose: Playwright e2e specs and page objects
    // under tests/e2e/** don't float `test()` this way, and there the rule still
    // catches real bugs (e.g. a forgotten `await page.click()`), so keep it on.
    files: ['tests/*.test.ts'],
    rules: {
      '@typescript-eslint/no-floating-promises': 'off',
    },
  },
);
