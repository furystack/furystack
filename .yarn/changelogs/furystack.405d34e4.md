<!-- version-type: patch -->

# furystack

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

## 📦 Build

- Pinned the repository to **Yarn 4.14.1** by checking in `.yarn/releases/yarn-4.14.1.cjs`, updating `.yarnrc.yml` `yarnPath`, and setting the root `packageManager` field so every install uses the same Yarn release.

## ⬆️ Dependencies

- Refreshed root `devDependencies` and `yarn.lock`: `@vitest/coverage-istanbul` ^4.1.4, `eslint` ^10.2.0, `eslint-plugin-jsdoc` ^62.9.0, `jsdom` ^29.0.2, `prettier` ^3.8.3, `typescript` ^6.0.3, `typescript-eslint` ^8.58.2, `vite` ^8.0.8, and `vitest` ^4.1.4.
