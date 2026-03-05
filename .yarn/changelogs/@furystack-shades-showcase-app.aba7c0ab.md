<!-- version-type: patch -->

# @furystack/shades-showcase-app

## ✨ Features

- Added "View Transitions" showcase page under Navigation, demonstrating the View Transition API integration with usage examples, CSS customization, component-level support, and browser compatibility info
- Enabled `viewTransition` on the app's root `NestedRouter` so all page navigations are animated with a cross-fade transition
- Enabled `viewTransition` on all `LazyLoad` instances across routes so loader-to-content swaps are animated
- Added document-level CSS for view transition animation timing (`200ms ease-in-out`) and `prefers-reduced-motion` media query support

## 🔧 Chores

- Fixed Playwright config to use `contextOptions.reducedMotion` instead of the deprecated top-level `reducedMotion` property
