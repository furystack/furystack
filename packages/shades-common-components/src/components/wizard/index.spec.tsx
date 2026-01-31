import type { ChildrenList } from '@furystack/shades'
import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot, Shade } from '@furystack/shades'
import { sleepAsync } from '@furystack/utils'
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
    }
  }

  describe('rendering', () => {
    it('should render the wizard container', async () => {
      const { wizard } = await renderWizard([Step1])
      expect(wizard).toBeTruthy()
      expect(wizard.tagName.toLowerCase()).toBe('shades-wizard')
    })

    it('should render the first step initially', async () => {
      const { getStepName } = await renderWizard([Step1, Step2])
      expect(getStepName()).toBe('step1')
    })

    it('should pass correct props to the first step', async () => {
      const { getStepInfo } = await renderWizard([Step1, Step2, Step3])
      expect(getStepInfo()).toBe('Page 1 of 3')
    })
  })

  describe('navigation', () => {
    it('should navigate to next step when onNext is called', async () => {
      const { getStepName, clickNext } = await renderWizard([Step1, Step2])

      expect(getStepName()).toBe('step1')
      await clickNext()
      expect(getStepName()).toBe('step2')
    })

    it('should navigate to previous step when onPrev is called', async () => {
      const { getStepName, clickNext, clickPrev } = await renderWizard([Step1, Step2])

      await clickNext()
      expect(getStepName()).toBe('step2')
      await clickPrev()
      expect(getStepName()).toBe('step1')
    })

    it('should not navigate before first step', async () => {
      const { getStepName, clickPrev } = await renderWizard([Step1, Step2])

      expect(getStepName()).toBe('step1')
      await clickPrev()
      expect(getStepName()).toBe('step1')
    })

    it('should update step info when navigating', async () => {
      const { getStepInfo, clickNext } = await renderWizard([Step1, Step2])

      expect(getStepInfo()).toBe('Page 1 of 2')
      await clickNext()
      expect(getStepInfo()).toBe('Page 2 of 2')
    })

    it('should navigate through multiple steps', async () => {
      const { getStepName, getStepInfo, clickNext, clickPrev } = await renderWizard([Step1, Step2, Step3])

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
    })
  })

  describe('onFinish', () => {
    it('should call onFinish when clicking next on the last step', async () => {
      const onFinish = vi.fn()
      const { clickNext } = await renderWizard([Step1], onFinish)

      expect(onFinish).not.toHaveBeenCalled()
      await clickNext()
      expect(onFinish).toHaveBeenCalledOnce()
    })

    it('should call onFinish after navigating to the last step', async () => {
      const onFinish = vi.fn()
      const { clickNext } = await renderWizard([Step1, Step2], onFinish)

      await clickNext()
      expect(onFinish).not.toHaveBeenCalled()

      await clickNext()
      expect(onFinish).toHaveBeenCalledOnce()
    })

    it('should work without onFinish callback', async () => {
      const { getStepName, clickNext } = await renderWizard([Step1])

      expect(getStepName()).toBe('step1')
      await clickNext()
      expect(getStepName()).toBe('step1')
    })
  })

  describe('Paper container', () => {
    it('should render step inside a Paper component', async () => {
      const { wizard } = await renderWizard([Step1])
      const paper = wizard.querySelector('div[is="shade-paper"]')
      expect(paper).toBeTruthy()
    })

    it('should have elevation 3 on the Paper', async () => {
      const { wizard } = await renderWizard([Step1])
      const paper = wizard.querySelector('div[is="shade-paper"]')
      expect(paper?.getAttribute('data-elevation')).toBe('3')
    })
  })
})
