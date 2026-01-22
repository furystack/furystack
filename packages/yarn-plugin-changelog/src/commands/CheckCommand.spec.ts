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

import { CheckCommand } from './CheckCommand.js'

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

const createCommand = (context: MockContext, options: { verbose?: boolean } = {}): CheckCommand => {
  const command = new CheckCommand()
  command.context = context as never
  command.verbose = options.verbose ?? false
  return command
}

describe('CheckCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock setup
    vi.mocked(Configuration.find).mockResolvedValue({} as never)
    vi.mocked(Project.find).mockResolvedValue({
      project: { cwd: '/test/project' as PortablePath },
    } as never)
  })

  describe('execute', () => {
    it('should return 0 when versions directory does not exist', async () => {
      const context = createMockContext()
      const command = createCommand(context)

      vi.mocked(xfs.existsPromise).mockResolvedValue(false)

      const result = await command.execute()

      expect(result).toBe(0)
      expect(context.stdout.write).toHaveBeenCalledWith('No .yarn/versions directory found. Nothing to check.\n')
    })

    it('should return 0 when no yml files found in versions directory', async () => {
      const context = createMockContext()
      const command = createCommand(context)

      vi.mocked(xfs.existsPromise).mockResolvedValue(true)
      vi.mocked(xfs.readdirPromise).mockResolvedValue(['readme.txt', 'notes.md'] as PortablePath[])

      const result = await command.execute()

      expect(result).toBe(0)
      expect(context.stdout.write).toHaveBeenCalledWith('No version manifests found. Nothing to check.\n')
    })

    it('should return 1 when changelog file is missing for a release', async () => {
      const context = createMockContext()
      const command = createCommand(context)

      const manifestContent = `releases:
  "@furystack/core": minor
`

      vi.mocked(xfs.existsPromise).mockImplementation(async (path) => {
        if (String(path).includes('versions')) return true
        return false // changelog doesn't exist
      })
      vi.mocked(xfs.readdirPromise).mockResolvedValue(['abc123.yml'] as PortablePath[])
      vi.mocked(xfs.readFilePromise).mockResolvedValue(manifestContent)

      const result = await command.execute()

      expect(result).toBe(1)
      expect(context.stderr.write).toHaveBeenCalledWith('\nChangelog validation failed:\n\n')
      expect(context.stderr.write).toHaveBeenCalledWith(
        expect.stringContaining('Missing changelog for @furystack/core'),
      )
    })

    it('should return 1 when changelog validation fails', async () => {
      const context = createMockContext()
      const command = createCommand(context)

      const manifestContent = `releases:
  "@furystack/core": major
`
      // Invalid changelog - major version without breaking changes content
      const changelogContent = `<!-- version-type: major -->
# @furystack/core

## 💥 Breaking Changes

<!-- PLACEHOLDER: Describe breaking changes -->

## ✨ Features

- New feature
`

      vi.mocked(xfs.existsPromise).mockResolvedValue(true)
      vi.mocked(xfs.readdirPromise).mockResolvedValue(['abc123.yml'] as PortablePath[])
      vi.mocked(xfs.readFilePromise).mockImplementation(async (path) => {
        if (String(path).includes('.yml')) return manifestContent
        return changelogContent
      })

      const result = await command.execute()

      expect(result).toBe(1)
      expect(context.stderr.write).toHaveBeenCalledWith('\nChangelog validation failed:\n\n')
    })

    it('should return 0 when all changelogs are valid', async () => {
      const context = createMockContext()
      const command = createCommand(context)

      const manifestContent = `releases:
  "@furystack/core": patch
`
      const changelogContent = `<!-- version-type: patch -->
# @furystack/core

## 🐛 Bug Fixes

- Fixed a bug
`

      vi.mocked(xfs.existsPromise).mockResolvedValue(true)
      vi.mocked(xfs.readdirPromise).mockResolvedValue(['abc123.yml'] as PortablePath[])
      vi.mocked(xfs.readFilePromise).mockImplementation(async (path) => {
        if (String(path).includes('.yml')) return manifestContent
        return changelogContent
      })

      const result = await command.execute()

      expect(result).toBe(0)
      expect(context.stdout.write).toHaveBeenCalledWith('\n✓ All 1 changelog(s) are valid.\n')
    })

    it('should show verbose output when verbose flag is set', async () => {
      const context = createMockContext()
      const command = createCommand(context, { verbose: true })

      const manifestContent = `releases:
  "@furystack/core": patch
`
      const changelogContent = `<!-- version-type: patch -->
# @furystack/core

## 🐛 Bug Fixes

- Fixed a bug
`

      vi.mocked(xfs.existsPromise).mockResolvedValue(true)
      vi.mocked(xfs.readdirPromise).mockResolvedValue(['abc123.yml'] as PortablePath[])
      vi.mocked(xfs.readFilePromise).mockImplementation(async (path) => {
        if (String(path).includes('.yml')) return manifestContent
        return changelogContent
      })

      const result = await command.execute()

      expect(result).toBe(0)
      expect(context.stdout.write).toHaveBeenCalledWith('Checking manifest: abc123.yml\n')
      expect(context.stdout.write).toHaveBeenCalledWith('  ✓ @furystack/core\n')
    })

    it('should handle multiple releases in a manifest', async () => {
      const context = createMockContext()
      const command = createCommand(context)

      const manifestContent = `releases:
  "@furystack/core": patch
  "@furystack/utils": minor
`
      const coreChangelog = `<!-- version-type: patch -->
# @furystack/core

## 🐛 Bug Fixes

- Fixed a bug
`
      const utilsChangelog = `<!-- version-type: minor -->
# @furystack/utils

## ✨ Features

- Added new feature
`

      vi.mocked(xfs.existsPromise).mockResolvedValue(true)
      vi.mocked(xfs.readdirPromise).mockResolvedValue(['abc123.yml'] as PortablePath[])
      vi.mocked(xfs.readFilePromise).mockImplementation(async (path) => {
        if (String(path).includes('.yml')) return manifestContent
        if (String(path).includes('@furystack-core')) return coreChangelog
        if (String(path).includes('@furystack-utils')) return utilsChangelog
        return ''
      })

      const result = await command.execute()

      expect(result).toBe(0)
      expect(context.stdout.write).toHaveBeenCalledWith('\n✓ All 2 changelog(s) are valid.\n')
    })

    it('should report multiple errors when multiple changelogs are invalid', async () => {
      const context = createMockContext()
      const command = createCommand(context)

      const manifestContent = `releases:
  "@furystack/core": patch
  "@furystack/utils": patch
`

      vi.mocked(xfs.existsPromise).mockImplementation(async (path) => {
        if (String(path).includes('versions')) return true
        return false // Both changelogs missing
      })
      vi.mocked(xfs.readdirPromise).mockResolvedValue(['abc123.yml'] as PortablePath[])
      vi.mocked(xfs.readFilePromise).mockResolvedValue(manifestContent)

      const result = await command.execute()

      expect(result).toBe(1)
      expect(context.stderr.write).toHaveBeenCalledWith(expect.stringContaining('Found 2 error(s).'))
    })

    it('should handle multiple manifest files', async () => {
      const context = createMockContext()
      const command = createCommand(context, { verbose: true })

      const manifest1 = `releases:
  "@furystack/core": patch
`
      const manifest2 = `releases:
  "@furystack/utils": patch
`
      const coreChangelog = `<!-- version-type: patch -->
# @furystack/core

## 🐛 Bug Fixes

- Fixed a bug
`
      const utilsChangelog = `<!-- version-type: patch -->
# @furystack/utils

## 🐛 Bug Fixes

- Fixed a utils bug
`

      vi.mocked(xfs.existsPromise).mockResolvedValue(true)
      vi.mocked(xfs.readdirPromise).mockResolvedValue(['abc123.yml', 'def456.yml'] as PortablePath[])
      vi.mocked(xfs.readFilePromise).mockImplementation(async (path) => {
        const pathStr = String(path)
        // Manifest files are in versions directory
        if (pathStr.includes('abc123.yml')) return manifest1
        if (pathStr.includes('def456.yml')) return manifest2
        // Changelog files - the manifest ID is part of filename
        // abc123.yml → @furystack-core.abc123.md
        // def456.yml → @furystack-utils.def456.md
        if (pathStr.includes('.abc123.md')) return coreChangelog
        if (pathStr.includes('.def456.md')) return utilsChangelog
        return ''
      })

      const result = await command.execute()

      expect(result).toBe(0)
      expect(context.stdout.write).toHaveBeenCalledWith('Checking manifest: abc123.yml\n')
      expect(context.stdout.write).toHaveBeenCalledWith('Checking manifest: def456.yml\n')
    })
  })
})
