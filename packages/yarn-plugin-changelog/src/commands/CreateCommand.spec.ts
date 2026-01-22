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
    mkdirPromise: vi.fn(),
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

import { CreateCommand } from './CreateCommand.js'

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

type CreateCommandOptions = {
  verbose?: boolean
  force?: boolean
  dependabot?: boolean
  message?: string
}

const createCommand = (context: MockContext, options: CreateCommandOptions = {}): CreateCommand => {
  const command = new CreateCommand()
  command.context = context as never
  command.verbose = options.verbose ?? false
  command.force = options.force ?? false
  command.dependabot = options.dependabot ?? false
  command.message = options.message
  return command
}

describe('CreateCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock setup
    vi.mocked(Configuration.find).mockResolvedValue({} as never)
    vi.mocked(Project.find).mockResolvedValue({
      project: { cwd: '/test/project' as PortablePath },
    } as never)
    vi.mocked(xfs.mkdirPromise).mockResolvedValue(undefined as never)
    vi.mocked(xfs.writeFilePromise).mockResolvedValue(undefined)
  })

  describe('execute', () => {
    it('should return 0 when versions directory does not exist', async () => {
      const context = createMockContext()
      const command = createCommand(context)

      vi.mocked(xfs.existsPromise).mockResolvedValue(false)

      const result = await command.execute()

      expect(result).toBe(0)
      expect(context.stdout.write).toHaveBeenCalledWith('No .yarn/versions directory found. Nothing to do.\n')
    })

    it('should return 0 when no yml files found in versions directory', async () => {
      const context = createMockContext()
      const command = createCommand(context)

      vi.mocked(xfs.existsPromise).mockResolvedValue(true)
      vi.mocked(xfs.readdirPromise).mockResolvedValue(['readme.txt', 'notes.md'] as PortablePath[])

      const result = await command.execute()

      expect(result).toBe(0)
      expect(context.stdout.write).toHaveBeenCalledWith('No version manifests found. Nothing to do.\n')
    })

    it('should create new changelog draft when none exists', async () => {
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

      expect(result).toBe(0)
      expect(xfs.writeFilePromise).toHaveBeenCalled()
      expect(context.stdout.write).toHaveBeenCalledWith(expect.stringContaining('Created:'))
      expect(context.stdout.write).toHaveBeenCalledWith(expect.stringContaining('minor'))
    })

    it('should skip existing changelog without --force flag', async () => {
      const context = createMockContext()
      const command = createCommand(context, { verbose: true })

      const manifestContent = `releases:
  "@furystack/core": minor
`
      const existingChangelog = `<!-- version-type: minor -->
# @furystack/core

## ✨ Features

- Existing feature
`

      vi.mocked(xfs.existsPromise).mockResolvedValue(true)
      vi.mocked(xfs.readdirPromise).mockResolvedValue(['abc123.yml'] as PortablePath[])
      vi.mocked(xfs.readFilePromise).mockImplementation(async (path) => {
        if (String(path).includes('.yml')) return manifestContent
        return existingChangelog
      })

      const result = await command.execute()

      expect(result).toBe(0)
      expect(xfs.writeFilePromise).not.toHaveBeenCalled()
      expect(context.stdout.write).toHaveBeenCalledWith(expect.stringContaining('Skipping'))
      expect(context.stdout.write).toHaveBeenCalledWith(expect.stringContaining('already exists'))
    })

    it('should regenerate changelog with --force when version type mismatch', async () => {
      const context = createMockContext()
      const command = createCommand(context, { force: true })

      const manifestContent = `releases:
  "@furystack/core": major
`
      // Changelog says minor but manifest says major
      const existingChangelog = `<!-- version-type: minor -->
# @furystack/core

## ✨ Features

- Existing feature
`

      vi.mocked(xfs.existsPromise).mockResolvedValue(true)
      vi.mocked(xfs.readdirPromise).mockResolvedValue(['abc123.yml'] as PortablePath[])
      vi.mocked(xfs.readFilePromise).mockImplementation(async (path) => {
        if (String(path).includes('.yml')) return manifestContent
        return existingChangelog
      })

      const result = await command.execute()

      expect(result).toBe(0)
      expect(xfs.writeFilePromise).toHaveBeenCalled()
      expect(context.stdout.write).toHaveBeenCalledWith(expect.stringContaining('Regenerated:'))
      expect(context.stdout.write).toHaveBeenCalledWith(expect.stringContaining('minor → major'))
    })

    it('should regenerate changelog with --force when content has errors', async () => {
      const context = createMockContext()
      const command = createCommand(context, { force: true })

      const manifestContent = `releases:
  "@furystack/core": major
`
      // Major changelog with placeholder in Breaking Changes
      const existingChangelog = `<!-- version-type: major -->
# @furystack/core

## 💥 Breaking Changes

<!-- PLACEHOLDER: Describe breaking changes -->

## ✨ Features
`

      vi.mocked(xfs.existsPromise).mockResolvedValue(true)
      vi.mocked(xfs.readdirPromise).mockResolvedValue(['abc123.yml'] as PortablePath[])
      vi.mocked(xfs.readFilePromise).mockImplementation(async (path) => {
        if (String(path).includes('.yml')) return manifestContent
        return existingChangelog
      })

      const result = await command.execute()

      expect(result).toBe(0)
      expect(xfs.writeFilePromise).toHaveBeenCalled()
      expect(context.stdout.write).toHaveBeenCalledWith(expect.stringContaining('Regenerated:'))
    })

    it('should not regenerate valid changelog with --force', async () => {
      const context = createMockContext()
      const command = createCommand(context, { force: true })

      const manifestContent = `releases:
  "@furystack/core": patch
`
      const existingChangelog = `<!-- version-type: patch -->
# @furystack/core

## 🐛 Bug Fixes

- Fixed a bug
`

      vi.mocked(xfs.existsPromise).mockResolvedValue(true)
      vi.mocked(xfs.readdirPromise).mockResolvedValue(['abc123.yml'] as PortablePath[])
      vi.mocked(xfs.readFilePromise).mockImplementation(async (path) => {
        if (String(path).includes('.yml')) return manifestContent
        return existingChangelog
      })

      const result = await command.execute()

      expect(result).toBe(0)
      expect(xfs.writeFilePromise).not.toHaveBeenCalled()
    })

    it('should generate dependabot template when --dependabot flag is set', async () => {
      const context = createMockContext()
      const command = createCommand(context, { dependabot: true })

      const manifestContent = `releases:
  "@furystack/core": patch
`

      vi.mocked(xfs.existsPromise).mockImplementation(async (path) => {
        if (String(path).includes('versions')) return true
        return false
      })
      vi.mocked(xfs.readdirPromise).mockResolvedValue(['abc123.yml'] as PortablePath[])
      vi.mocked(xfs.readFilePromise).mockResolvedValue(manifestContent)

      const result = await command.execute()

      expect(result).toBe(0)
      expect(xfs.writeFilePromise).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('Updated dependencies'),
      )
    })

    it('should include custom message in dependabot template', async () => {
      const context = createMockContext()
      const command = createCommand(context, {
        dependabot: true,
        message: 'Bump lodash from 4.17.20 to 4.17.21',
      })

      const manifestContent = `releases:
  "@furystack/core": patch
`

      vi.mocked(xfs.existsPromise).mockImplementation(async (path) => {
        if (String(path).includes('versions')) return true
        return false
      })
      vi.mocked(xfs.readdirPromise).mockResolvedValue(['abc123.yml'] as PortablePath[])
      vi.mocked(xfs.readFilePromise).mockResolvedValue(manifestContent)

      const result = await command.execute()

      expect(result).toBe(0)
      expect(xfs.writeFilePromise).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('Bump lodash from 4.17.20 to 4.17.21'),
      )
    })

    it('should show verbose output for skipped changelogs with version mismatch', async () => {
      const context = createMockContext()
      const command = createCommand(context, { verbose: true })

      const manifestContent = `releases:
  "@furystack/core": major
`
      // Changelog says minor but manifest says major (no force flag)
      const existingChangelog = `<!-- version-type: minor -->
# @furystack/core

## ✨ Features

- Existing feature
`

      vi.mocked(xfs.existsPromise).mockResolvedValue(true)
      vi.mocked(xfs.readdirPromise).mockResolvedValue(['abc123.yml'] as PortablePath[])
      vi.mocked(xfs.readFilePromise).mockImplementation(async (path) => {
        if (String(path).includes('.yml')) return manifestContent
        return existingChangelog
      })

      const result = await command.execute()

      expect(result).toBe(0)
      expect(context.stdout.write).toHaveBeenCalledWith(
        expect.stringContaining('version mismatch'),
      )
      expect(context.stdout.write).toHaveBeenCalledWith(
        expect.stringContaining('use --force to regenerate'),
      )
    })

    it('should show verbose output when processing manifests', async () => {
      const context = createMockContext()
      const command = createCommand(context, { verbose: true })

      const manifestContent = `releases:
  "@furystack/core": patch
`

      vi.mocked(xfs.existsPromise).mockImplementation(async (path) => {
        if (String(path).includes('versions')) return true
        return false
      })
      vi.mocked(xfs.readdirPromise).mockResolvedValue(['abc123.yml'] as PortablePath[])
      vi.mocked(xfs.readFilePromise).mockResolvedValue(manifestContent)

      const result = await command.execute()

      expect(result).toBe(0)
      expect(context.stdout.write).toHaveBeenCalledWith('Processing manifest: abc123.yml\n')
    })

    it('should handle multiple releases in a manifest', async () => {
      const context = createMockContext()
      const command = createCommand(context)

      const manifestContent = `releases:
  "@furystack/core": patch
  "@furystack/utils": minor
`

      vi.mocked(xfs.existsPromise).mockImplementation(async (path) => {
        if (String(path).includes('versions')) return true
        return false
      })
      vi.mocked(xfs.readdirPromise).mockResolvedValue(['abc123.yml'] as PortablePath[])
      vi.mocked(xfs.readFilePromise).mockResolvedValue(manifestContent)

      const result = await command.execute()

      expect(result).toBe(0)
      expect(xfs.writeFilePromise).toHaveBeenCalledTimes(2)
      expect(context.stdout.write).toHaveBeenCalledWith(expect.stringContaining('Created 2'))
    })

    it('should report summary with created, regenerated, and skipped counts', async () => {
      const context = createMockContext()
      const command = createCommand(context, { force: true })

      const manifestContent = `releases:
  "@furystack/core": patch
  "@furystack/utils": major
`
      // utils has version mismatch, core doesn't exist
      const utilsChangelog = `<!-- version-type: minor -->
# @furystack/utils

## ✨ Features

- Feature
`

      vi.mocked(xfs.existsPromise).mockImplementation(async (path) => {
        if (String(path).includes('versions')) return true
        if (String(path).includes('@furystack-utils')) return true
        return false
      })
      vi.mocked(xfs.readdirPromise).mockResolvedValue(['abc123.yml'] as PortablePath[])
      vi.mocked(xfs.readFilePromise).mockImplementation(async (path) => {
        if (String(path).includes('.yml')) return manifestContent
        return utilsChangelog
      })

      const result = await command.execute()

      expect(result).toBe(0)
      expect(context.stdout.write).toHaveBeenCalledWith(expect.stringContaining('Created 1'))
      expect(context.stdout.write).toHaveBeenCalledWith(expect.stringContaining('regenerated 1'))
    })

    it('should ensure changelogs directory is created', async () => {
      const context = createMockContext()
      const command = createCommand(context)

      vi.mocked(xfs.existsPromise).mockResolvedValue(false)

      await command.execute()

      expect(xfs.mkdirPromise).toHaveBeenCalledWith(
        expect.stringContaining('changelogs'),
        { recursive: true },
      )
    })
  })
})
