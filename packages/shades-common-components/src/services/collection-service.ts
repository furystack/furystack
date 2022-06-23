import { PartialResult, FindOptions } from '@furystack/core'
import Semaphore from 'semaphore-async-await'
import { Disposable, debounce, ObservableValue } from '@furystack/utils'

export interface CollectionData<T> {
  entries: T[]
  count: number
}

export type EntryLoader<T> = <TFields extends Array<keyof T>>(
  searchOptions: FindOptions<T, TFields>,
) => Promise<CollectionData<PartialResult<T, TFields>>>

export class CollectionService<T> implements Disposable {
  public dispose() {
    this.querySettings.dispose()
    this.data.dispose()
    this.error.dispose()
    this.isLoading.dispose()
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
      case 'Enter': {
        // this.activate(focusedEntry)
        break
      }
      case 'Backspace': {
        // this.currentWorkDir.goUp()
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
        if (ev.key.length === 1 && new RegExp(/[a-zA-z0-9]/).test(ev.key)) {
          const newSearchExpression = searchTerm + ev.key
          // TODO: implement search
          // const newFocusedEntry = entries.find((e) => e.name.startsWith(newSearchExpression))
          // this.focus.setValue(newFocusedEntry)
          this.searchTerm.setValue(newSearchExpression)
        } else {
          console.log(`Handler for '${ev.key}' not registered`)
        }
    }
  }

  constructor(fetch: EntryLoader<T>, defaultSettings: FindOptions<T, Array<keyof T>>) {
    this.querySettings = new ObservableValue<FindOptions<T, Array<keyof T>>>(defaultSettings)
    this.getEntries = debounce(async (options) => {
      await this.loadLock.acquire()
      try {
        this.error.setValue(undefined)
        this.isLoading.setValue(true)
        const result = await fetch(options)
        this.data.setValue(result)
        return result
      } catch (error) {
        this.error.setValue(error)
        throw error
      } finally {
        this.loadLock.release()
        this.isLoading.setValue(false)
      }
    }, 500)
    this.querySettings.subscribe((val) => this.getEntries(val), true)
  }
}
