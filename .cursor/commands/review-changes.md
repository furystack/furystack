# review-changes

Review all changes on the current branch compared to the base branch.

## Determining the Base Branch

**IMPORTANT:** Do not assume `master` is the base branch. This repository uses `develop` as the integration branch.

1. **Use `develop` as the default base branch** for comparisons:
   ```bash
   git diff origin/develop...HEAD
   ```

2. **Verify by checking GitHub workflows** if unsure - look at `.github/workflows/*.yml` for `pull_request.branches` targets

3. **Use the correct git diff syntax:**
   - `origin/develop...HEAD` - shows changes in current branch since it diverged from develop
   - Run `git log --oneline origin/develop..HEAD` to see commits being reviewed

## Analysis Required

Check for:

**Code Quality & Bugs:**

- Potential bugs, edge cases, or runtime errors
- Code smells, anti-patterns, or violations of repository rules (check `.cursor/rules/*`)
- Newly added TODO/FIXME comments that should be addressed
- Suspicious or unclear code changes
- Business logic changes that need scrutiny

**Standards & Compliance:**

- TypeScript errors or type safety issues
- Linting violations
- Breaking changes to public API surface
- Package exports changes
- Type definition changes

**FuryStack Library-Specific:**

- Public API changes (exported functions, classes, types)
- Breaking changes detection
- Dependency injection patterns (@Injectable, @Injected)
- Observable patterns (ObservableValue, subscriptions)
- Disposable resources (Symbol.dispose)
- Package structure and organization

**Testing & Coverage:**

- Missing test coverage for new/changed public APIs
- Test quality and edge case coverage
- Breaking changes that need migration guide

**Performance & Security:**

- Performance concerns (memory leaks, missing disposal)
- Security vulnerabilities or data exposure

**Documentation:**

- Missing or outdated documentation for public APIs
- README updates for new features
- Breaking change documentation

## Output Format

**1. Summary:** Brief overview of changes (2-3 sentences)

**2. Issues by Priority:**

- 💀 **Critical:** Must fix before merge
- 🔥 **High:** Should fix before merge
- 🤔 **Medium:** Consider addressing
- 💚 **Low:** Nice to have

For each issue, be specific: package, file, line, problem, suggested fix.

**3. Test Coverage:** Assess coverage quality. Warn if public APIs lack tests.

**4. Breaking Changes:** List any breaking changes and suggest migration guide if needed.

**5. Pull Request Description:** Generate as a copyable markdown code block with relevant emojis per header.

**Style:** Be critical, specific, and concise. Focus on library quality and API surface area. If unsure, ask for clarification.
