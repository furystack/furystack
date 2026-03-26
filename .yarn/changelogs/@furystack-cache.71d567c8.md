<!-- version-type: patch -->

# @furystack/cache

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

- Exported `CacheSettings` interface, allowing consumers to reference cache configuration types directly

## 🐛 Bug Fixes

- Fixed `reload()` not resetting stale and cache time timers — reloaded entries would never become obsolete or get evicted on schedule

## ♻️ Refactoring

- Extracted timer setup into a dedicated `setupTimers()` method reused by both initial load and reload paths

## 🧪 Tests

- Added tests verifying that stale time and cache time timers are correctly restarted after calling `reload()`
