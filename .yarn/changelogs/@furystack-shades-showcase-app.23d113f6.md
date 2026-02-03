<!-- version-type: minor -->

# @furystack/shades-showcase-app

## ✨ Features

### Layout Test Pages

Added demonstration pages for the new layout system components:

- **AppBar Only** - Basic layout with permanent AppBar
- **AppBar with Left Drawer** - Layout with collapsible left drawer
- **AppBar with Right Drawer** - Layout with collapsible right drawer
- **AppBar with Both Drawers** - Layout with both left and right drawers
- **Collapsible Drawer** - Demonstrates drawer toggle functionality
- **Auto-Hide AppBar** - AppBar that hides on scroll and shows on hover
- **Responsive Layout** - Layout that adapts to screen size breakpoints

## ♻️ Refactoring

- Migrated showcase app pages to use the new `PageLayout` and `PageContainer` components

## 🧪 Tests

- Added E2E tests for layout components with visual snapshot testing across browsers
- Fixed DataGrid E2E tests for keyboard navigation
