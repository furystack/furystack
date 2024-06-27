import { describe, expect, it, vi } from 'vitest'
import { ClickAwayService } from './click-away-service.js'

describe('ClickAwayService', () => {
  it('Should be constructed and disposed', () => {
    const service = new ClickAwayService(document.createElement('div'), () => {})
    service[Symbol.dispose]()
  })

  it('Should call onClickAway when clicking outside the element', () => {
    const onClickAway = vi.fn()
    const div = document.createElement('div')
    const service = new ClickAwayService(div, onClickAway)

    document.body.appendChild(div)
    document.body.click()

    expect(onClickAway).toBeCalled()

    service[Symbol.dispose]()
  })

  it('Should not call onClickAway when clicking inside the element', () => {
    const onClickAway = vi.fn()
    const div = document.createElement('div')
    const service = new ClickAwayService(div, onClickAway)

    document.body.appendChild(div)
    div.click()

    expect(onClickAway).not.toBeCalled()

    service[Symbol.dispose]()
  })
})
