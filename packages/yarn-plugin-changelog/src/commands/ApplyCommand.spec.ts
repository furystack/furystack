import type { PortablePath } from '@yarnpkg/fslib'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock @yarnpkg/fslib before importing the command
vi.mock('@yarnpkg/fslib', () => ({
  ppath: {
    join: (...parts: string[]) => parts.join('/') as PortablePath,
  },
  xfs: {
    existsPromise: vi.fn(),
    readdirPromise: vi.fn(),
    readFilePromise: vi.fn(),
    writeFilePromise: vi.fn(),
    unlinkPromise: vi.fn(),
  },
}))

// Mock @yarnpkg/core
vi.mock('@yarnpkg/core', () => ({
  Configuration: {
    find: vi.fn(),
  },
  Project: {
    find: vi.fn(),
  },
}))

import { Configuration, Project } from '@yarnpkg/core'
import { xfs } from '@yarnpkg/fslib'

import { ApplyCommand } from './ApplyCommand.js'

type MockWorkspace = {
  cwd: PortablePath
  manifest: { raw: { name: string }; version: string }
}

type MockContext = {
  cwd: PortablePath
  plugins: Set<unknown>
  stdout: { write: ReturnType<typeof vi.fn> }
  stderr: { write: ReturnType<typeof vi.fn> }
}

const createMockContext = (): MockContext => ({
  cwd: '/test/project' as PortablePath,
  plugins: new Set(),
  stdout: { write: vi.fn() },
  stderr: { write: vi.fn() },
})

type ApplyCommandOptions = {
  verbose?: boolean
  dryRun?: boolean
}

const createCommand = (context: MockContext, options: ApplyCommandOptions = {}): ApplyCommand => {
  const command = new ApplyCommand()
  command.context = context as never
  command.verbose = options.verbose ?? false
  command.dryRun = options.dryRun ?? false
  return command
}

const createMockWorkspace = (name: string, version: string): MockWorkspace => ({
  cwd: `/test/project/packages/${name.replace(/^@[^/]+\//, '')}` as PortablePath,
  manifest: { raw: { name }, version },
})

