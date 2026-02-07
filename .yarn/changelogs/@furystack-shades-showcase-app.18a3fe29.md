<!-- version-type: patch -->

# @furystack/shades-showcase-app

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

### Showcase pages for Component Pack 1

Added interactive demo pages for all 15 new components, organised into the existing navigation categories:

- **Data Display:** Accordion, Badge, Chip, Tooltip
- **Feedback:** Alert, Progress (circular + linear)
- **Surfaces:** Card, Dialog
- **Layout:** Divider
- **Navigation:** Pagination
- **Inputs & Forms:** Checkboxes, Radio, Select, Switch

### Advanced form demo

Extended the Form showcase page with an advanced section demonstrating `Radio`, `RadioGroup`, `Select`, `Checkbox`, and `Switch` components working together with `FormService` validation.

## ♻️ Refactoring

- Reorganised sidebar navigation categories to match the expanded component set (Data Display, Feedback, Surfaces, Layout, Navigation, Inputs & Forms)
- Updated `ShowcaseAppBar` to use `spacing.*` tokens instead of hardcoded pixel values for padding and margins
- Updated `SidebarNavigation` to use `shape.borderRadius.*`, `transitions.*`, `action.*`, and `typography.*` theme tokens instead of hardcoded values

## 🧪 Tests

- Added e2e tests for all new showcase pages: accordion, alert, badge, card, chip, progress, checkboxes, radio, select, switch, divider, pagination, dialog, and tooltip
- Extended form e2e tests covering advanced form inputs and validation
- Updated navigation e2e tests and visual regression snapshots for the new navigation structure
