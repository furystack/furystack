<!-- version-type: major -->

# @furystack/rest-client-fetch

## 💥 Breaking Changes

- Version bumped to align with the monorepo-wide functional DI migration. No DI surface in this package; the browser REST client (`createClient<Api>({ endpointUrl })`) is unchanged. See the [v7 migration guide](../../docs/migrations/v7-functional-di.md) for the full picture on other packages.
