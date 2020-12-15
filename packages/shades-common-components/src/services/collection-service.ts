import { PartialResult, FindOptions } from '@furystack/core'
import Semaphore from 'semaphore-async-await'
import { Disposable, debounce, ObservableValue } from '@furystack/utils'

export interface CollectionData<T> {
  entries: T[]
  count: number
}

export type EntryLoader<T> = <TFields extends Array<keyof T>>(
  searchOptions: FindOptions<T, TFields>,
) => Promise<CollectionData<PartialResult<T, TFields[number]>>>

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

  public error = new ObservableValue<Error | undefined>(undefined)

  public isLoading = new ObservableValue<boolean>(false)

  public querySettings: ObservableValue<FindOptions<T, Array<keyof T>>>

  public focus = new ObservableValue<T | undefined>()

  public selection = new ObservableValue<T[]>([])

  constructor(fetch: EntryLoader<T>, defaultSettings: FindOptions<T, Array<keyof T>>) {
    this.querySettings = new ObservableValue<FindOptions<T, Array<keyof T>>>(defaultSettings)
    this.getEntries = debounce(async (options) => {
      await this.loadLock.acquire()
      try {
        this.isLoading.setValue(true)
        const result = await fetch(options)
        this.data.setValue(result)
        this.error.setValue(undefined)
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
