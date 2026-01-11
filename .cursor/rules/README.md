# Cursor Rules Overview

This directory contains coding guidelines and best practices for the **FuryStack framework monorepo**. These rules are designed for library development with emphasis on public API quality, type safety, and maintainability.

## 🤖 Intelligent Auto-Apply System

Each rule file contains frontmatter metadata that tells Cursor **when** and **where** to automatically apply it:

- **Always Applied**: Foundation rules (`CODE_STYLE.mdc`, `TYPESCRIPT_GUIDELINES.mdc`) apply to all TypeScript files
- **Auto-Applied by File Type**: Rules automatically activate when you work on matching files
- **Context-Aware**: Cursor intelligently includes relevant rules based on what you're doing

## Rule Applicability Matrix

| Rule File | Auto-Apply | File Patterns | Description |
| --- | --- | --- | --- |
| [CODE_STYLE.mdc](./CODE_STYLE.mdc) | ✅ Always | `**/*.ts`, `**/*.tsx` | Naming, formatting, organization |
| [TYPESCRIPT_GUIDELINES.mdc](./TYPESCRIPT_GUIDELINES.mdc) | ✅ Always | `**/*.ts`, `**/*.tsx` | Type safety, NO `any`, generics |
| [TESTING_GUIDELINES.mdc](./TESTING_GUIDELINES.mdc) | 🎯 Auto | `**/*.spec.ts`, `**/*.spec.tsx` | Public API testing, integration tests |
| [LIBRARY_DEVELOPMENT.mdc](./LIBRARY_DEVELOPMENT.mdc) | 🎯 Auto | `**/*.ts`, `**/packages/**` | DI patterns, Observable, disposables |

**Legend:**

- ✅ Always = Applied to all matching files automatically
- 🎯 Auto = Applied when file pattern matches

## Quick Reference by Task

### Creating a New Package

**Steps:**

1. Create package directory: `packages/my-package/`
2. Add `package.json` with proper exports
3. Add `tsconfig.json` extending root config
4. Create `src/index.ts` with exports
5. Document public API with JSDoc

**Apply rules:**

- **LIBRARY_DEVELOPMENT.mdc** - Package structure, exports
- **CODE_STYLE.mdc** - Naming, organization
- **TYPESCRIPT_GUIDELINES.mdc** - Public API types

### Creating an Injectable Service

**Apply in order:**

1. **LIBRARY_DEVELOPMENT.mdc** - @Injectable pattern, lifetime
2. **TYPESCRIPT_GUIDELINES.mdc** - Type safety, generics
3. **CODE_STYLE.mdc** - Class structure, naming

**Pattern:**

```typescript
@Injectable({ lifetime: 'singleton' })
export class MyService {
  @Injected(Dependency)
  private declare dependency: Dependency;

  public [Symbol.dispose](): void {
    // Cleanup
  }
}
```

### Adding Public API

**Apply in order:**

1. **TYPESCRIPT_GUIDELINES.mdc** - Explicit types, no `any`
2. **LIBRARY_DEVELOPMENT.mdc** - API design, documentation
3. **TESTING_GUIDELINES.mdc** - Test coverage for new API
4. **CODE_STYLE.mdc** - JSDoc, exports

**Checklist:**

- [ ] Explicit types on all parameters and returns
- [ ] JSDoc with examples
- [ ] Tests covering all use cases
- [ ] Exported from package index
- [ ] No breaking changes (or major version bump)

### Writing Tests

**Apply in order:**

1. **TESTING_GUIDELINES.mdc** - Test structure, coverage
2. **TYPESCRIPT_GUIDELINES.mdc** - Type-safe tests
3. **CODE_STYLE.mdc** - Test organization

**Focus:**

- Test all public APIs
- Test edge cases (null, undefined, errors)
- Integration tests between packages
- 100% coverage for exports

## Rule Categories

### 1. Foundation Rules (Apply Always)

- **CODE_STYLE.mdc**: File naming, import ordering, code organization
- **TYPESCRIPT_GUIDELINES.mdc**: Type safety, no `any`, generics

**Priority**: Critical
**Enforcement**: TypeScript compiler, ESLint, Prettier

### 2. Library Development Rules

- **LIBRARY_DEVELOPMENT.mdc**: DI patterns, Observable, disposables, package structure

**Priority**: High
**Enforcement**: Code review, architecture review

### 3. Quality Rules

- **TESTING_GUIDELINES.mdc**: Public API testing, integration tests, coverage

**Priority**: High
**Enforcement**: Test coverage reports, CI/CD

## Rule Priority Levels

### Critical (MUST follow)

- No `any` type in public APIs (TYPESCRIPT_GUIDELINES.mdc)
- All exports have tests (TESTING_GUIDELINES.mdc)
- Proper disposal implementation (LIBRARY_DEVELOPMENT.mdc)
- Semantic versioning (LIBRARY_DEVELOPMENT.mdc)

### High (SHOULD follow)

- JSDoc on all public APIs (CODE_STYLE.mdc)
- Explicit types on exports (TYPESCRIPT_GUIDELINES.mdc)
- @Injectable for services (LIBRARY_DEVELOPMENT.mdc)
- Integration tests (TESTING_GUIDELINES.mdc)

### Medium (RECOMMENDED)

- Type guards for runtime checks (TYPESCRIPT_GUIDELINES.mdc)
- Deprecation before removal (LIBRARY_DEVELOPMENT.mdc)
- Examples in JSDoc (CODE_STYLE.mdc)

## Package-Specific Contexts

### Core Packages (inject, core, utils)

- ✅ CODE_STYLE.mdc
- ✅ TYPESCRIPT_GUIDELINES.mdc
- ✅ LIBRARY_DEVELOPMENT.mdc
- ✅ TESTING_GUIDELINES.mdc

**Focus**: DI patterns, type safety, thorough testing

### UI Packages (shades)

- ✅ CODE_STYLE.mdc
- ✅ TYPESCRIPT_GUIDELINES.mdc
- ✅ LIBRARY_DEVELOPMENT.mdc
- ✅ TESTING_GUIDELINES.mdc

**Focus**: Component API, Observable patterns, JSX type safety

### Service Packages (rest-service, logging)

- ✅ CODE_STYLE.mdc
- ✅ TYPESCRIPT_GUIDELINES.mdc
- ✅ LIBRARY_DEVELOPMENT.mdc
- ✅ TESTING_GUIDELINES.mdc

**Focus**: Public API design, error handling, documentation

## Summary

**Core Philosophy:**

- **Library Quality**: Public APIs must be well-designed and documented
- **Type Safety**: No `any`, explicit types for all exports
- **Testing**: 100% coverage for public APIs
- **Dependency Injection**: @Injectable pattern for services
- **Observable Patterns**: Reactive state with ObservableValue
- **Disposable Resources**: Proper cleanup with Symbol.dispose
- **Breaking Changes**: Semantic versioning, deprecation before removal

**Rule Application Strategy:**

1. Always apply foundation rules (CODE_STYLE, TYPESCRIPT_GUIDELINES)
2. Apply LIBRARY_DEVELOPMENT for new services/APIs
3. Apply TESTING_GUIDELINES for all new code
4. Focus on public API quality and documentation

**Key Development Principles:**

- Design for library consumers
- Explicit over implicit
- Type safety is paramount
- Test everything
- Document everything
- No breaking changes without major version
- Proper resource disposal

**Monorepo Commands:**

- Build: `yarn build` (builds all packages)
- Test: `yarn test` (tests all packages)
- Lint: `yarn lint`
- Format: `yarn prettier`
- Clean: `yarn clean`
- Version: `yarn bumpVersions`
