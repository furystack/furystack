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

### Use `usingAsync()` for Injector Cleanup

Always wrap `Injector` instances in `usingAsync()` to ensure proper disposal of singletons (e.g. `LocationService`, stores, caches) after the test completes. This prevents leaked global state (such as monkeypatched `history.pushState`) from affecting subsequent tests.

```typescript
import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'

it('should work with injected services', async () => {
  await usingAsync(new Injector(), async (injector) => {
    // The injector and all its singletons are automatically
    // disposed when this callback returns or throws
    const service = injector.getInstance(MyService)
    expect(service.getData()).toBe('expected')
  })
})
```

**Why this matters:** `Injector` implements `AsyncDisposable`. Services like `LocationService` modify global state in their constructor (e.g. wrapping `history.pushState`). Without proper disposal, these modifications leak across tests causing hangs or flaky failures.

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

## Summary

**Key Principles:**

1. **Test all public APIs** - 100% coverage for exports
2. **Test edge cases** - Null, undefined, errors
3. **Integration tests** - Test package interactions
4. **Type safety tests** - Verify generic constraints
5. **Minimal mocking** - Test real implementations
6. **Clear test structure** - describe > describe > it
7. **Test behavior** - Not implementation details

**Testing Checklist:**

- [ ] All exported APIs have tests
- [ ] Edge cases tested (null, undefined, errors)
- [ ] Integration tests for package interactions
- [ ] Type safety verified
- [ ] Error paths tested
- [ ] Coverage > 80% for public APIs
- [ ] Breaking changes have migration tests

**Tools:**

- Test Runner: `vitest`
- Coverage: `vitest --coverage`
- Commands: `yarn test`
