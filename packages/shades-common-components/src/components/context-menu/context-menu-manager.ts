import { EventHub, ObservableValue } from '@furystack/utils'

export type ContextMenuItem<T> = {
  type: 'item' | 'separator'
  data?: T
  label?: string
  description?: string
  icon?: JSX.Element
  disabled?: boolean
}

export type ContextMenuPosition = {
  x: number
  y: number
}

/**
 * Manages context menu state including open/close, items, focus, positioning, and keyboard navigation
 */
export class ContextMenuManager<T> extends EventHub<{ onSelectItem: T }> implements Disposable {
  public isOpened = new ObservableValue(false)

  public items = new ObservableValue<Array<ContextMenuItem<T>>>([])

  public focusedIndex = new ObservableValue(-1)

  public position = new ObservableValue<ContextMenuPosition>({ x: 0, y: 0 })

  /**
   * Returns the indices of items that are navigable (non-separator, non-disabled)
   */
  public getNavigableIndices(): number[] {
    return this.items
      .getValue()
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item.type === 'item' && !item.disabled)
      .map(({ index }) => index)
  }

  /**
   * Opens the context menu, optionally setting items and position
   * @param options - Items and/or position to set
   */
  public open(options: { items?: Array<ContextMenuItem<T>>; position?: ContextMenuPosition } = {}) {
    if (options.items) {
      this.items.setValue(options.items)
    }
    if (options.position) {
      this.position.setValue(options.position)
    }
    const navigableIndices = this.getNavigableIndices()
    this.focusedIndex.setValue(navigableIndices.length > 0 ? navigableIndices[0] : -1)
    this.isOpened.setValue(true)
  }

  /**
   * Closes the context menu and resets focus
   */
  public close() {
    this.isOpened.setValue(false)
    this.focusedIndex.setValue(-1)
  }

  /**
   * Selects a menu item by index, emits the selection event, and closes the menu
   * @param index - The index of the item to select (defaults to focused item)
   */
  public selectItem(index?: number) {
    const idx = index ?? this.focusedIndex.getValue()
    const item = this.items.getValue()[idx]
    if (item?.type === 'item' && !item.disabled && item.data !== undefined) {
      this.emit('onSelectItem', item.data)
      this.close()
    }
  }

  /**
   * Handles keyboard events for menu navigation
   * @param ev - The keyboard event
   */
  public handleKeyDown(ev: KeyboardEvent) {
    if (!this.isOpened.getValue()) return

    const navigableIndices = this.getNavigableIndices()

    switch (ev.key) {
      case 'ArrowDown': {
        ev.preventDefault()
        if (navigableIndices.length === 0) break
        const currentNavPosition = navigableIndices.indexOf(this.focusedIndex.getValue())
        if (currentNavPosition < 0 || currentNavPosition >= navigableIndices.length - 1) {
          this.focusedIndex.setValue(navigableIndices[0])
        } else {
          this.focusedIndex.setValue(navigableIndices[currentNavPosition + 1])
        }
        break
      }
      case 'ArrowUp': {
        ev.preventDefault()
        if (navigableIndices.length === 0) break
        const currentNavPosition = navigableIndices.indexOf(this.focusedIndex.getValue())
        if (currentNavPosition <= 0) {
          this.focusedIndex.setValue(navigableIndices[navigableIndices.length - 1])
        } else {
          this.focusedIndex.setValue(navigableIndices[currentNavPosition - 1])
        }
        break
      }
      case 'Home': {
        ev.preventDefault()
        if (navigableIndices.length > 0) {
          this.focusedIndex.setValue(navigableIndices[0])
        }
        break
      }
      case 'End': {
        ev.preventDefault()
        if (navigableIndices.length > 0) {
          this.focusedIndex.setValue(navigableIndices[navigableIndices.length - 1])
        }
        break
      }
      case 'Enter': {
        ev.preventDefault()
        const focusedIdx = this.focusedIndex.getValue()
        if (focusedIdx >= 0) {
          this.selectItem(focusedIdx)
        }
        break
      }
      case 'Escape': {
        ev.preventDefault()
        this.close()
        break
      }
      default:
        break
    }
  }

  public [Symbol.dispose]() {
    this.isOpened[Symbol.dispose]()
    this.items[Symbol.dispose]()
    this.focusedIndex[Symbol.dispose]()
    this.position[Symbol.dispose]()
    super[Symbol.dispose]()
  }
}
