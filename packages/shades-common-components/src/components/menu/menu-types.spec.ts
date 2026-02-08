import { describe, expect, it } from 'vitest'
import type { MenuEntry } from './menu-types.js'
import { getNavigableKeys } from './menu-types.js'

describe('getNavigableKeys', () => {
  it('should return keys of non-disabled items', () => {
    const items: MenuEntry[] = [
      { key: 'a', label: 'A' },
      { key: 'b', label: 'B' },
      { key: 'c', label: 'C' },
    ]

    expect(getNavigableKeys(items)).toEqual(['a', 'b', 'c'])
  })

  it('should skip dividers', () => {
    const items: MenuEntry[] = [{ key: 'a', label: 'A' }, { type: 'divider' }, { key: 'b', label: 'B' }]

    expect(getNavigableKeys(items)).toEqual(['a', 'b'])
  })

  it('should skip disabled items', () => {
    const items: MenuEntry[] = [
      { key: 'a', label: 'A' },
      { key: 'b', label: 'B', disabled: true },
      { key: 'c', label: 'C' },
    ]

    expect(getNavigableKeys(items)).toEqual(['a', 'c'])
  })

  it('should flatten group children', () => {
    const items: MenuEntry[] = [
      { key: 'a', label: 'A' },
      {
        type: 'group',
        key: 'group1',
        label: 'Group',
        children: [
          { key: 'b', label: 'B' },
          { key: 'c', label: 'C' },
        ],
      },
      { key: 'd', label: 'D' },
    ]

    expect(getNavigableKeys(items)).toEqual(['a', 'b', 'c', 'd'])
  })

  it('should skip disabled items inside groups', () => {
    const items: MenuEntry[] = [
      {
        type: 'group',
        key: 'group1',
        label: 'Group',
        children: [
          { key: 'a', label: 'A' },
          { key: 'b', label: 'B', disabled: true },
          { key: 'c', label: 'C' },
        ],
      },
    ]

    expect(getNavigableKeys(items)).toEqual(['a', 'c'])
  })

  it('should skip dividers inside groups', () => {
    const items: MenuEntry[] = [
      {
        type: 'group',
        key: 'group1',
        label: 'Group',
        children: [{ key: 'a', label: 'A' }, { type: 'divider' }, { key: 'b', label: 'B' }],
      },
    ]

    expect(getNavigableKeys(items)).toEqual(['a', 'b'])
  })

  it('should return empty array for empty items', () => {
    expect(getNavigableKeys([])).toEqual([])
  })

  it('should return empty array when all items are dividers', () => {
    const items: MenuEntry[] = [{ type: 'divider' }, { type: 'divider' }]

    expect(getNavigableKeys(items)).toEqual([])
  })

  it('should return empty array when all items are disabled', () => {
    const items: MenuEntry[] = [
      { key: 'a', label: 'A', disabled: true },
      { key: 'b', label: 'B', disabled: true },
    ]

    expect(getNavigableKeys(items)).toEqual([])
  })

  it('should handle nested groups', () => {
    const items: MenuEntry[] = [
      {
        type: 'group',
        key: 'outer',
        label: 'Outer',
        children: [
          { key: 'a', label: 'A' },
          {
            type: 'group',
            key: 'inner',
            label: 'Inner',
            children: [
              { key: 'b', label: 'B' },
              { key: 'c', label: 'C' },
            ],
          },
        ],
      },
    ]

    expect(getNavigableKeys(items)).toEqual(['a', 'b', 'c'])
  })
})
