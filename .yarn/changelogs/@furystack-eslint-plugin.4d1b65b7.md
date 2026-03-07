<!-- version-type: major -->

# @furystack/eslint-plugin

## 💥 Breaking Changes

### Renamed `valid-shadow-dom-name` rule to `valid-custom-element-name`

The ESLint rule `furystack/valid-shadow-dom-name` has been removed and replaced by `furystack/valid-custom-element-name`. If you reference `furystack/valid-shadow-dom-name` in your ESLint config, replace it with `furystack/valid-custom-element-name`. Both the `shades` and `shadesStrict` configs have been updated to use the new rule name.

## ✨ Features

### `no-removed-shade-apis` rule now detects `shadowDomName` usage

The `no-removed-shade-apis` rule now reports `shadowDomName` in `Shade()` options as a removed API and provides an auto-fix to rename it to `customElementName`.
