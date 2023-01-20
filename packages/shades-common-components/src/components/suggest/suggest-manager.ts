import type { Injector } from '@furystack/inject'
import { Injectable } from '@furystack/inject'
import type { Disposable } from '@furystack/utils'
import { debounce, ObservableValue } from '@furystack/utils'
import type { SuggestionResult } from './suggestion-result'

@Injectable({ lifetime: 'singleton' })
export class SuggestManager<T> implements Disposable {
  public isOpened = new ObservableValue(false)
  public isLoading = new ObservableValue(false)
  public term = new ObservableValue('')
  public selectedIndex = new ObservableValue(0)
  public currentSuggestions = new ObservableValue<Array<{ entry: T; suggestion: SuggestionResult }>>([])
  public onSelectSuggestion = new ObservableValue<T>()

  public keyPressListener = ((ev: KeyboardEvent) => {
    if (ev.key === 'Escape') {
      this.isOpened.setValue(false)
    }
  }).bind(this)

  public element?: HTMLElement
  public clickOutsideListener = ((ev: MouseEvent) => {
    if (
      this.element &&
      this.isOpened.getValue() &&
      (ev.target as HTMLElement).closest(this.element.tagName) !== this.element
    ) {
      this.isOpened.setValue(false)
    }
  }).bind(this)

  public dispose() {
    window.removeEventListener('keyup', this.keyPressListener)
    window.removeEventListener('click', this.clickOutsideListener)
    this.isOpened.dispose()
    this.isLoading.dispose()
    this.term.dispose()
    this.selectedIndex.dispose()
    this.currentSuggestions.dispose()
    this.onSelectSuggestion.dispose()
  }

  public selectSuggestion(index: number = this.selectedIndex.getValue()) {
    const selectedSuggestion = this.currentSuggestions.getValue()[index]
    this.isOpened.setValue(false)
    this.onSelectSuggestion.setValue(selectedSuggestion.entry)
  }

  private lastGetSuggestionOptions?: { injector: Injector; term: string }
  public getSuggestion = debounce(async (options: { injector: Injector; term: string }) => {
    try {
      if (this.lastGetSuggestionOptions?.term === options.term) {
        return
      }
      const lastSelectedSuggestion = JSON.stringify(this.currentSuggestions.getValue()[this.selectedIndex.getValue()])
      this.isLoading.setValue(true)
      this.lastGetSuggestionOptions = options
      const newEntries = await this.getEntries(options.term)
      this.isOpened.setValue(true)
      this.currentSuggestions.setValue(newEntries.map((e) => ({ entry: e, suggestion: this.getSuggestionEntry(e) })))
      this.selectedIndex.setValue(
        Math.max(
          0,
          this.currentSuggestions.getValue().findIndex((e) => JSON.stringify(e) === lastSelectedSuggestion),
        ),
      )
    } finally {
      this.isLoading.setValue(false)
    }
  }, 250)

  constructor(
    private readonly getEntries: (term: string) => Promise<T[]>,
    private readonly getSuggestionEntry: (entry: T) => SuggestionResult,
  ) {
    window.addEventListener('keyup', this.keyPressListener, true)
    window.addEventListener('click', this.clickOutsideListener, true)
  }
}
