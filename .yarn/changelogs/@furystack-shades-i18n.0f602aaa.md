<!-- version-type: major -->

# @furystack/shades-i18n

## 💥 Breaking Changes

Version bumped to align with the monorepo-wide functional DI migration. See the [v7 migration guide](../../docs/migrations/v7-functional-di.md) for rationale and patterns.

- No runtime API changes. Test fixtures now import the concrete `I18NServiceImpl` class from `@furystack/i18n` (the `I18NService` interface is no longer constructable).
