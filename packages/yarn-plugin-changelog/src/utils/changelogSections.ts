/**
 * Changelog section names with their emoji prefixes.
 * These follow conventional commit types: https://www.conventionalcommits.org/
 */
export const CHANGELOG_SECTIONS = {
  BREAKING_CHANGES: '💥 Breaking Changes',
  DEPRECATED: '🗑️ Deprecated',
  FEATURES: '✨ Features',
  BUG_FIXES: '🐛 Bug Fixes',
  DOCUMENTATION: '📚 Documentation',
  PERFORMANCE: '⚡ Performance',
  REFACTORING: '♻️ Refactoring',
  TESTS: '🧪 Tests',
  BUILD: '📦 Build',
  CI: '👷 CI',
  DEPENDENCIES: '⬆️ Dependencies',
  CHORES: '🔧 Chores',
} as const
