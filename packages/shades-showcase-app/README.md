# @furystack/shades-showcase-app

A showcase application demonstrating FuryStack Shades UI components and features. This app serves as both a demo and a visual testing ground for the Shades component library.

## Features

- Live examples of all `@furystack/shades-common-components`
- Theme switching and customization
- Interactive component playground
- E2E test coverage with Playwright

## Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/furystack/furystack.git
   cd furystack
   ```

2. Install dependencies:

   ```bash
   yarn install
   ```

3. Start the development server:

   ```bash
   yarn workspace @furystack/shades-showcase-app start
   ```

4. Open your browser at http://localhost:8080

## Theme Switching

The app exposes a `window.useTheme()` helper for switching themes at runtime from the browser console:

```js
// Switch to a built-in theme
useTheme('dark')
useTheme('light')

// Pop-culture themes (lazy-loaded)
useTheme('architect') // Matrix
useTheme('auditore') // Assassin's Creed
useTheme('chieftain') // Warcraft 1 Orc
useTheme('dragonborn') // Skyrim
useTheme('neon-runner') // Cyberpunk
useTheme('paladin') // Warcraft 1 Human
useTheme('plumber') // Super Mario
useTheme('replicant') // Blade Runner
useTheme('sandworm') // Dune
useTheme('shadow-broker') // Mass Effect
useTheme('vault-dweller') // Fallout
```

## Running E2E Tests

```bash
yarn workspace @furystack/shades-showcase-app e2e
```
