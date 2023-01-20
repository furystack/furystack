import type { PartialResult, FindOptions } from '@furystack/core'
import Semaphore from 'semaphore-async-await'
import type { Disposable } from '@furystack/utils'
import { debounce, ObservableValue } from '@furystack/utils'

export interface CollectionData<T> {
  entries: T[]
  count: number
}

export type EntryLoader<T> = <TFields extends Array<keyof T>>(
  searchOptions: FindOptions<T, TFields>,
) => Promise<CollectionData<PartialResult<T, TFields>>>

export interface CollectionServiceOptions<T> {
  /**
   * A method used to retrieve the entries from the data source
   */
  loader: EntryLoader<T>
  /**
   * The default filter / top / skip / etc... options
   */
  defaultSettings: FindOptions<T, Array<keyof T>>
  /**
   * An optional field that can be used for quick search
   */
  searchField?: keyof T

  /**
   * @param entry The clicked entry
   * optional callback for row clicks
   */
  onRowClick?: (entry: T) => void

  /**
   * Optional callback for row double clicks
   *
   * @param entry The clicked entry
   */

  onRowDoubleClick?: (entry: T) => void

  /**
   * An optional debounce interval in milliseconds
   */
  debounceMs?: number
}

export class CollectionService<T> implements Disposable {
  public dispose() {
    this.querySettings.dispose()
    this.data.dispose()
    this.error.dispose()
    this.isLoading.dispose()
  }

  public isSelected = (entry: T) => this.selection.getValue().includes(entry)

  public addToSelection = (entry: T) => {
    this.selection.setValue([...this.selection.getValue(), entry])
  }

  public removeFromSelection = (entry: T) => {
    this.selection.setValue(this.selection.getValue().filter((e) => e !== entry))
  }

  public toggleSelection = (entry: T) => {
    this.isSelected(entry) ? this.removeFromSelection(entry) : this.addToSelection(entry)
  }

  private readonly loadLock = new Semaphore(1)

  public getEntries: EntryLoader<T>

  public data = new ObservableValue<CollectionData<T>>({ count: 0, entries: [] })

  public error = new ObservableValue<unknown | undefined>(undefined)

  public isLoading = new ObservableValue<boolean>(false)

  public querySettings: ObservableValue<FindOptions<T, Array<keyof T>>>

  public focusedEntry = new ObservableValue<T | undefined>()

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
          focusedEntry &&
            this.selection.setValue(
              selectedEntries.includes(focusedEntry)
                ? selectedEntries.filter((e) => e !== focusedEntry)
                : [...selectedEntries, focusedEntry],
            )
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
          focusedEntry &&
            (this.selection.getValue().includes(focusedEntry)
              ? this.selection.setValue([...this.selection.getValue().filter((e) => e !== focusedEntry)])
              : this.selection.setValue([...this.selection.getValue(), focusedEntry]))
          this.focusedEntry.setValue(entries[entries.findIndex((e) => e === this.focusedEntry.getValue()) + 1])

          break
        case 'ArrowUp':
          ev.preventDefault()
          this.focusedEntry.setValue(entries[Math.max(0, entries.findIndex((e) => e === focusedEntry) - 1)])
          break
        case 'ArrowDown':
          ev.preventDefault()
          this.focusedEntry.setValue(
            entries[Math.min(entries.length - 1, entries.findIndex((e) => e === focusedEntry) + 1)],
          )
          break
        case 'Home': {
          this.focusedEntry.setValue(entries[0])
          break
        }
        case 'End': {
          this.focusedEntry.setValue(entries[entries.length - 1])
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
            const newFocusedEntry = entries.find(
              (e) =>
                this.options.searchField &&
                (e[this.options.searchField] as any)?.toString().startsWith(newSearchExpression),
            )
            this.focusedEntry.setValue(newFocusedEntry)
            this.searchTerm.setValue(newSearchExpression)
          }
      }
    }
  }

  public handleRowClick(entry: T, ev: MouseEvent) {
    this.options.onRowClick?.(entry)
    const currentSelectionValue = this.selection.getValue()
    const lastFocused = this.focusedEntry.getValue()
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

  constructor(private options: CollectionServiceOptions<T>) {
    this.querySettings = new ObservableValue<FindOptions<T, Array<keyof T>>>(this.options.defaultSettings)

    const loader = this.options.debounceMs
      ? debounce(this.options.loader, this.options.debounceMs)
      : this.options.loader

    this.getEntries = async (opt) => {
      await this.loadLock.acquire()
      try {
        this.error.setValue(undefined)
        this.isLoading.setValue(true)
        const result = await loader(opt)
        this.data.setValue(result)
        return result
      } catch (error) {
        this.error.setValue(error)
        throw error
      } finally {
        this.loadLock.release()
        this.isLoading.setValue(false)
      }
    }

    this.querySettings.subscribe((val) => this.getEntries(val), true)
  }

  public async handleRowDoubleClick(entry: T) {
    this.options.onRowDoubleClick?.(entry)
  }
}
