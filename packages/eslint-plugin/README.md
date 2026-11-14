# @furystack/eslint-plugin

Custom ESLint rules for FuryStack and Shades projects.

## Installation

```bash
yarn add -D @furystack/eslint-plugin
```

## Usage

Add the plugin to your ESLint flat config and enable the rules you need:

```ts
import furystack from '@furystack/eslint-plugin'

export default [
  {
    plugins: {
      furystack,
    },
    rules: {
      // Enable rules from this plugin as needed
    },
  },
]
```

See the exported rule implementations in `src/rules/` for the available rule names and options.
