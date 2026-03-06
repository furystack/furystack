<!-- version-type: patch -->

# @furystack/shades-showcase-app

## 🐛 Bug Fixes

- Added missing `findOptions[Symbol.dispose]()` call in `GridPageService` to prevent memory leaks

## ♻️ Refactoring

- Replaced manual `useDisposable(ObservableValue)` + `useObservable` pattern with `useState()` in `MarkdownPage`, reducing boilerplate for local component state

## 📦 Build

- Added missing TypeScript project references for `@furystack/i18n`, `@furystack/shades-i18n`, and `@furystack/shades-mfe`
