<!-- version-type: minor -->

# @furystack/eslint-plugin

## ✨ Features

### `no-removed-shade-apis` rule now detects `shadowDomName` usage

The `no-removed-shade-apis` rule now reports `shadowDomName` in `Shade()` options as a removed API and provides an auto-fix to rename it to `customElementName`.

### Renamed `valid-shadow-dom-name` rule to `valid-custom-element-name`

The ESLint rule `furystack/valid-shadow-dom-name` has been renamed to `furystack/valid-custom-element-name` to match the property rename. The rule now validates the `customElementName` property instead of `shadowDomName`. Both the `shades` and `shadesStrict` configs reference the new rule name.

## 🧪 Tests

- Updated all rule test cases to use `customElementName` instead of `shadowDomName`
