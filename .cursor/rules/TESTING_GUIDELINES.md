# Testing Guidelines

## Public API Testing

### Test All Exported APIs

Every exported function, class, and method must have tests:

```typescript
// ✅ Good - testing public API
describe('Injectable', () => {
  it('should create injectable class with singleton lifetime', async () => {
    await usingAsync(new Injector(), async (injector) => {
      @Injectable({ lifetime: 'singleton' })
      class MyService {}

      const instance1 = injector.getInstance(MyService)
      const instance2 = injector.getInstance(MyService)

      expect(instance1).toBe(instance2) // Same instance
    })
  })

  it('should create injectable class with transient lifetime', async () => {
    await usingAsync(new Injector(), async (injector) => {
      @Injectable({ lifetime: 'transient' })
      class MyService {}

      const instance1 = injector.getInstance(MyService)
      const instance2 = injector.getInstance(MyService)

      expect(instance1).not.toBe(instance2) // Different instances
    })
  })
})
```

### Test Edge Cases

Test boundary conditions and error scenarios:

```typescript
// ✅ Good - testing edge cases
describe('ObservableValue', () => {
  it('should handle null values', () => {
    const obs = new ObservableValue<string | null>(null)
    expect(obs.getValue()).toBeNull()
  })

  it('should handle undefined values', () => {
    const obs = new ObservableValue<string | undefined>(undefined)
    expect(obs.getValue()).toBeUndefined()
  })

  it('should notify subscribers on value change', () => {
    const obs = new ObservableValue(0)
    const values: number[] = []

    obs.subscribe((value) => values.push(value))
    obs.setValue(1)
    obs.setValue(2)

    expect(values).toEqual([0, 1, 2])
  })
})
```

## Integration Tests

### Test Package Integration

Test how packages work together:

```typescript
// ✅ Good - integration test
describe('DI Integration', () => {
  it('should inject dependencies across packages', async () => {
    await usingAsync(new Injector(), async (injector) => {
      @Injectable({ lifetime: 'singleton' })
      class ServiceA {
        public name = 'ServiceA'
      }

      @Injectable({ lifetime: 'singleton' })
      class ServiceB {
        @Injected(ServiceA)
        declare public serviceA: ServiceA

        public getName(): string {
          return this.serviceA.name
        }
      }

      const serviceB = injector.getInstance(ServiceB)

      expect(serviceB.getName()).toBe('ServiceA')
    })
  })
})
```

### Test Type Safety

Test that type constraints work as expected:

```typescript
// ✅ Good - type safety tests
describe('Cache types', () => {
  it('should enforce load function type', () => {
    type User = { id: string; name: string }

    const cache = new Cache<[string], User>({
      capacity: 10,
      load: async (id: string): Promise<User> => {
        return { id, name: 'Test' }
      },
    })

    // TypeScript ensures type safety
    const user: User = await cache.get('123')
    expect(user.id).toBe('123')
  })
})
```

## Resource Disposal

### Wrap All Disposable Resources in `using()` / `usingAsync()`

All disposable resources created in tests **must** be wrapped in `using()` (sync) or `usingAsync()` (async) blocks. This ensures cleanup runs even when a test assertion fails or an exception is thrown mid-test. **Never** rely on manual `[Symbol.dispose]()` / `[Symbol.asyncDispose]()` calls at the end of a test -- if the test throws before reaching that line, the resource leaks.

Common disposable types in FuryStack:

- `Injector` (AsyncDisposable)
- `ObservableValue` (Disposable)
- `Cache` (Disposable)
- `ListService`, `TreeService`, `CollectionService` (Disposable)
- `LayoutService`, `ContextMenuManager`, `CommandPaletteManager`, `SuggestManager` (Disposable)
- `DataGridService` (Disposable)
- `InMemoryStore`, `FileSystemStore`, and other `PhysicalStore` subclasses (Disposable / AsyncDisposable)
- `EventHub` (Disposable)
- `ValueObserver` (Disposable)

