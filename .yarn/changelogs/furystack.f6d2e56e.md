<!-- version-type: patch -->

# furystack

## 📚 Documentation

### Cursor AI Configuration for Code Reviews

Added specialized reviewer agents that can be invoked during code reviews to validate different aspects of changes:

- `reviewer-changelog` - Validates changelog entries have high-quality, descriptive content
- `reviewer-dependencies` - Checks dependency updates for security and compatibility concerns
- `reviewer-eslint` - Runs ESLint checks to catch linting violations automatically
- `reviewer-prettier` - Validates code formatting matches project standards
- `reviewer-tests` - Assesses test coverage and validates tests pass
- `reviewer-typescript` - Runs TypeScript type checking for type safety
- `reviewer-versioning` - Validates version bumps follow semantic versioning rules

### Cursor AI Skills for Development Workflow

Added skills to automate common development tasks:

- `fill-changelog` - Automates filling changelog entries based on branch changes
- `review-changes` - Orchestrates code review using the specialized reviewer agents

### Versioning and Changelog Guidelines

Added detailed documentation for the project's versioning and changelog workflow, including:

- Semantic versioning rules and when to use patch/minor/major bumps
- Changelog entry format with section mapping and quality guidelines
- Step-by-step instructions for the version bump and changelog process
