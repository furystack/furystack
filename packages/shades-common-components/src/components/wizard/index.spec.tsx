import type { ChildrenList } from '@furystack/shades'
import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot, Shade } from '@furystack/shades'
import { sleepAsync, usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { WizardStepProps } from './index.js'
import { Wizard } from './index.js'

const Step1 = Shade<WizardStepProps>({
  shadowDomName: 'wizard-test-step-1',
  render: ({ props }) => (
    <div className="wizard-step" data-step-name="step1">
      <span className="step-info">
        Page {props.currentPage + 1} of {props.maxPages}
      </span>
      <span className="step-name">step1</span>
      <button className="prev-btn" onclick={() => props.onPrev?.()}>
        Previous
      </button>
      <button className="next-btn" onclick={() => props.onNext?.()}>
        Next
      </button>
    </div>
  ),
})

const Step2 = Shade<WizardStepProps>({
  shadowDomName: 'wizard-test-step-2',
  render: ({ props }) => (
    <div className="wizard-step" data-step-name="step2">
      <span className="step-info">
        Page {props.currentPage + 1} of {props.maxPages}
      </span>
      <span className="step-name">step2</span>
      <button className="prev-btn" onclick={() => props.onPrev?.()}>
        Previous
      </button>
      <button className="next-btn" onclick={() => props.onNext?.()}>
        Next
      </button>
    </div>
  ),
})

const Step3 = Shade<WizardStepProps>({
  shadowDomName: 'wizard-test-step-3',
  render: ({ props }) => (
    <div className="wizard-step" data-step-name="step3">
      <span className="step-info">
        Page {props.currentPage + 1} of {props.maxPages}
      </span>
      <span className="step-name">step3</span>
      <button className="prev-btn" onclick={() => props.onPrev?.()}>
        Previous
      </button>
      <button className="next-btn" onclick={() => props.onNext?.()}>
        Next
      </button>
    </div>
  ),
})

describe('Wizard', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  const renderWizard = async (
    steps: Array<(props: WizardStepProps, children: ChildrenList) => JSX.Element>,
    onFinish?: () => void,
  ) => {
    const injector = new Injector()
    const root = document.getElementById('root')!
    initializeShadeRoot({
      injector,
      rootElement: root,
      jsxElement: <Wizard steps={steps} onFinish={onFinish} />,
    })
    await sleepAsync(50)

    const wizard = root.querySelector('shades-wizard') as HTMLElement

    const getStepElement = () => {
      return wizard.querySelector('wizard-test-step-1, wizard-test-step-2, wizard-test-step-3') as HTMLElement
    }

    return {
      injector,
      wizard,
      getStepName: () => getStepElement()?.querySelector('.step-name')?.textContent,
      getStepInfo: () => getStepElement()?.querySelector('.step-info')?.textContent,
      clickNext: async () => {
        const btn = getStepElement()?.querySelector('.next-btn') as HTMLButtonElement
        btn?.click()
        await sleepAsync(50)
      },
      clickPrev: async () => {
        const btn = getStepElement()?.querySelector('.prev-btn') as HTMLButtonElement
        btn?.click()
        await sleepAsync(50)
      },
      [Symbol.asyncDispose]: () => injector[Symbol.asyncDispose](),
    }
  }

  describe('rendering', () => {
    it('should render the wizard container', async () => {
      await usingAsync(await renderWizard([Step1]), async ({ wizard }) => {
        expect(wizard).toBeTruthy()
        expect(wizard.tagName.toLowerCase()).toBe('shades-wizard')
      })
    })

    it('should render the first step initially', async () => {
      await usingAsync(await renderWizard([Step1, Step2]), async ({ getStepName }) => {
        expect(getStepName()).toBe('step1')
      })
    })

    it('should pass correct props to the first step', async () => {
      await usingAsync(await renderWizard([Step1, Step2, Step3]), async ({ getStepInfo }) => {
        expect(getStepInfo()).toBe('Page 1 of 3')
      })
    })
  })

  describe('navigation', () => {
    it('should navigate to next step when onNext is called', async () => {
      await usingAsync(await renderWizard([Step1, Step2]), async ({ getStepName, clickNext }) => {
        expect(getStepName()).toBe('step1')
        await clickNext()
        expect(getStepName()).toBe('step2')
      })
    })

    it('should navigate to previous step when onPrev is called', async () => {
      await usingAsync(await renderWizard([Step1, Step2]), async ({ getStepName, clickNext, clickPrev }) => {
        await clickNext()
        expect(getStepName()).toBe('step2')
        await clickPrev()
        expect(getStepName()).toBe('step1')
      })
    })

    it('should not navigate before first step', async () => {
      await usingAsync(await renderWizard([Step1, Step2]), async ({ getStepName, clickPrev }) => {
        expect(getStepName()).toBe('step1')
        await clickPrev()
        expect(getStepName()).toBe('step1')
      })
    })

    it('should update step info when navigating', async () => {
      await usingAsync(await renderWizard([Step1, Step2]), async ({ getStepInfo, clickNext }) => {
        expect(getStepInfo()).toBe('Page 1 of 2')
        await clickNext()
        expect(getStepInfo()).toBe('Page 2 of 2')
      })
    })

    it('should navigate through multiple steps', async () => {
      await usingAsync(
        await renderWizard([Step1, Step2, Step3]),
        async ({ getStepName, getStepInfo, clickNext, clickPrev }) => {
          expect(getStepName()).toBe('step1')
          expect(getStepInfo()).toBe('Page 1 of 3')

          await clickNext()
          expect(getStepName()).toBe('step2')
          expect(getStepInfo()).toBe('Page 2 of 3')

          await clickNext()
          expect(getStepName()).toBe('step3')
          expect(getStepInfo()).toBe('Page 3 of 3')

          await clickPrev()
          expect(getStepName()).toBe('step2')
          expect(getStepInfo()).toBe('Page 2 of 3')
        },
      )
    })
  })

  describe('onFinish', () => {
    it('should call onFinish when clicking next on the last step', async () => {
      const onFinish = vi.fn()
      await usingAsync(await renderWizard([Step1], onFinish), async ({ clickNext }) => {
        expect(onFinish).not.toHaveBeenCalled()
        await clickNext()
        expect(onFinish).toHaveBeenCalledOnce()
      })
    })

    it('should call onFinish after navigating to the last step', async () => {
      const onFinish = vi.fn()
      await usingAsync(await renderWizard([Step1, Step2], onFinish), async ({ clickNext }) => {
        await clickNext()
        expect(onFinish).not.toHaveBeenCalled()

        await clickNext()
        expect(onFinish).toHaveBeenCalledOnce()
      })
    })

    it('should work without onFinish callback', async () => {
      await usingAsync(await renderWizard([Step1]), async ({ getStepName, clickNext }) => {
        expect(getStepName()).toBe('step1')
        await clickNext()
        expect(getStepName()).toBe('step1')
      })
    })
  })

  describe('Paper container', () => {
    it('should render step inside a Paper component', async () => {
      await usingAsync(await renderWizard([Step1]), async ({ wizard }) => {
        const paper = wizard.querySelector('div[is="shade-paper"]')
        expect(paper).toBeTruthy()
      })
    })

    it('should have elevation 3 on the Paper', async () => {
      await usingAsync(await renderWizard([Step1]), async ({ wizard }) => {
        const paper = wizard.querySelector('div[is="shade-paper"]')
        expect(paper?.getAttribute('data-elevation')).toBe('3')
      })
    })
  })
})
