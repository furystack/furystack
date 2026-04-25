---
name: review-changes
description: Review all changes on the current branch. Use when the user asks for a code review or PR review.
disable-model-invocation: false
inputs:
  - id: branch
    type: currentBranch
    description: The branch to review
---

# review-changes

Review all changes on the current branch compared to the upstream branch.

## Context

{{branch}}

## Determining the Base Branch

**IMPORTANT:** This repository uses `develop` as the integration branch, not `master` or `main`.

1. **Use `develop` as the default base branch** for all comparisons:

   ```bash
   git diff origin/develop...HEAD
   ```

2. **Verify by checking GitHub workflows** if unsure - look at `.github/workflows/*.yml` for `pull_request.branches` targets

3. **Use the correct git diff syntax:**
   - `origin/develop...HEAD` - shows changes in current branch since it diverged from develop
   - Run `git log --oneline origin/develop..HEAD` to see commits being reviewed

## Pre-flight: Detect Change Types

Before launching subagents, analyze what files changed:

```bash
git diff origin/develop...HEAD --name-only
```

**Conservative skip rules (only skip when 100% safe):**

| Reviewer                | Run         | Notes                                               |
| ----------------------- | ----------- | --------------------------------------------------- |
| `reviewer-prettier`     | ✅ Always   | Formats `.md`, `.json`, `.ts`, `.tsx`, etc.         |
| `reviewer-versioning`   | ✅ Always   | Fast validation, can fail early                     |
| `reviewer-changelog`    | ✅ Always   | Fast validation, can fail early                     |
| `reviewer-dependencies` | Conditional | Run if ANY `package.json` changed                   |
| `reviewer-typescript`   | Conditional | Skip ONLY if NO `.ts`/`.tsx` in `packages/` changed |
| `reviewer-eslint`       | Conditional | Skip ONLY if NO `.ts`/`.tsx` in `packages/` changed |
| `reviewer-tests`        | Conditional | Skip ONLY if NO `.ts`/`.tsx` in `packages/` changed |

**When in doubt, run the check.** Fast failures are better than missed issues.

## Execution Strategy

**IMPORTANT:** Launch ALL applicable subagents in a SINGLE parallel batch.
Do NOT wait for one group to finish before starting another.

In one tool call batch, launch all applicable reviewers:

- `reviewer-prettier` (always)
- `reviewer-versioning` (always)
- `reviewer-changelog` (always)
- `reviewer-dependencies` (if any `package.json` changed)
- `reviewer-typescript` (if `.ts`/`.tsx` in `packages/` changed)
- `reviewer-eslint` (if `.ts`/`.tsx` in `packages/` changed)
- `reviewer-tests` (if `.ts`/`.tsx` in `packages/` changed)

**Note:** `reviewer-dependencies` checks changelog documentation but does NOT create/modify changelogs. If both changelog and dependency changes exist, both reviewers run in parallel - the dependency reviewer only reads existing changelogs.

## Analysis Required

Check for:

**Code Quality & Bugs:**

- Potential bugs, edge cases, or runtime errors
- Code smells, anti-patterns, or violations of repository rules (check `.cursor/rules/*`)
- Newly added TODO/FIXME comments that should be addressed
- Suspicious or unclear code changes
- Business logic changes that need scrutiny

**Standards & Compliance:**

- Delegate to `reviewer-typescript` subagent to check for TypeScript errors
- Delegate to `reviewer-eslint` subagent to check for linting violations
- Delegate to `reviewer-prettier` subagent to check for formatting issues
- Breaking changes to public API surface
- Package exports changes
- Type definition changes

**FuryStack Library-Specific:**

- Public API changes (exported functions, tokens, types)
- Breaking changes detection
- Dependency injection patterns (`defineService`, `defineStore`, `defineDataSet`, `injector.get`/`bind`/`invalidate`/`createScope`, `useSystemIdentityContext`, throw-by-default store tokens)
- Observable patterns (`ObservableValue`, subscriptions)
- Disposable resources (`Symbol.dispose`, `Symbol.asyncDispose`, factory `onDispose`)
- Package structure and organization

**Shades Patterns:**

- Flag `useState()` used only for CSS-representable states (hover, focus, active)
- Recommend using `css` property with pseudo-selectors instead:

  ```typescript
  // ❌ Anti-pattern to flag
  const [isHovered, setIsHovered] = useState('hover', false)
  <div onMouseEnter={() => setIsHovered(true)} style={{ opacity: isHovered ? 1 : 0.7 }} />

  // ✅ Recommend instead
  css: { opacity: '0.7', '&:hover': { opacity: '1' } }
  ```

- Static `style` props in Shade definitions should use `css` instead
- Flag usage of `element` in render function destructuring or body -- it was removed, use `useHostProps` or `useRef` instead
- Flag usage of `onAttach` or `onDetach` in `ShadeOptions` -- they were removed, use `useDisposable` instead
- Flag direct DOM manipulation inside `render()` that should use `useHostProps` (e.g. `this.setAttribute(...)`, `this.style.xxx = ...`)
- Recommend `useRef` + `queueMicrotask` for deferred child element access instead of direct DOM queries

