export class ClickAwayService<T extends HTMLElement> {
  public dispose() {
    window.removeEventListener('click', this.clickOutsideListener, true)
  }

  public clickOutsideListener = ((ev: MouseEvent) => {
    if (ev.target && !this.element.contains(ev.target as HTMLElement)) {
      this.onClickAway()
    }
  }).bind(this)

  constructor(
    private readonly element: T,
    private readonly onClickAway: () => void,
  ) {
    window.addEventListener('click', this.clickOutsideListener, true)
  }
}
