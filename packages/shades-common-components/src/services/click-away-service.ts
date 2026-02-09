export class ClickAwayService {
  public [Symbol.dispose]() {
    window.removeEventListener('click', this.clickOutsideListener, true)
  }

  private getElement(): HTMLElement | null {
    if (this.element instanceof HTMLElement) return this.element
    return this.element.current
  }

  public clickOutsideListener = ((ev: MouseEvent) => {
    const el = this.getElement()
    if (ev.target && el && !el.contains(ev.target as HTMLElement)) {
      this.onClickAway()
    }
  }).bind(this)

  constructor(
    private readonly element: HTMLElement | { readonly current: HTMLElement | null },
    private readonly onClickAway: () => void,
  ) {
    window.addEventListener('click', this.clickOutsideListener, true)
  }
}
