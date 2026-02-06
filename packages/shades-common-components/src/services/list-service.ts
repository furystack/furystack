import { ObservableValue } from '@furystack/utils'

export type ListServiceOptions<T> = {
  /**
   * An optional field that can be used for type-ahead search
   */
  searchField?: keyof T

  /**
   * Optional callback for item activation (Enter key or double-click)
   * @param item The activated item
   */
  onItemActivate?: (item: T) => void
}

/**
 * Service for managing list state including focus, selection, and keyboard navigation
 */
export class ListService<T> implements Disposable {
  public [Symbol.dispose]() {
    this.items[Symbol.dispose]()
    this.selection[Symbol.dispose]()
    this.searchTerm[Symbol.dispose]()
    this.hasFocus[Symbol.dispose]()
    this.focusedItem[Symbol.dispose]()
  }

  public isSelected = (item: T) => this.selection.getValue().includes(item)

  public addToSelection = (item: T) => {
    this.selection.setValue([...this.selection.getValue(), item])
  }

  public removeFromSelection = (item: T) => {
    this.selection.setValue(this.selection.getValue().filter((e) => e !== item))
  }

  public toggleSelection = (item: T) => {
    if (this.isSelected(item)) {
      this.removeFromSelection(item)
    } else {
      this.addToSelection(item)
    }
  }

  public items = new ObservableValue<T[]>([])

  public focusedItem = new ObservableValue<T | undefined>(undefined)

  public selection = new ObservableValue<T[]>([])

  public searchTerm = new ObservableValue('')

  public hasFocus = new ObservableValue(false)

  public handleKeyDown(ev: KeyboardEvent) {
    const items = this.items.getValue()
    const hasFocus = this.hasFocus.getValue()
    const selectedItems = this.selection.getValue()
    const focusedItem = this.focusedItem.getValue()
    const searchTerm = this.searchTerm.getValue()

    if (hasFocus) {
      switch (ev.key) {
        case ' ':
          ev.preventDefault()
          if (focusedItem) {
            this.selection.setValue(
              selectedItems.includes(focusedItem)
                ? selectedItems.filter((e) => e !== focusedItem)
                : [...selectedItems, focusedItem],
            )
          }
          break
        case '*':
          this.selection.setValue(items.filter((e) => !selectedItems.includes(e)))
          break
        case '+':
          this.selection.setValue(items)
          break
        case '-':
          this.selection.setValue([])
          break
        case 'Insert':
          if (focusedItem) {
            if (this.selection.getValue().includes(focusedItem)) {
              this.selection.setValue([...this.selection.getValue().filter((e) => e !== focusedItem)])
            } else {
              this.selection.setValue([...this.selection.getValue(), focusedItem])
            }
            this.focusedItem.setValue(items[items.findIndex((e) => e === this.focusedItem.getValue()) + 1])
          }
          break
        case 'Enter':
          if (focusedItem) {
            this.options.onItemActivate?.(focusedItem)
          }
          break
        case 'ArrowUp':
          ev.preventDefault()
          this.focusedItem.setValue(items[Math.max(0, items.findIndex((e) => e === focusedItem) - 1)])
          break
        case 'ArrowDown':
          ev.preventDefault()
          this.focusedItem.setValue(items[Math.min(items.length - 1, items.findIndex((e) => e === focusedItem) + 1)])
          break
        case 'Home': {
          this.focusedItem.setValue(items[0])
          break
        }
        case 'End': {
          this.focusedItem.setValue(items[items.length - 1])
          break
        }
        case 'Tab': {
          this.hasFocus.setValue(!hasFocus)
          break
        }
        case 'Escape': {
          this.searchTerm.setValue('')
          this.selection.setValue([])
          break
        }
        default:
          if (this.options.searchField && ev.key.length === 1) {
            const newSearchExpression = searchTerm + ev.key
            const newFocusedItem = items.find(
              (e) =>
                this.options.searchField &&
                (e[this.options.searchField] as string)?.toString().startsWith(newSearchExpression),
            )
            this.focusedItem.setValue(newFocusedItem)
            this.searchTerm.setValue(newSearchExpression)
          }
      }
    }
  }

  public handleItemClick(item: T, ev: MouseEvent) {
    const currentSelectionValue = this.selection.getValue()
    const lastFocused = this.focusedItem.getValue()
    if (ev.ctrlKey) {
      if (currentSelectionValue.includes(item)) {
        this.selection.setValue(currentSelectionValue.filter((s) => s !== item))
      } else {
        this.selection.setValue([...currentSelectionValue, item])
      }
    }
    if (ev.shiftKey) {
      const items = this.items.getValue()
      const lastFocusedIndex = items.findIndex((e) => e === lastFocused)
      const itemIndex = items.findIndex((e) => e === item)
      const selection = [...currentSelectionValue]
      if (lastFocusedIndex > itemIndex) {
        for (let i = itemIndex; i <= lastFocusedIndex; i++) {
          selection.push(items[i])
        }
      } else {
        for (let i = lastFocusedIndex; i <= itemIndex; i++) {
          selection.push(items[i])
        }
      }
      this.selection.setValue(selection)
    }
    this.focusedItem.setValue(item)
  }

  public handleItemDoubleClick(item: T) {
    this.options.onItemActivate?.(item)
  }

  constructor(private options: ListServiceOptions<T> = {}) {}
}
