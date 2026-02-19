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

## 🗑️ Deprecated

<!-- PLACEHOLDER: Describe deprecated features. Double-check if they are annotated with a `@deprecated` jsdoc tag. -->

## ✨ Features

### Markdown Components

A new set of zero-dependency Markdown components for rendering and editing Markdown content.

**`parseMarkdown(source)`** — Converts a Markdown string into a typed AST. Supports headings, paragraphs, ordered/unordered lists, task-list checkboxes, fenced code blocks with language hints, blockquotes, horizontal rules, and inline formatting (bold, italic, inline code, links, images).

**`toggleCheckbox(source, lineIndex)`** — Toggles a checkbox at the given source line index in a raw Markdown string, returning the updated string.

**`MarkdownDisplay`** — Renders a Markdown string as styled HTML using FuryStack Shades components. When `readOnly` is set to `false`, task-list checkboxes become interactive and report changes via an `onChange` callback.

**`MarkdownInput`** — A textarea for editing raw Markdown. Supports pasting images from the clipboard, which are inlined as base64-encoded `![pasted image](data:...)` Markdown images (configurable size limit, defaults to 256 KB).

**`MarkdownEditor`** — A combined editor with an input pane and a live preview pane. Supports three layout modes: `side-by-side`, `tabs` (Edit / Preview), and `above-below`. Checkboxes toggled in the preview pane update the source text.

## 🐛 Bug Fixes

<!-- PLACEHOLDER: Describe the nasty little bugs that has been eradicated (fix:) -->

## 📚 Documentation

<!-- PLACEHOLDER: Describe documentation changes (docs:) -->

## ⚡ Performance

<!-- PLACEHOLDER: Describe performance improvements (perf:) -->

## ♻️ Refactoring

<!-- PLACEHOLDER: Describe code refactoring (refactor:) -->

## 🧪 Tests

- Added unit tests for `parseMarkdown` and `parseInline` covering headings, paragraphs, lists, checkboxes, code blocks, blockquotes, horizontal rules, and inline formatting
- Added unit tests for `toggleCheckbox` verifying checked/unchecked toggling and out-of-bounds handling
- Added unit tests for `MarkdownDisplay` rendering and interactive checkbox toggling
- Added unit tests for `MarkdownEditor` layout switching between side-by-side, tabs, and above-below modes
- Added unit tests for `MarkdownInput` text input and image paste behavior

## 📦 Build

<!-- PLACEHOLDER: Describe build system changes (build:) -->

## 👷 CI

<!-- PLACEHOLDER: Describe CI configuration changes (ci:) -->

## ⬆️ Dependencies

<!-- PLACEHOLDER: Describe dependency updates (deps:) -->

## 🔧 Chores

<!-- PLACEHOLDER: Describe other changes (chore:) -->
