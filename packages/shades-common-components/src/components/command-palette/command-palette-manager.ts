import type { Injector } from '@furystack/inject'
import { Injectable } from '@furystack/inject'
import { debounce, ObservableValue } from '@furystack/utils'
import type { CommandPaletteSuggestionResult, CommandProvider } from './command-provider.js'

@Injectable({ lifetime: 'singleton' })
export class CommandPaletteManager {
  public isOpened = new ObservableValue(false)
  public isLoading = new ObservableValue(false)
  public term = new ObservableValue('')
  public selectedIndex = new ObservableValue(0)
  public currentSuggestions = new ObservableValue<CommandPaletteSuggestionResult[]>([])

  public keyPressListener = ((ev: KeyboardEvent) => {
    if (ev.key && ev.key.toLowerCase() === 'p' && ev.ctrlKey) {
      this.isOpened.setValue(true)
      this.currentSuggestions.setValue([])
    }
    if (ev.key === 'Escape') {
      this.isOpened.setValue(false)
    }
  }).bind(this)

  public [Symbol.dispose]() {
    window.removeEventListener('keyup', this.keyPressListener)
    this.isOpened[Symbol.dispose]()
    this.isLoading[Symbol.dispose]()
    this.term[Symbol.dispose]()
    this.selectedIndex[Symbol.dispose]()
    this.currentSuggestions[Symbol.dispose]()
  }

  public selectSuggestion(injector: Injector, index: number = this.selectedIndex.getValue()) {
    const selectedSuggestion = this.currentSuggestions.getValue()[index]
    this.isOpened.setValue(false)
    selectedSuggestion.onSelected({ injector })
  }

  private lastGetSuggestionOptions?: { injector: Injector; term: string }
  public getSuggestion = debounce(async (options: { injector: Injector; term: string }) => {
    try {
      if (this.lastGetSuggestionOptions?.term === options.term) {
        return
      }
      this.isLoading.setValue(true)
      this.lastGetSuggestionOptions = options
      this.currentSuggestions.setValue([])
      this.selectedIndex.setValue(0)
      await Promise.all(
        this.commandProviders.map(async (cp) => {
          const value = await cp(options)
          if (this.lastGetSuggestionOptions === options) {
            this.currentSuggestions.setValue([...this.currentSuggestions.getValue(), ...value].sortBy('score'))
          }
        }),
      )
    } finally {
      this.isLoading.setValue(false)
    }
  }, 250)

  constructor(private readonly commandProviders: CommandProvider[]) {
    window.addEventListener('keyup', this.keyPressListener, true)
  }
}
