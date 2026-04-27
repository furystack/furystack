<!-- version-type: patch -->

# furystack

## 🔧 Chores

### Cursor rules + skills consolidation

Migrated the legacy `.md` rules in `.cursor/rules/` to FuryStack's targeted `.mdc` format and trimmed each one to its auto-applied surface. The previous monoliths were split into focused rules:

- `CODE_STYLE.mdc`, `TYPESCRIPT_GUIDELINES.mdc`, `COMPLEXITY.mdc` — auto-applied to all `.ts` / `.tsx`
- `LIBRARY_DEVELOPMENT.mdc` — auto-applied in `packages/`
- `SHADES_RENDER.mdc` — auto-applied to `packages/**/*.tsx`
- `TESTING_GUIDELINES.mdc` — auto-applied to `*.spec.ts` / `*.spec.tsx`
- `CACHE_HANDLING.mdc` — auto-applied to `.tsx`

Removed the now-redundant `.cursor/rules/README.md`, `LIBRARY_DEVELOPMENT.md`, `TESTING_GUIDELINES.md`, `VERSIONING_AND_CHANGELOG.md`, and `CACHE_HANDLING.md`. `rules-index.mdc` is the new entry point.

Added on-demand skills under `.cursor/skills/`:

- `create-shade-component` — scaffolds a Shade component from scratch
- `implement-store-adapter` — guides adding a new physical-store backend
- `write-tests` — authors Vitest unit / Vitest integration / Playwright E2E tests
- `fill-changelog`, `review-changes` — refreshed against the new rule layout

Added the `reviewer-complexity` agent and refreshed `reviewer-changelog` and `reviewer-versioning` so `/review-changes` flags overgrown components, services, and REST actions per `COMPLEXITY.mdc` heuristics.

### ESLint JSDoc enforcement

Enabled `jsdoc/check-alignment`, `jsdoc/check-tag-names`, and `jsdoc/empty-tags` in the workspace ESLint config, set the `jsdoc` plugin to `mode: 'typescript'`, and aliased `@template` to `@typeParam`. `jsdoc/no-undefined-types` and `jsdoc/require-jsdoc` were intentionally left disabled — TypeScript's own `{@link}` validation covers cross-module references, and `publicOnly` overshoots the actual JSDoc surface required by `CODE_STYLE.mdc`.

## ⬆️ Dependencies

- `@vitest/coverage-istanbul` `^4.1.5`
- `ajv` `^8.20.0`
- `eslint` `^10.2.1`
- `eslint-plugin-playwright` `^2.10.2`
- `jsdom` `^29.1.0`
- `typescript-eslint` `^8.59.0`
- `vite` `^8.0.10`
- `vitest` `^4.1.5`
