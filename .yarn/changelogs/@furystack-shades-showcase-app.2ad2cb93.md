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

### Monaco Editor Theme Integration

The Monaco editor now derives its color scheme from the active Shades theme instead of falling back to the generic `vs-dark` / `vs` built-in themes.

A new `createMonacoTheme()` utility maps Shades design tokens (background, text, palette, divider, action colors) to Monaco editor chrome colors — including editor background/foreground, line numbers, cursor, selection highlights, find-match markers, widgets, error/warning squiggles, bracket matching, and scrollbar styling.

The theme also updates dynamically when the user switches themes at runtime.
