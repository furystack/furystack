# @furystack/shades-nipple

NippleJS joystick wrapper for FuryStack Shades.

This package provides a Shades component wrapper for [NippleJS](https://yoannmoi.net/nipplejs/), a virtual joystick library for touch devices.

## Installation

```bash
npm install @furystack/shades-nipple nipplejs
# or
yarn add @furystack/shades-nipple nipplejs
```

## Usage

```tsx
import { Shade, createComponent } from '@furystack/shades'
import { NippleComponent } from '@furystack/shades-nipple'

const GameControls = Shade({
  shadowDomName: 'game-controls',
  render: () => (
    <NippleComponent
      managerOptions={{
        mode: 'static',
        position: { left: '50%', top: '50%' },
        color: 'blue',
      }}
      style={{ width: '200px', height: '200px', position: 'relative' }}
      onStart={(evt, data) => {
        console.log('Joystick started', data)
      }}
      onMove={(evt, data) => {
        console.log('Direction:', data.direction?.angle)
        console.log('Distance:', data.distance)
        console.log('Force:', data.force)
      }}
      onEnd={(evt, data) => {
        console.log('Joystick released')
      }}
      onDir={(evt, data) => {
        // Fired when direction changes (up, down, left, right)
        console.log('Direction changed:', data.direction?.angle)
      }}
    />
  ),
})
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `managerOptions` | `JoystickManagerOptions` | NippleJS manager options (see NippleJS docs) |
| `style` | `CSSStyleDeclaration` | Inline styles for the container |
| `onStart` | `(evt, data) => void` | Called when the joystick is pressed |
| `onEnd` | `(evt, data) => void` | Called when the joystick is released |
| `onMove` | `(evt, data) => void` | Called while the joystick is being moved |
| `onDir` | `(evt, data) => void` | Called when direction changes |

## Manager Options

Common `managerOptions` properties:

| Option | Type | Description |
|--------|------|-------------|
| `mode` | `'static' \| 'semi' \| 'dynamic'` | Joystick behavior mode |
| `position` | `{ left: string, top: string }` | Position for static mode |
| `color` | `string` | Joystick color |
| `size` | `number` | Joystick size in pixels |
| `threshold` | `number` | Minimum distance before triggering events |
| `fadeTime` | `number` | Fade animation duration |

See the [NippleJS documentation](https://yoannmoi.net/nipplejs/) for all available options.
