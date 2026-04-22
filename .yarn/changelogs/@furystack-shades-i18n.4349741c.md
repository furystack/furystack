<!-- version-type: major -->

# @furystack/shades-i18n

## 💥 Breaking Changes

### Bumped peer dependency on `@furystack/shades`

This release aligns with the `@furystack/shades` major release that renamed `NestedRouteLink`'s `href` prop to `path` and switched `nestedNavigate` to an object-arg signature. No source changes were required in this package, but consumers that also use `@furystack/shades` routing APIs need to migrate those call sites — see the `@furystack/shades` changelog for details.

**Impact:** Consumers upgrading to the new `@furystack/shades` major must also update any `NestedRouteLink` / `nestedNavigate` call sites in their own code.
