<!-- version-type: patch -->

# furystack

## 📚 Documentation

- Expanded `AGENTS.md` with repository structure, build/test commands, infrastructure prerequisites, and release workflow guidance.
- Clarified that repo-level files require a version bump for the private root `furystack` workspace.

## 🐛 Bug Fixes

- Fixed the `review-changes` skill to resolve reviewer prompts from the repository root and to support OpenCode's `general` subagents.
- Updated the `reviewer-prettier` agent to use the existing `yarn format:check` and `yarn format` scripts.

## 🔧 Chores

- Moved on-demand agent skills from `.cursor/skills/` to `.agents/skills/` for OpenCode discovery.
