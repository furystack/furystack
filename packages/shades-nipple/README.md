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
  customElementName: 'game-controls',
  render: () => (
    <NippleComponent
      managerOptions={{
        mode: 'static',
        position: { left: '50%', top: '50%' },
        color: 'blue',
      }}
      style={{ width: '200px', height: '200px', position: 'relative' }}
      onStart={(event) => {
        console.log('Joystick started', event.data)
      }}
      onMove={(event) => {
        console.log('Direction:', event.data.direction?.angle)
        console.log('Distance:', event.data.distance)
        console.log('Force:', event.data.force)
      }}
      onEnd={() => {
        console.log('Joystick released')
      }}
      onDir={(event) => {
        // Fired when direction changes (up, down, left, right)
        console.log('Direction changed:', event.data.direction?.angle)
      }}
    />
  ),
})
```

## Props

| Prop             | Type                   | Description                                  |
| ---------------- | ---------------------- | -------------------------------------------- |
| `managerOptions` | `NippleManagerOptions` | NippleJS options passed to `nipplejs.create` |
| `style`          | `CSSStyleDeclaration`  | Inline styles for the container              |
| `onStart`        | `(event) => void`      | Called when the joystick is pressed          |
| `onEnd`          | `(event) => void`      | Called when the joystick is released         |
| `onMove`         | `(event) => void`      | Called while the joystick is being moved     |
| `onDir`          | `(event) => void`      | Called when direction changes                |

## Manager Options

Common `managerOptions` properties:

| Option      | Type                              | Description                               |
| ----------- | --------------------------------- | ----------------------------------------- |
| `mode`      | `'static' \| 'semi' \| 'dynamic'` | Joystick behavior mode                    |
| `position`  | `{ left: string, top: string }`   | Position for static mode                  |
| `color`     | `string`                          | Joystick color                            |
| `size`      | `number`                          | Joystick size in pixels                   |
| `threshold` | `number`                          | Minimum distance before triggering events |
| `fadeTime`  | `number`                          | Fade animation duration                   |

Event callback props receive a single object that contains at least a `data` field with the joystick payload.

See the [NippleJS documentation](https://yoannmoi.net/nipplejs/) for all available options and event payload details.
