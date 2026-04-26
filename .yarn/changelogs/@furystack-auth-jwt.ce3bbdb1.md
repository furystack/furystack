<!-- version-type: patch -->

# @furystack/auth-jwt

## 📚 Documentation

- Documented why `createJwtAuthProvider` intentionally does not implement the new `AuthenticationProvider.getCacheKey` hook: caching the user lookup risks serving an expired or revoked token's identity for up to a full TTL window. Apps that want to amortize the user-data-set lookup should embed the needed claims in the JWT itself.
