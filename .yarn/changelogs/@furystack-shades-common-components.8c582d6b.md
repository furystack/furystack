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

### Icon metadata for descriptions, categories, and search keywords

Extended the `IconDefinition` type with optional `name`, `description`, `keywords`, and `category` fields. All existing icons now include this metadata, enabling icon galleries to automatically group icons by category and support keyword-based search.

### 41 new icons

Added 41 new icon definitions covering areas such as communication (`envelope`, `messageCircle`), media (`music`, `film`, `image`, `images`), data visualization (`barChart`), development (`code`, `gamepad`, `puzzle`), and navigation (`arrowLeft`, `arrowRight`, `compass`). The icon set grew from 69 to 110 icons.