**Testing & Coverage:**

- Delegate to `reviewer-tests` subagent to run unit tests and assess coverage
- Missing test coverage for new/changed public APIs
- Test quality and edge case coverage

**Performance & Security:**

- Performance concerns (memory leaks, missing disposal)
- Security vulnerabilities or data exposure

**Versioning & Changelog:**

- Delegate to `reviewer-versioning` subagent to validate version bumps
- Delegate to `reviewer-changelog` subagent to validate changelog entries

**Dependencies:**

- Delegate to `reviewer-dependencies` subagent to validate dependency consistency across packages

**Documentation:**

- Missing or outdated documentation for public APIs
- README updates for new features
- Breaking change documentation

**ESLint Rule Opportunities:**

Look for patterns in the diff that suggest a new custom ESLint rule should be added to `@furystack/eslint-plugin`. Signals to watch for:

- **Repeated anti-pattern fixes** — the same kind of correction applied across multiple files (e.g., replacing `X` with `Y` in 5+ places). If a human has to remember to avoid it, a lint rule can enforce it.
- **New conventions introduced** — if the branch establishes a new "always do X instead of Y" pattern, it may be worth codifying as a rule.
- **Manual enforcement via comments** — code comments like "don't do X", "always use Y here", or "TODO: lint rule for this" are direct signals.
- **Domain-specific patterns** — especially around DI (`defineService`, `defineStore`, `defineDataSet`, token-based resolution), Observables (`ObservableValue`, subscriptions, disposal), Shades rendering (render hooks, JSX patterns), REST actions (`RequestError`, validation), and data access (`DataSetToken`, `StoreToken`).

When evaluating a potential rule:

1. **Check existing rules first** — read `packages/eslint-plugin/src/rules/` to verify the pattern isn't already covered. The plugin currently has rules for: DI consistency, observable disposal, Shades render hooks, REST action validation, custom element naming, removed APIs, and more.
2. **Determine the config** — would it belong in `recommended` (general FuryStack patterns) or `shades` (Shades UI framework patterns)?
3. **Assess feasibility** — can the pattern be reliably detected via AST analysis? Patterns that depend on runtime behavior or external context are poor candidates.
4. **Consider false positives** — a good rule has a low false-positive rate. If the pattern has many legitimate exceptions, it may not be worth a rule.

## Subagent Output Rules

**IMPORTANT:** Only include subagent results in the final output if they found errors or issues.

- If `reviewer-typescript` passes → Do NOT mention it in the output
- If `reviewer-eslint` passes → Do NOT mention it in the output
- If `reviewer-prettier` passes → Do NOT mention it in the output
- If `reviewer-tests` passes → Do NOT mention it in the output
- If `reviewer-versioning` passes → Do NOT mention it in the output
- If `reviewer-changelog` passes → Do NOT mention it in the output
- If `reviewer-dependencies` passes → Do NOT mention it in the output

Only report subagent findings when they detect actual problems.

## Output Format

**1. Summary:** Brief overview of changes (2-3 sentences max)

**2. Issues by Priority:**

- 💀 **Critical:** Must fix before merge
- 🔥 **High:** Should fix before merge
- 🤔 **Medium:** Consider addressing
- 💚 **Low:** Nice to have

For each issue, be specific: package, file, line, problem, suggested fix.

**3. Test Coverage:** Assess coverage quality. Warn if public APIs lack tests.

**4. Breaking Changes:** List any breaking changes and suggest migration guide if needed.

**5. ESLint Rule Suggestions:** If any patterns were identified that could become custom ESLint rules, list them here. For each suggestion include:

- **Pattern:** What the rule would enforce (with a brief before/after code example if helpful)
- **Config:** `recommended` or `shades`
- **Rationale:** Why this is worth automating (frequency of occurrence, risk of mistakes, etc.)

Omit this section entirely if no rule opportunities were found.

**6. Changelog:** Generate a short, consistent changelog as a copyable markdown code block.

Format:

- Use present tense, imperative mood (e.g., "Add", "Fix", "Update", "Remove")
- One line per logical change (max 5-7 lines)
- Group by type if multiple changes: Features, Fixes, Refactors
- No verbose descriptions - keep each line under 80 characters

Example:

```
- Add user profile validation
- Fix observable memory leak in cache
- Update dependency injection patterns
```

**7. Pull Request Description:** Generate as a copyable markdown code block with:

- Relevant emoji per header
- Brief description of what the PR does
- **Remaining Tasks** checklist generated from found issues (if any), grouped by priority:

```markdown
## 📋 Remaining Tasks

### 💀 Critical

- [ ] Fix TypeScript error in `packages/core/src/foo.ts:42`

### 🔥 High

- [ ] Add missing test for `handleSubmit` function

### 🤔 Medium

- [ ] Address memory leak in observable subscription
```

Omit empty priority sections. If no issues found, omit the entire Remaining Tasks section.

**Style:** Be critical, specific, and concise. Focus on library quality and API surface area. If unsure, ask for clarification.
