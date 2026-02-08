/**
 * Type definitions for Menu and Dropdown items
 */

export type MenuItemEntry = {
  type?: 'item'
  key: string
  label: string | JSX.Element
  icon?: JSX.Element
  disabled?: boolean
}

export type MenuGroupEntry = {
  type: 'group'
  key: string
  label: string
  children: MenuEntry[]
}

export type MenuDividerEntry = {
  type: 'divider'
  key?: string
}

export type MenuEntry = MenuItemEntry | MenuGroupEntry | MenuDividerEntry

export type MenuMode = 'vertical' | 'horizontal' | 'inline'

/**
 * Returns a flat list of navigable (non-divider, non-disabled) item keys from the menu entries
 */
export const getNavigableKeys = (items: MenuEntry[]): string[] => {
  const keys: string[] = []
  for (const item of items) {
    if (item.type === 'divider') continue
    if (item.type === 'group') {
      keys.push(...getNavigableKeys(item.children))
    } else {
      if (!item.disabled) keys.push(item.key)
    }
  }
  return keys
}
