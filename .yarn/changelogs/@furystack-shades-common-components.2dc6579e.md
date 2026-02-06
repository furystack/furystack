<!-- version-type: minor -->

# @furystack/shades-common-components

<!--
FORMATTING GUIDE:

### Detailed Entry (appears first when merging)

Use h3 (###) and below for detailed entries with paragraphs, code examples, and lists.

### Simple List Items

- Simple changes can be added as list items
- They are collected together at the bottom of each section

TIP: When multiple changelog drafts are merged, heading-based entries
appear before simple list items within each section.
-->

## ✨ Features

### List Component

Added `List` and `ListItem` components for rendering selectable, keyboard-navigable lists with support for single and multi-selection.

- Click to focus, `ArrowUp`/`ArrowDown` to navigate, `Enter` to activate an item
- Multi-selection via `Ctrl+Click` (toggle), `Shift+Click` (range), `Space` (toggle focused), `+` (select all), `-` (deselect all)
- Type-ahead search when `searchField` is configured on `ListService`
- Supports custom `renderItem`, `renderIcon`, and `renderSecondaryActions` render props
- Click-away detection to release focus
- Smooth scroll-into-view when navigating with keyboard

Added `ListService` - a standalone state manager for list focus, selection, and keyboard navigation that can be used independently of the component.

### Tree Component

Added `Tree` and `TreeItem` components for rendering hierarchical data with expand/collapse, indented levels, and keyboard navigation.

- `ArrowRight` expands a collapsed node or moves focus to its first child; `ArrowLeft` collapses an expanded node or moves focus to the parent
- Double-click toggles expand/collapse on parent nodes, activates leaf nodes
- Inherits all selection and navigation behavior from `ListService`
- Renders expand/collapse indicators (`▸`/`▾`) with level-based indentation
- Supports custom `renderItem` and `renderIcon` render props

Added `TreeService` - extends `ListService` with tree-specific state including expand/collapse tracking, flattened visible node list, and parent lookup.

### Context Menu Component

Added `ContextMenu` and `ContextMenuItemComponent` for rendering positioned popup menus with keyboard navigation and item selection.

- Supports both right-click and programmatic trigger via `ContextMenuManager.open()`
- Items can have labels, descriptions, icons, disabled state, and separators
- `ArrowUp`/`ArrowDown` to navigate, `Enter` to select, `Escape` to close, `Home`/`End` to jump
- Clicking the backdrop or right-clicking elsewhere closes the menu
- Disabled items are skipped during keyboard navigation

Added `ContextMenuManager` - manages context menu state including open/close, item list, focus index, positioning, and keyboard navigation. Emits `onSelectItem` events via `EventHub`.

## 🧪 Tests

- Added tests for `ListService` covering selection, focus, keyboard navigation, type-ahead search, click handling, and disposal
- Added tests for `List` and `ListItem` components verifying rendering, keyboard interactions, click behaviors, and selection callbacks
- Added tests for `TreeService` covering expand/collapse, flattened node generation, keyboard navigation (`ArrowRight`/`ArrowLeft`), parent lookup, and disposal
- Added tests for `Tree` and `TreeItem` components verifying hierarchical rendering, expand/collapse interactions, and activation callbacks
- Added tests for `ContextMenuManager` covering open/close, item selection, keyboard navigation, disabled item skipping, and disposal
- Added tests for `ContextMenu` and `ContextMenuItemComponent` verifying rendering, focus highlighting, click handling, and backdrop dismiss
