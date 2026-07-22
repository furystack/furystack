import { describe, expect, it, vi } from 'vitest'
import { getDependencyDiff } from './dependencyDiff'

vi.mock('fs', () => ({
  default: {
    readFileSync: vi.fn().mockImplementation((filePath: string) => {
      if (typeof filePath === 'string' && filePath.endsWith('package.json')) {
        return JSON.stringify({
          dependencies: {
            react: '18.0.0',
            lodash: '4.0.0',
          },
          devDependencies: {
            typescript: '5.0.0',
          },
        })
      }
      return ''
    }),
    existsSync: vi.fn().mockImplementation((filePath: string) => filePath.endsWith('package.json')),
  },
  readFileSync: vi.fn().mockImplementation((filePath: string) => {
    if (typeof filePath === 'string' && filePath.endsWith('package.json')) {
      return JSON.stringify({
        dependencies: {
          react: '18.0.0',
          lodash: '4.0.0',
        },
        devDependencies: {
          typescript: '5.0.0',
        },
      })
    }
    return ''
  }),
  existsSync: vi.fn().mockImplementation((filePath: string) => filePath.endsWith('package.json')),
}))

describe('getDependencyDiff', () => {
  it('should identify added and updated dependencies', () => {
    const localPkgPath = 'packages/test-pkg/package.json'
    const upstreamContent = JSON.stringify({
      dependencies: {
        react: '17.0.0',
        lodash: '4.0.0',
      },
      devDependencies: {
        typescript: '4.0.0',
      },
    })

    const { added, updated } = getDependencyDiff(localPkgPath, upstreamContent)

    expect(added).toEqual({
      typescript: '5.0.0',
    })
    expect(updated).toEqual({
      react: '18.0.0',
    })
  })

  it('should return empty diff when no changes occur', () => {
    const localPkgPath = 'packages/test-pkg/package.json'
    const upstreamContent = JSON.stringify({
      dependencies: {
        react: '18.0.0',
        lodash: '4.0.0',
      },
      devDependencies: {
        typescript: '5.0.0',
      },
    })

    const { added, updated } = getDependencyDiff(localPkgPath, upstreamContent)

    expect(added).toEqual({})
    expect(updated).toEqual({})
  })

  it('should handle missing dependencies in upstream', () => {
    const localPkgPath = 'packages/test-pkg/package.json'
    const upstreamContent = JSON.stringify({
      dependencies: {},
      devDependencies: {},
    })

    const { added, updated } = getDependencyDiff(localPkgPath, upstreamContent)

    expect(added).toEqual({
      react: '18.0.0',
      lodash: '4.0.0',
      typescript: '5.0.0',
    })
    expect(updated).toEqual({})
  })
})

describe('getDependencyDiff', () => {
  it('should identify added and updated dependencies', () => {
    const localPkgPath = 'packages/test-pkg/package.json'
    const upstreamContent = JSON.stringify({
      dependencies: {
        react: '17.0.0',
        lodash: '4.0.0',
      },
      devDependencies: {
        typescript: '4.0.0',
      },
    })

    const { added, updated } = getDependencyDiff(localPkgPath, upstreamContent)

    expect(added).toEqual({
      typescript: '5.0.0',
    })
    expect(updated).toEqual({
      react: '18.0.0',
    })
  })

  it('should return empty diff when no changes occur', () => {
    const localPkgPath = 'packages/test-pkg/package.json'
    const upstreamContent = JSON.stringify({
      dependencies: {
        react: '18.0.0',
        lodash: '4.0.0',
      },
      devDependencies: {
        typescript: '5.0.0',
      },
    })

    const { added, updated } = getDependencyDiff(localPkgPath, upstreamContent)

    expect(added).toEqual({})
    expect(updated).toEqual({})
  })

  it('should handle missing dependencies in upstream', () => {
    const localPkgPath = 'packages/test-pkg/package.json'
    const upstreamContent = JSON.stringify({
      dependencies: {},
      devDependencies: {},
    })

    const { added, updated } = getDependencyDiff(localPkgPath, upstreamContent)

    expect(added).toEqual({
      react: '18.0.0',
      lodash: '4.0.0',
      typescript: '5.0.0',
    })
    expect(updated).toEqual({})
  })
})
