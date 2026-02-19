<!-- version-type: patch -->

# @furystack/entity-sync-service

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

## 📚 Documentation

- Expanded JSDoc on `SubscriptionManager.registerModel()` to clarify that only DataSet writes trigger sync notifications, and direct physical store writes are not detected
- Updated README to emphasize that all writes must go through the DataSet for entity sync to work, and to reference `useSystemIdentityContext` for server-side writes without an HTTP session
