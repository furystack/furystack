<!-- version-type: major -->

# @furystack/shades-common-components

## 💥 Breaking Changes

### Migrated All Components from `element` to `useHostProps` and `useRef`

All components in this package have been updated to use the new declarative `useHostProps` and `useRef` APIs from `@furystack/shades`, replacing direct imperative DOM manipulation via the removed `element` parameter.

**Impact:** Components no longer accept or use the `element` render option. Any custom components that extended or wrapped these components and relied on `element` access patterns need to be updated.

**Migration:** The component API and behavior remain the same from a consumer perspective — this is a breaking change only due to the peer dependency bump on `@furystack/shades`.

## ♻️ Refactoring

### Components migrated to declarative host manipulation

All components now use `useHostProps` to set data attributes, ARIA attributes, CSS custom properties, and styles on the host element instead of imperatively calling `element.setAttribute()`, `element.style.setProperty()`, etc. This includes:

- **Button** — color custom properties, variant/size/loading data attributes
- **Checkbox** — disabled/indeterminate data attributes, color custom property, replaced `querySelector` with `useRef` for form input registration
- **Input** — focus/validation state, label/helper text attributes
- **InputNumber** — stepper button refs, value formatting
- **Select** — open/disabled state, option list management
- **Slider** — track/thumb positioning via refs and host props
- **Switch** — checked/disabled state attributes
- **TextArea** — focus/validation state
- **Radio / RadioGroup** — checked/disabled state, group management
- **Autocomplete** — dropdown state management
- **Accordion** — expanded state toggling
- **Alert** — severity data attribute and color
- **AppBar / AppBarLink** — layout positioning
- **Avatar** — size and color attributes
- **Badge** — position and color
- **Carousel** — slide positioning and navigation via refs
- **Chip** — variant and deletable state
- **CircularProgress** — progress value and size via host props
- **CommandPalette** — open state and input focus via refs
- **ContextMenu** — position and visibility
- **DataGrid / DataGridRow** — selection state, column sizing
- **Dialog** — open state and focus management via refs
- **Divider** — orientation attribute
- **Dropdown** — open/closed state
- **Fab** — position and color
- **Form** — validation state
- **Icon** — size attribute and SVG rendering
- **Image** — loading/error state
- **LinearProgress** — progress value host props
- **List / ListItem** — selection state
- **Loader** — active state
- **Menu** — open state and positioning
- **Modal** — visibility and backdrop
- **NotyList** — notification state
- **PageContainer / PageLayout** — layout dimensions
- **Pagination** — page state
- **Rating** — value and hover state via refs
- **Skeleton** — animation variant
- **Suggest** — dropdown state and input refs
- **Tabs** — active tab indicator
- **Timeline** — item positioning
- **Tooltip** — visibility and positioning
- **Tree / TreeItem** — expanded/selected state
- **Typography** — variant data attribute

### Services updated

- **ClickAwayService** — updated for compatibility with new rendering model
- **LayoutService** — updated for compatibility with new rendering model

## 🧪 Tests

- Updated tests across components to accommodate the new rendering flow and `flushUpdates()` for async assertions
- Updated visual snapshot baselines for form fieldset tests

## ⬆️ Dependencies

- Peer dependency on `@furystack/shades` bumped to new major version
