<!-- version-type: patch -->

# @furystack/auth-jwt

## ♻️ Refactoring

- Removed a double-cast (`as Parameters<typeof innerClient>[0]`) when forwarding options from `createJwtClient().call()` into the inner `createClient` call. The spread result is now assigned to a typed local variable first, so the typed REST client signature is preserved without an assertion. This keeps `@furystack/auth-jwt` compliant with the new `furystack/rest-no-type-cast` rule shipped in `@furystack/eslint-plugin`.
