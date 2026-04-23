<!-- version-type: major -->

# @furystack/entity-sync

## 💥 Breaking Changes

Version bumped to align with the monorepo-wide functional DI migration. See the [v7 migration guide](../../docs/migrations/v7-functional-di.md) for the full picture.

- No direct API changes — this package only exports shared protocol types. Downstream consumers in `@furystack/entity-sync-service` and `@furystack/entity-sync-client` have moved to DI tokens; any code that imported types for use with those packages should check their respective changelogs.
