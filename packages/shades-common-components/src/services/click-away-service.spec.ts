import { using } from '@furystack/utils'
import { describe, expect, it, vi } from 'vitest'
import { ClickAwayService } from './click-away-service.js'

describe('ClickAwayService', () => {
  it('Should be constructed and disposed', () => {
    using(new ClickAwayService(document.createElement('div'), () => {}), () => {
      // Constructed and disposed automatically
    })
  })

  it('Should call onClickAway when clicking outside the element', () => {
    const onClickAway = vi.fn()
    const div = document.createElement('div')
    using(new ClickAwayService(div, onClickAway), () => {
      document.body.appendChild(div)
      document.body.click()

      expect(onClickAway).toBeCalled()
    })
  })

  it('Should not call onClickAway when clicking inside the element', () => {
    const onClickAway = vi.fn()
    const div = document.createElement('div')
    using(new ClickAwayService(div, onClickAway), () => {
      document.body.appendChild(div)
      div.click()

      expect(onClickAway).not.toBeCalled()
    })
  })
})
