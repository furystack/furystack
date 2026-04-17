import { EventHub, ObservableValue, type ListenerErrorPayload } from '@furystack/utils'

export interface CollectionData<T> {
  entries: T[]
  count: number
}

export interface CollectionServiceOptions<T> {
  /**
   * An optional field that can be used for quick search
   */
  searchField?: keyof T

  /**
   * A field used as a stable identity key for entries.
   * When provided, the service automatically reconciles `focusedEntry`
   * and `selection` after `data` changes so that stale object references
   * are swapped for their matching counterparts in the new data array.
   * This keeps keyboard navigation and selection working correctly when
   * the backing data is rebuilt with new object instances.
   */
  idField?: keyof T

  /**
   * @param entry The clicked entry
   * @deprecated Use `subscribe('onRowClick', ...)` instead
   */
  onRowClick?: (entry: T) => void

  /**
   * @param entry The clicked entry
   * @deprecated Use `subscribe('onRowDoubleClick', ...)` instead
   */
  onRowDoubleClick?: (entry: T) => void
}

export class CollectionService<T>
  extends EventHub<{
    onRowClick: T
    onRowDoubleClick: T
    onListenerError: ListenerErrorPayload
  }>
  implements Disposable
{
  private dataSubscription?: Disposable

  public [Symbol.dispose]() {
    this.dataSubscription?.[Symbol.dispose]()
    this.data[Symbol.dispose]()
    this.selection[Symbol.dispose]()
    this.searchTerm[Symbol.dispose]()
    this.hasFocus[Symbol.dispose]()
    this.focusedEntry[Symbol.dispose]()
    super[Symbol.dispose]()
  }

  public isSelected = (entry: T) => this.selection.getValue().includes(entry)

  public addToSelection = (entry: T) => {
    this.selection.setValue([...this.selection.getValue(), entry])
  }

  public removeFromSelection = (entry: T) => {
    this.selection.setValue(this.selection.getValue().filter((e) => e !== entry))
  }

  public toggleSelection = (entry: T) => {
    if (this.isSelected(entry)) {
      this.removeFromSelection(entry)
    } else {
      this.addToSelection(entry)
    }
  }

  public data = new ObservableValue<CollectionData<T>>({ count: 0, entries: [] })

  public focusedEntry = new ObservableValue<T | undefined>(undefined)

  /**
   * Stores the focused entry captured on pointerdown, before the focus event
   * can update focusedEntry. Used as the anchor for SHIFT+click range selection.
   * Call {@link setFocusAnchor} from `onpointerdown` to snapshot the anchor
   * before focus shifts.
   */
  private focusAnchor: T | undefined = undefined

  /** Snapshot the current focused entry as the anchor for SHIFT+click range selection. */
  public setFocusAnchor(): void {
    this.focusAnchor = this.focusedEntry.getValue()
  }

  public selection = new ObservableValue<T[]>([])

  public searchTerm = new ObservableValue('')

  public hasFocus = new ObservableValue(false)

  public handleKeyDown(ev: KeyboardEvent) {
    const { entries } = this.data.getValue()
    const hasFocus = this.hasFocus.getValue()
    const selectedEntries = this.selection.getValue()
    const focusedEntry = this.focusedEntry.getValue()
    const searchTerm = this.searchTerm.getValue()

    if (hasFocus) {
      switch (ev.key) {
        case ' ':
          ev.preventDefault()
          if (focusedEntry) {
            this.selection.setValue(
              selectedEntries.includes(focusedEntry)
                ? selectedEntries.filter((e) => e !== focusedEntry)
                : [...selectedEntries, focusedEntry],
            )
          }
          break
        case '*':
          this.selection.setValue(entries.filter((e) => !selectedEntries.includes(e)))
          break
        case '+':
          this.selection.setValue(entries)
          break
        case '-':
          this.selection.setValue([])
          break
        case 'Insert':
          if (focusedEntry) {
            if (this.selection.getValue().includes(focusedEntry)) {
              this.selection.setValue([...this.selection.getValue().filter((e) => e !== focusedEntry)])
            } else {
              this.selection.setValue([...this.selection.getValue(), focusedEntry])
            }
            this.focusedEntry.setValue(entries[entries.findIndex((e) => e === this.focusedEntry.getValue()) + 1])
          }

          break
        case 'ArrowDown': {
          if (focusedEntry !== undefined) {
            const currentIndex = entries.indexOf(focusedEntry)
            if (currentIndex >= 0 && currentIndex < entries.length - 1) {
              ev.preventDefault()
              this.focusedEntry.setValue(entries[currentIndex + 1])
            }
          }
          break
        }
        case 'ArrowUp': {
          if (focusedEntry !== undefined) {
            const currentIndex = entries.indexOf(focusedEntry)
            if (currentIndex > 0) {
              ev.preventDefault()
              this.focusedEntry.setValue(entries[currentIndex - 1])
            }
          }
          break
        }
        case 'Home': {
          ev.preventDefault()
          this.focusedEntry.setValue(entries[0])
          break
        }
        case 'End': {
          ev.preventDefault()
          this.focusedEntry.setValue(entries[entries.length - 1])
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
            const newFocusedEntry = entries.find(
              (e) =>
                this.options.searchField &&
                (e[this.options.searchField] as string)?.toString().startsWith(newSearchExpression),
            )
            this.focusedEntry.setValue(newFocusedEntry)
            this.searchTerm.setValue(newSearchExpression)
          }
      }
    }
  }

  public handleRowClick(entry: T, ev: MouseEvent) {
    this.emit('onRowClick', entry)
    const currentSelectionValue = this.selection.getValue()
    const lastFocused = this.focusAnchor ?? this.focusedEntry.getValue()
    this.focusAnchor = undefined
    if (ev.ctrlKey) {
      if (currentSelectionValue.includes(entry)) {
        this.selection.setValue(currentSelectionValue.filter((s) => s !== entry))
      } else {
        this.selection.setValue([...currentSelectionValue, entry])
      }
    }
    if (ev.shiftKey) {
      const lastFocusedIndex = this.data.getValue().entries.findIndex((e) => e === lastFocused)
      const entryIndex = this.data.getValue().entries.findIndex((e) => e === entry)
      const selection = [...currentSelectionValue]
      if (lastFocusedIndex > entryIndex) {
        for (let i = entryIndex; i <= lastFocusedIndex; i++) {
          selection.push(this.data.getValue().entries[i])
        }
      } else {
        for (let i = lastFocusedIndex; i <= entryIndex; i++) {
          selection.push(this.data.getValue().entries[i])
        }
      }
      this.selection.setValue(selection)
    }
    this.focusedEntry.setValue(entry)
  }

  private reconcileRefs(entries: T[]): void {
    const { idField } = this.options
    if (!idField) return

    const currentFocused = this.focusedEntry.getValue()
    if (currentFocused) {
      const reconciled = entries.find((e) => e[idField] === currentFocused[idField])
      if (reconciled !== currentFocused) {
        this.focusedEntry.setValue(reconciled)
      }
    }

    const currentSelection = this.selection.getValue()
    if (currentSelection.length > 0) {
      const entryById = new Map(entries.map((e) => [e[idField], e]))
      const reconciled = currentSelection.map((s) => entryById.get(s[idField])).filter((e): e is T => e !== undefined)
      if (reconciled.length !== currentSelection.length || reconciled.some((e, i) => e !== currentSelection[i])) {
        this.selection.setValue(reconciled)
      }
    }
  }

  constructor(private options: CollectionServiceOptions<T> = {}) {
    super()
    if (options.onRowClick) {
      this.addListener('onRowClick', options.onRowClick)
    }
    if (options.onRowDoubleClick) {
      this.addListener('onRowDoubleClick', options.onRowDoubleClick)
    }
    if (options.idField) {
      this.dataSubscription = this.data.subscribe(({ entries }) => {
        this.reconcileRefs(entries)
      })
    }
  }

  public handleRowDoubleClick(entry: T) {
    this.emit('onRowDoubleClick', entry)
  }
}