describe('ApplyCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock setup with empty workspaces
    vi.mocked(Configuration.find).mockResolvedValue({} as never)
    vi.mocked(Project.find).mockResolvedValue({
      project: {
        cwd: '/test/project' as PortablePath,
        workspaces: [],
      },
    } as never)
    vi.mocked(xfs.writeFilePromise).mockResolvedValue(undefined)
    vi.mocked(xfs.unlinkPromise).mockResolvedValue(undefined)
  })

  describe('execute', () => {
    it('should return 0 when changelogs directory does not exist', async () => {
      const context = createMockContext()
      const command = createCommand(context)

      vi.mocked(xfs.existsPromise).mockResolvedValue(false)

      const result = await command.execute()

      expect(result).toBe(0)
      expect(context.stdout.write).toHaveBeenCalledWith('No .yarn/changelogs directory found. Nothing to apply.\n')
    })

    it('should return 0 when no md files found in changelogs directory', async () => {
      const context = createMockContext()
      const command = createCommand(context)

      vi.mocked(xfs.existsPromise).mockResolvedValue(true)
      vi.mocked(xfs.readdirPromise).mockResolvedValue(['readme.txt', 'notes.yml'] as PortablePath[])

      const result = await command.execute()

      expect(result).toBe(0)
      expect(context.stdout.write).toHaveBeenCalledWith('No changelog drafts found. Nothing to apply.\n')
    })

    it('should skip invalid drafts and return 1 with errors', async () => {
      const context = createMockContext()
      const command = createCommand(context)

      // A draft without proper package name
      const invalidDraft = `<!-- version-type: patch -->
# 

## 🐛 Bug Fixes

- Fixed a bug
`

      vi.mocked(xfs.existsPromise).mockResolvedValue(true)
      vi.mocked(xfs.readdirPromise).mockResolvedValue(['invalid.md'] as PortablePath[])
      vi.mocked(xfs.readFilePromise).mockResolvedValue(invalidDraft)

      const result = await command.execute()

      expect(result).toBe(1)
      expect(context.stderr.write).toHaveBeenCalledWith('Validation errors found:\n')
      expect(context.stderr.write).toHaveBeenCalledWith(
        expect.stringContaining('Invalid drafts were skipped and not deleted.'),
      )
    })

    it('should apply single draft to CHANGELOG.md successfully', async () => {
      const context = createMockContext()
      const command = createCommand(context)

      const changelogDraft = `<!-- version-type: patch -->
# @furystack/core

## 🐛 Bug Fixes

- Fixed a bug
`

      vi.mocked(Project.find).mockResolvedValue({
        project: {
          cwd: '/test/project' as PortablePath,
          workspaces: [createMockWorkspace('@furystack/core', '1.0.0')],
        },
      } as never)
      vi.mocked(xfs.existsPromise).mockResolvedValue(true)
      vi.mocked(xfs.readdirPromise).mockResolvedValue(['@furystack-core.abc123.md'] as PortablePath[])
      vi.mocked(xfs.readFilePromise).mockImplementation(async (path) => {
        if (String(path).includes('.md') && String(path).includes('changelogs')) {
          return changelogDraft
        }
        // Return empty existing changelog
        return '# Changelog\n\n'
      })

      const result = await command.execute()

      expect(result).toBe(0)
      expect(xfs.writeFilePromise).toHaveBeenCalled()
      expect(xfs.unlinkPromise).toHaveBeenCalled()
      expect(context.stdout.write).toHaveBeenCalledWith('Applying 1 entry(ies) to @furystack/core\n')
    })

    it('should merge multiple drafts for the same package', async () => {
      const context = createMockContext()
      const command = createCommand(context)

      const draft1 = `<!-- version-type: patch -->
# @furystack/core

## 🐛 Bug Fixes

- Fixed bug 1
`
      const draft2 = `<!-- version-type: patch -->
# @furystack/core

## 🐛 Bug Fixes

- Fixed bug 2
`

      vi.mocked(Project.find).mockResolvedValue({
        project: {
          cwd: '/test/project' as PortablePath,
          workspaces: [createMockWorkspace('@furystack/core', '1.0.0')],
        },
      } as never)
      vi.mocked(xfs.existsPromise).mockResolvedValue(true)
      vi.mocked(xfs.readdirPromise).mockResolvedValue([
        '@furystack-core.abc123.md',
        '@furystack-core.def456.md',
      ] as PortablePath[])
      vi.mocked(xfs.readFilePromise).mockImplementation(async (path) => {
        if (String(path).includes('abc123')) return draft1
        if (String(path).includes('def456')) return draft2
        return '# Changelog\n\n'
      })

      const result = await command.execute()

      expect(result).toBe(0)
      expect(xfs.unlinkPromise).toHaveBeenCalledTimes(2)
      expect(context.stdout.write).toHaveBeenCalledWith('Applying 2 entry(ies) to @furystack/core\n')
    })

    it('should use dry-run mode without writing or deleting files', async () => {
      const context = createMockContext()
      const command = createCommand(context, { dryRun: true })

      const changelogDraft = `<!-- version-type: patch -->
# @furystack/core

## 🐛 Bug Fixes

- Fixed a bug
`

      vi.mocked(Project.find).mockResolvedValue({
        project: {
          cwd: '/test/project' as PortablePath,
          workspaces: [createMockWorkspace('@furystack/core', '1.0.0')],
        },
      } as never)
      vi.mocked(xfs.existsPromise).mockResolvedValue(true)
      vi.mocked(xfs.readdirPromise).mockResolvedValue(['@furystack-core.abc123.md'] as PortablePath[])
      vi.mocked(xfs.readFilePromise).mockImplementation(async (path) => {
        if (String(path).includes('changelogs')) return changelogDraft
        return '# Changelog\n\n'
      })

      const result = await command.execute()

      expect(result).toBe(0)
      expect(context.stdout.write).toHaveBeenCalledWith('[DRY RUN] No changes will be made.\n\n')
      expect(xfs.writeFilePromise).not.toHaveBeenCalled()
      expect(xfs.unlinkPromise).not.toHaveBeenCalled()
      expect(context.stdout.write).toHaveBeenCalledWith(expect.stringContaining('Would apply'))
    })

    it('should show verbose output in dry-run mode', async () => {
      const context = createMockContext()
      const command = createCommand(context, { dryRun: true, verbose: true })

      const changelogDraft = `<!-- version-type: patch -->
# @furystack/core

## 🐛 Bug Fixes

- Fixed a bug
`

      vi.mocked(Project.find).mockResolvedValue({
        project: {
          cwd: '/test/project' as PortablePath,
          workspaces: [createMockWorkspace('@furystack/core', '1.0.0')],
        },
      } as never)
      vi.mocked(xfs.existsPromise).mockResolvedValue(true)
      vi.mocked(xfs.readdirPromise).mockResolvedValue(['@furystack-core.abc123.md'] as PortablePath[])
      vi.mocked(xfs.readFilePromise).mockImplementation(async (path) => {
        if (String(path).includes('changelogs')) return changelogDraft
        return '# Changelog\n\n'
      })

      const result = await command.execute()

      expect(result).toBe(0)
      expect(context.stdout.write).toHaveBeenCalledWith(expect.stringContaining('Would write to:'))
      expect(context.stdout.write).toHaveBeenCalledWith(expect.stringContaining('Would delete:'))
    })

    it('should show verbose output when deleting draft files', async () => {
      const context = createMockContext()
      const command = createCommand(context, { verbose: true })

      const changelogDraft = `<!-- version-type: patch -->
# @furystack/core

## 🐛 Bug Fixes

- Fixed a bug
`

      vi.mocked(Project.find).mockResolvedValue({
        project: {
          cwd: '/test/project' as PortablePath,
          workspaces: [createMockWorkspace('@furystack/core', '1.0.0')],
        },
      } as never)
      vi.mocked(xfs.existsPromise).mockResolvedValue(true)
      vi.mocked(xfs.readdirPromise).mockResolvedValue(['@furystack-core.abc123.md'] as PortablePath[])
      vi.mocked(xfs.readFilePromise).mockImplementation(async (path) => {
        if (String(path).includes('changelogs')) return changelogDraft
        return '# Changelog\n\n'
      })

      const result = await command.execute()

      expect(result).toBe(0)
      expect(context.stdout.write).toHaveBeenCalledWith(expect.stringContaining('Deleted:'))
    })

    it('should fallback to derived path when workspace not found', async () => {
      const context = createMockContext()
      const command = createCommand(context)

      const changelogDraft = `<!-- version-type: patch -->
# @furystack/new-package

## 🐛 Bug Fixes

- Fixed a bug
`
      const pkgJson = JSON.stringify({ version: '2.0.0' })

      vi.mocked(Project.find).mockResolvedValue({
        project: {
          cwd: '/test/project' as PortablePath,
          workspaces: [], // No workspaces found
        },
      } as never)
      vi.mocked(xfs.existsPromise).mockResolvedValue(true)
      vi.mocked(xfs.readdirPromise).mockResolvedValue(['@furystack-new-package.abc123.md'] as PortablePath[])
      vi.mocked(xfs.readFilePromise).mockImplementation(async (path) => {
        if (String(path).includes('changelogs')) return changelogDraft
        if (String(path).includes('package.json')) return pkgJson
        return '# Changelog\n\n'
      })

      const result = await command.execute()

      expect(result).toBe(0)
      expect(xfs.writeFilePromise).toHaveBeenCalledWith(
        expect.stringContaining('new-package/CHANGELOG.md'),
        expect.any(String),
      )
    })

    it('should throw error when package directory not found', async () => {
      const context = createMockContext()
      const command = createCommand(context)

      const changelogDraft = `<!-- version-type: patch -->
# @furystack/missing-package

## 🐛 Bug Fixes

- Fixed a bug
`

      vi.mocked(Project.find).mockResolvedValue({
        project: {
          cwd: '/test/project' as PortablePath,
          workspaces: [],
        },
      } as never)
      vi.mocked(xfs.existsPromise).mockImplementation(async (path) => {
        if (String(path).includes('changelogs')) return true
        return false // Package directory doesn't exist
      })
      vi.mocked(xfs.readdirPromise).mockResolvedValue(['@furystack-missing-package.abc123.md'] as PortablePath[])
      vi.mocked(xfs.readFilePromise).mockResolvedValue(changelogDraft)

      await expect(command.execute()).rejects.toThrow('Package directory not found')
    })

    it('should preserve existing changelog header when applying', async () => {
      const context = createMockContext()
      const command = createCommand(context)

      const changelogDraft = `<!-- version-type: patch -->
# @furystack/core

## 🐛 Bug Fixes

- Fixed a bug
`
      const existingChangelog = `# Changelog

## [1.0.0] - 2024-01-01

- Initial release
`

      vi.mocked(Project.find).mockResolvedValue({
        project: {
          cwd: '/test/project' as PortablePath,
          workspaces: [createMockWorkspace('@furystack/core', '1.0.1')],
        },
      } as never)
      vi.mocked(xfs.existsPromise).mockResolvedValue(true)
      vi.mocked(xfs.readdirPromise).mockResolvedValue(['@furystack-core.abc123.md'] as PortablePath[])
      vi.mocked(xfs.readFilePromise).mockImplementation(async (path) => {
        if (String(path).includes('changelogs')) return changelogDraft
        return existingChangelog
      })

      const result = await command.execute()

      expect(result).toBe(0)
      expect(xfs.writeFilePromise).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('# Changelog'),
      )
      // Verify existing content is preserved
      expect(xfs.writeFilePromise).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('Initial release'),
      )
    })

    it('should create changelog file when none exists', async () => {
      const context = createMockContext()
      const command = createCommand(context)

      const changelogDraft = `<!-- version-type: patch -->
# @furystack/core

## 🐛 Bug Fixes

- Fixed a bug
`

      vi.mocked(Project.find).mockResolvedValue({
        project: {
          cwd: '/test/project' as PortablePath,
          workspaces: [createMockWorkspace('@furystack/core', '1.0.0')],
        },
      } as never)
      vi.mocked(xfs.existsPromise).mockImplementation(async (path) => {
        if (String(path).includes('changelogs')) return true
        if (String(path).includes('packages/core')) return true
        if (String(path).includes('CHANGELOG.md')) return false // No existing changelog
        return true
      })
      vi.mocked(xfs.readdirPromise).mockResolvedValue(['@furystack-core.abc123.md'] as PortablePath[])
      vi.mocked(xfs.readFilePromise).mockResolvedValue(changelogDraft)

      const result = await command.execute()

      expect(result).toBe(0)
      expect(xfs.writeFilePromise).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('# Changelog'),
      )
    })

    it('should use default version when package.json has no version', async () => {
      const context = createMockContext()
      const command = createCommand(context)

      const changelogDraft = `<!-- version-type: patch -->
# @furystack/new-package

## 🐛 Bug Fixes

- Fixed a bug
`
      // Package.json without version
      const pkgJson = JSON.stringify({ name: '@furystack/new-package' })

      vi.mocked(Project.find).mockResolvedValue({
        project: {
          cwd: '/test/project' as PortablePath,
          workspaces: [],
        },
      } as never)
      vi.mocked(xfs.existsPromise).mockResolvedValue(true)
      vi.mocked(xfs.readdirPromise).mockResolvedValue(['@furystack-new-package.abc123.md'] as PortablePath[])
      vi.mocked(xfs.readFilePromise).mockImplementation(async (path) => {
        if (String(path).includes('changelogs')) return changelogDraft
        if (String(path).includes('package.json')) return pkgJson
        return '# Changelog\n\n'
      })

      const result = await command.execute()

      expect(result).toBe(0)
      // Should use 0.0.0 as default version
      expect(xfs.writeFilePromise).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('0.0.0'),
      )
    })

    it('should handle applying to multiple packages', async () => {
      const context = createMockContext()
      const command = createCommand(context)

      const coreDraft = `<!-- version-type: patch -->
# @furystack/core

## 🐛 Bug Fixes

- Fixed core bug
`
      const utilsDraft = `<!-- version-type: minor -->
# @furystack/utils

## ✨ Features

- New utils feature
`

      vi.mocked(Project.find).mockResolvedValue({
        project: {
          cwd: '/test/project' as PortablePath,
          workspaces: [
            createMockWorkspace('@furystack/core', '1.0.0'),
            createMockWorkspace('@furystack/utils', '2.0.0'),
          ],
        },
      } as never)
      vi.mocked(xfs.existsPromise).mockResolvedValue(true)
      vi.mocked(xfs.readdirPromise).mockResolvedValue([
        '@furystack-core.abc123.md',
        '@furystack-utils.def456.md',
      ] as PortablePath[])
      vi.mocked(xfs.readFilePromise).mockImplementation(async (path) => {
        if (String(path).includes('@furystack-core')) return coreDraft
        if (String(path).includes('@furystack-utils')) return utilsDraft
        return '# Changelog\n\n'
      })

      const result = await command.execute()

      expect(result).toBe(0)
      expect(xfs.writeFilePromise).toHaveBeenCalledTimes(2)
      expect(xfs.unlinkPromise).toHaveBeenCalledTimes(2)
      expect(context.stdout.write).toHaveBeenCalledWith(
        expect.stringContaining('2 package(s)'),
      )
    })

    it('should add header if existing changelog does not have one', async () => {
      const context = createMockContext()
      const command = createCommand(context)

      const changelogDraft = `<!-- version-type: patch -->
# @furystack/core

## 🐛 Bug Fixes

- Fixed a bug
`
      // Existing changelog without proper header
      const existingChangelog = `## [1.0.0] - 2024-01-01

- Initial release
`

      vi.mocked(Project.find).mockResolvedValue({
        project: {
          cwd: '/test/project' as PortablePath,
          workspaces: [createMockWorkspace('@furystack/core', '1.0.1')],
        },
      } as never)
      vi.mocked(xfs.existsPromise).mockResolvedValue(true)
      vi.mocked(xfs.readdirPromise).mockResolvedValue(['@furystack-core.abc123.md'] as PortablePath[])
      vi.mocked(xfs.readFilePromise).mockImplementation(async (path) => {
        if (String(path).includes('changelogs')) return changelogDraft
        return existingChangelog
      })

      const result = await command.execute()

      expect(result).toBe(0)
      // Verify header is added
      expect(xfs.writeFilePromise).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringMatching(/^# Changelog/),
      )
    })
  })
})
