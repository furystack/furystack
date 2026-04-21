<!-- version-type: patch -->

# @furystack/eslint-plugin

## ♻️ Refactoring

- Updated the `prefer-nested-route-link` rule message to suggest `<NestedRouteLink path="...">` in line with the renamed `NestedRouteLink` API in `@furystack/shades`. The rule itself still targets raw `<a href="/...">` anchors inside Shade render functions; only the human-readable suggestion changed.
