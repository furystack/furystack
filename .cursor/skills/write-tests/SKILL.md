---
name: write-tests
description: Author Vitest unit, Vitest integration, or Playwright E2E tests for FuryStack code. Use when the user asks to write/add/cover tests for a function, module, package, component, or flow.
---

# write-tests

Generate tests that follow `.cursor/rules/TESTING_GUIDELINES.mdc` patterns. Read that rule first if not already in context — it owns the invariants (disposable safety, `flushUpdates`, minimal mocking, `injector.bind` over manual mocks). This skill owns the **workflow**.

## Step 1 — Identify the target

Ask the user (or infer from context) **what** to test:

- File path or symbol name (e.g. `defineService`, `Header.tsx`, "the login flow")
- One unit or many?
- Existing spec or new file?

If unclear, ask one short clarifying question before proceeding.

## Step 2 — Pick the test type

| Type        | When                                                    | Runner     | File pattern                                                |
| ----------- | ------------------------------------------------------- | ---------- | ----------------------------------------------------------- |
| Unit        | One function / class / hook helper / Shade in isolation | Vitest     | `<source>.spec.ts` / `<source>.spec.tsx` co-located         |
| Integration | Multiple modules wired through a real `Injector`        | Vitest     | `<feature>.integration.spec.ts` co-located (framework only) |
| E2E         | User-facing flow through running app + browser          | Playwright | `e2e/<flow>.e2e.spec.ts`                                    |

Skip the E2E branch if the repo has no `e2e/` folder or no Playwright config.

## Step 3 — Read the source

Read the file under test. Identify:

- Public exports (functions, classes, types, components)
- Branches / edge cases (null, undefined, errors, async failures)
- Disposable resources owned (`ObservableValue`, `Cache`, `Injector`, stores)
- DI dependencies used inside (`inject(...)`, `injector.get(...)`)
- For Shades components: render hooks used, observables subscribed, async behaviors

## Step 4 — Scaffold the spec

### Unit (Vitest)

Always wrap disposables in `using` / `usingAsync`. Substitute deps via `injector.bind`, not `vi.fn()` mocks (unless the dep is a non-DI external).

```typescript
import { describe, expect, it } from 'vitest'
import { createInjector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'

describe('<unit name>', () => {
  it('<behavior> when <condition>', async () => {
    await usingAsync(createInjector(), async (injector) => {
      // arrange / act / assert
    })
  })
})
```

For Shade components, set `environment: 'jsdom'` in vitest project config (already done in the apps). Render with `Shade`, await `flushUpdates()` before asserting DOM.

### Integration (Vitest, framework only)

Use real services across packages, real `Injector`, real stores (`InMemoryStore`). File: `*.integration.spec.ts`. Same `usingAsync` discipline.

### E2E (Playwright)

```typescript
import { expect, test } from '@playwright/test'

test.describe('<flow name>', () => {
  test('<scenario>', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('<selector>')).toBeVisible()
    // interact + assert
  })
})
```

Locate Shade components by their `customElementName` (e.g. `page.locator('shade-app-header')`). Prefer semantic locators (`getByRole`, `getByLabel`) inside.

## Step 5 — Cover required cases

For each public export, ensure tests for:

- **Happy path** — normal inputs, expected output
- **Documented branches** — every branch the function explicitly handles (modes, options, discriminator values)
- **Error paths** — thrown errors, rejected promises, `RequestError` codes that the function emits intentionally
- **Disposal** — for owners of `ObservableValue` / `Cache` / `Injector`, assert post-dispose behavior as documented

**Why this list does not include "null / undefined / random invalid inputs":** older guidance asked for blanket null/undefined tests on every export. That asserts TypeScript works, not that the code does, and it encourages defensive runtime guards for inputs the types already forbid. Trust the TS type system; consumers will use it too.

You **MUST** test null / undefined / malformed inputs when, and only when:

- The function sits at an **external boundary without schema validation** — REST handler not wrapped in `Validate(...)`, WebSocket message handler, file parser, env-var consumer, anything consuming `unknown` or `JSON.parse` output. At runtime there is no contract enforcement, so the function is the line of defense and bad-payload tests are required.
- The function's **type signature itself allows** the case (`T | null`, `T | undefined`, `unknown`, optional `T?`). Then the documented behavior on each branch must be exercised.

If a `Validate(...)` (or equivalent JSON-schema / zod) wrapper sits ahead of the function, the wrapper covers the bad-payload tests — the inner function should not retest them.

If you can't cover a path because the source has dead code, surface it instead of writing a vacuous test.

## Step 6 — Watch for false positives

- Assertions inside `try/catch` → use `expect.assertions(N)` so the test fails if the function unexpectedly resolves.
- Assertions inside `.forEach` / `.map` callbacks → same risk.
- Async assertions without `await` → promise resolves after the test completes.
- Mocks that always return success → make at least one test exercise failure.

## Step 7 — Run

| Type            | Command                           |
| --------------- | --------------------------------- |
| Unit            | `yarn test`                       |
| Specific file   | `yarn test <path>`                |
| Coverage        | `yarn test --coverage`            |
| E2E             | `yarn test:e2e`                   |
| E2E single file | `yarn playwright test e2e/<file>` |

Investigate every failure. Do **not** mark a test `skip` to make CI green.

## Step 8 — Verify lint + types

```bash
yarn lint
yarn build
```

Fix anything new the change introduced.

## Output

Report:

- Files created / modified
- Number of cases added per export
- Coverage delta if `--coverage` was run
- Any uncoverable paths with rationale
