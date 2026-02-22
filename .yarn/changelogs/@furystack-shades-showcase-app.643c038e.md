<!-- version-type: minor -->

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

- Replaced the generic `TestClass` grid demo with a thematic `GameItem` model featuring RPG-style items with typed properties (name, type, rarity, level, weight, quest item flag, and discovery date)
- Added typed filter configurations for grid columns: string filter on `name`, enum filters on `type` and `rarity`, number filter on `level`, boolean filter on `isQuestItem`, and date filter on `discoveredAt`
- Added color-coded rarity display in the grid (common through legendary)
