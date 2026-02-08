# @furystack/shades-lottie

Lottie animation player wrapper for FuryStack Shades.

This package provides TypeScript JSX type definitions for the `lottie-player` web component, allowing you to use Lottie animations in your Shades applications with full type safety.

## Installation

```bash
npm install @furystack/shades-lottie
# or
yarn add @furystack/shades-lottie
```

You also need to include the `lottie-player` library in your application. Add it to your HTML:

```html
<script src="https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js"></script>
```

## Usage

Import the package to register the JSX types, then use the `lottie-player` element in your components:

```tsx
import '@furystack/shades-lottie'
import { Shade, createComponent } from '@furystack/shades'

const MyComponent = Shade({
  tagName: 'my-animation',
  render: () => (
    <lottie-player
      src="https://assets.lottiefiles.com/packages/lf20_example.json"
      autoplay
      loop
      style={{ width: '300px', height: '300px' }}
    />
  ),
})
```

## Props

The `lottie-player` element accepts the following props:

| Prop         | Type                      | Description                                      |
| ------------ | ------------------------- | ------------------------------------------------ |
| `src`        | `string`                  | URL to the Lottie JSON animation file (required) |
| `autoplay`   | `boolean`                 | Start playing automatically                      |
| `loop`       | `boolean`                 | Loop the animation                               |
| `controls`   | `boolean`                 | Show playback controls                           |
| `speed`      | `number`                  | Playback speed (1 = normal)                      |
| `direction`  | `number`                  | Playback direction (1 = forward, -1 = reverse)   |
| `mode`       | `string`                  | Play mode                                        |
| `hover`      | `boolean`                 | Play on hover                                    |
| `count`      | `number`                  | Number of times to play                          |
| `background` | `string`                  | Background color                                 |
| `renderer`   | `'svg' \| 'canvas'`       | Rendering mode                                   |
| `style`      | `CSSStyleDeclaration`     | Inline styles                                    |
| `onclick`    | `(e: MouseEvent) => void` | Click handler                                    |
