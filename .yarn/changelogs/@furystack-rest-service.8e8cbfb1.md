<!-- version-type: patch -->

# @furystack/rest-service

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

## 🐛 Bug Fixes

- Prevent path traversal in static file serving by rejecting resolved paths outside the configured root directory
- Set `SameSite`, optional `Secure`, and `Max-Age` attributes on session cookies and apply the same attributes when clearing them