```typescript
import { using, usingAsync } from '@furystack/utils'

// ✅ Good - sync disposable wrapped in using()
it('should cache values', () => {
  using(new Cache({ load: (a: number) => Promise.resolve(a) }), (cache) => {
    // cache is automatically disposed when this callback returns or throws
    expect(cache.has(1)).toBe(false)
  })
})

// ✅ Good - async disposable wrapped in usingAsync()
it('should work with injected services', async () => {
  await usingAsync(new Injector(), async (injector) => {
    const service = injector.getInstance(MyService)
    expect(service.getData()).toBe('expected')
  })
})

// ❌ Bad - manual dispose can be skipped if test throws
it('should cache values', () => {
  const cache = new Cache({ load: (a: number) => Promise.resolve(a) })
  expect(cache.has(1)).toBe(false) // if this throws, dispose never runs
  cache[Symbol.dispose]()
})
```

**Exception:** When the test's purpose is to verify disposal behavior itself (e.g. "should throw after dispose", "dispose should clear the cache"), manual disposal control is acceptable.

```typescript
// ✅ OK - testing post-disposal behavior requires manual control
it('should throw on setValue after dispose', () => {
  const v = new ObservableValue(1)
  v[Symbol.dispose]()
  expect(() => v.setValue(2)).toThrowError('Observable already disposed')
})
```

**Why this matters:** `Injector` and services like `LocationService` modify global state (e.g. wrapping `history.pushState`). Stores hold data. Observables hold observer references. Without proper disposal, these leak across tests causing hangs, flaky failures, or memory growth.

## Vitest Patterns

### Test Structure

```typescript
// ✅ Good - clear test structure
describe('PackageName', () => {
  describe('ClassName', () => {
    describe('methodName', () => {
      it('should behave correctly when condition', () => {
        // Arrange
        const instance = new ClassName()

        // Act
        const result = instance.methodName()

        // Assert
        expect(result).toBe(expected)
      })
    })
  })
})
```

### Minimal Mocking

Keep mocking minimal in library tests:

```typescript
// ✅ Good - testing real implementations
describe('Injector', () => {
  it('should create instances of registered classes', async () => {
    await usingAsync(new Injector(), async (injector) => {
      class MyClass {}

      injector.setExplicitInstance(MyClass, new MyClass())

      const instance = injector.getInstance(MyClass)
      expect(instance).toBeInstanceOf(MyClass)
    })
  })
})
```

## Test Coverage

### Coverage Requirements

- **Public APIs**: 100% coverage required
- **Internal helpers**: 80%+ coverage recommended
- **Error paths**: All error conditions tested

```bash
# Run tests with coverage
yarn test --coverage

# Coverage report should show:
# - Statements: > 80%
# - Branches: > 80%
# - Functions: > 90%
# - Lines: > 80%
```

## Testing Shade Components

### Microtask Batching and `flushUpdates()`

Shade component renders are batched via `queueMicrotask`. After triggering a state change (e.g. `setState`, `observable.setValue()`), the DOM is **not updated synchronously**. Tests must await `flushUpdates()` before asserting DOM state:

```typescript
import { flushUpdates } from '@furystack/shades'

it('should update the DOM after state change', async () => {
  // ... trigger a state change that causes a re-render ...
  await flushUpdates()
  // Now safe to assert DOM state
  expect(element.textContent).toBe('updated')
})
```

If a render itself triggers further `updateComponent()` calls (e.g. via observable subscriptions), an additional `await flushUpdates()` may be needed to process the cascaded updates.

### Testing with `usingAsync` and Injectors

When testing components that use dependency injection, always wrap the `Injector` in `usingAsync()` to ensure proper disposal. This is already documented in the Resource Disposal section above.

## Summary

**Key Principles:**

1. **Test all public APIs** - 100% coverage for exports
2. **Test edge cases** - Null, undefined, errors
3. **Integration tests** - Test package interactions
4. **Type safety tests** - Verify generic constraints
5. **Minimal mocking** - Test real implementations
6. **Clear test structure** - describe > describe > it
7. **Test behavior** - Not implementation details
8. **Flush microtasks** - Use `await flushUpdates()` for Shade component tests
9. **Dispose resources** - Wrap all disposables in `using()` / `usingAsync()`

**Testing Checklist:**

- [ ] All exported APIs have tests
- [ ] Edge cases tested (null, undefined, errors)
- [ ] Integration tests for package interactions
- [ ] Type safety verified
- [ ] Error paths tested
- [ ] Coverage > 80% for public APIs
- [ ] Breaking changes have migration tests
- [ ] All disposable resources wrapped in `using()` / `usingAsync()`

**Tools:**

- Test Runner: `vitest`
- Coverage: `vitest --coverage`
- Commands: `yarn test`
