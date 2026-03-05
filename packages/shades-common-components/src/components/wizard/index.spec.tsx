import { Injector } from '@furystack/inject'
import type { ChildrenList } from '@furystack/shades'
import { createComponent, flushUpdates, initializeShadeRoot, Shade } from '@furystack/shades'
import { usingAsync } from '@furystack/utils'
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
    delete (document as unknown as Record<string, unknown>).startViewTransition
  })

  const renderWizard = async (
    steps: Array<(props: WizardStepProps, children: ChildrenList) => JSX.Element>,
    onFinish?: () => void,
    options?: { stepLabels?: string[]; showProgress?: boolean; viewTransition?: boolean },
  ) => {
    const injector = new Injector()
    const root = document.getElementById('root')!
    initializeShadeRoot({
      injector,
      rootElement: root,
      jsxElement: (
        <Wizard
          steps={steps}
          onFinish={onFinish}
          stepLabels={options?.stepLabels}
          showProgress={options?.showProgress}
          viewTransition={options?.viewTransition}
        />
      ),
    })
    await flushUpdates()

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
        await flushUpdates()
      },
      clickPrev: async () => {
        const btn = getStepElement()?.querySelector('.prev-btn') as HTMLButtonElement
        btn?.click()
        await flushUpdates()
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

  describe('step indicator', () => {
    it('should not render step indicator when stepLabels is not provided', async () => {
      await usingAsync(await renderWizard([Step1, Step2]), async ({ wizard }) => {
        const indicator = wizard.querySelector('[data-testid="wizard-step-indicator"]')
        expect(indicator).toBeNull()
      })
    })

    it('should render step indicator when stepLabels is provided', async () => {
      await usingAsync(
        await renderWizard([Step1, Step2, Step3], undefined, {
          stepLabels: ['First', 'Second', 'Third'],
        }),
        async ({ wizard }) => {
          const indicator = wizard.querySelector('[data-testid="wizard-step-indicator"]')
          expect(indicator).toBeTruthy()

          const circles = indicator?.querySelectorAll('.wizard-step-circle')
          expect(circles?.length).toBe(3)
        },
      )
    })

    it('should show step labels', async () => {
      await usingAsync(
        await renderWizard([Step1, Step2], undefined, {
          stepLabels: ['Setup', 'Confirm'],
        }),
        async ({ wizard }) => {
          const labels = wizard.querySelectorAll('.wizard-step-label')
          expect(labels[0]?.textContent).toBe('Setup')
          expect(labels[1]?.textContent).toBe('Confirm')
        },
      )
    })

    it('should mark the current step as active', async () => {
      await usingAsync(
        await renderWizard([Step1, Step2, Step3], undefined, {
          stepLabels: ['A', 'B', 'C'],
        }),
        async ({ wizard }) => {
          const circles = wizard.querySelectorAll('.wizard-step-circle')
          expect(circles[0]?.hasAttribute('data-active')).toBe(true)
          expect(circles[1]?.hasAttribute('data-active')).toBe(false)
        },
      )
    })

    it('should update active step on navigation', async () => {
      await usingAsync(
        await renderWizard([Step1, Step2, Step3], undefined, {
          stepLabels: ['A', 'B', 'C'],
        }),
        async ({ wizard, clickNext }) => {
          await clickNext()
          const circles = wizard.querySelectorAll('.wizard-step-circle')
          expect(circles[0]?.hasAttribute('data-completed')).toBe(true)
          expect(circles[1]?.hasAttribute('data-active')).toBe(true)
          expect(circles[2]?.hasAttribute('data-active')).toBe(false)
        },
      )
    })
  })

  describe('progress bar', () => {
    it('should not render progress bar when showProgress is false', async () => {
      await usingAsync(await renderWizard([Step1, Step2]), async ({ wizard }) => {
        const progressBar = wizard.querySelector('[data-testid="wizard-progress-bar"]')
        expect(progressBar).toBeNull()
      })
    })

    it('should render progress bar when showProgress is true', async () => {
      await usingAsync(
        await renderWizard([Step1, Step2, Step3], undefined, { showProgress: true }),
        async ({ wizard }) => {
          const progressBar = wizard.querySelector('[data-testid="wizard-progress-bar"]')
          expect(progressBar).toBeTruthy()
        },
      )
    })

    it('should start at 0% on first step', async () => {
      await usingAsync(
        await renderWizard([Step1, Step2, Step3], undefined, { showProgress: true }),
        async ({ wizard }) => {
          const fill = wizard.querySelector('.wizard-progress-fill') as HTMLElement
          expect(fill?.style.width).toBe('0%')
        },
      )
    })

    it('should update progress on navigation', async () => {
      await usingAsync(
        await renderWizard([Step1, Step2, Step3], undefined, { showProgress: true }),
        async ({ wizard, clickNext }) => {
          await clickNext()
          const fill = wizard.querySelector('.wizard-progress-fill') as HTMLElement
          expect(fill?.style.width).toBe('50%')

          await clickNext()
          const fill2 = wizard.querySelector('.wizard-progress-fill') as HTMLElement
          expect(fill2?.style.width).toBe('100%')
        },
      )
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

  describe('view transitions', () => {
    const mockStartViewTransition = () => {
      const spy = vi.fn((optionsOrCallback: StartViewTransitionOptions | (() => void)) => {
        const update = typeof optionsOrCallback === 'function' ? optionsOrCallback : optionsOrCallback.update
        update?.()
        return {
          finished: Promise.resolve(),
          ready: Promise.resolve(),
          updateCallbackDone: Promise.resolve(),
          skipTransition: vi.fn(),
        } as unknown as ViewTransition
      })
      document.startViewTransition = spy as typeof document.startViewTransition
      return spy
    }

    it('should call startViewTransition on next when viewTransition is enabled', async () => {
      const spy = mockStartViewTransition()
      await usingAsync(
        await renderWizard([Step1, Step2, Step3], undefined, { viewTransition: true }),
        async ({ clickNext, getStepName }) => {
          spy.mockClear()
          await clickNext()
          expect(spy).toHaveBeenCalledTimes(1)
          expect(getStepName()).toBe('step2')
        },
      )
    })

    it('should call startViewTransition on prev when viewTransition is enabled', async () => {
      const spy = mockStartViewTransition()
      await usingAsync(
        await renderWizard([Step1, Step2, Step3], undefined, { viewTransition: true }),
        async ({ clickNext, clickPrev, getStepName }) => {
          await clickNext()
          spy.mockClear()
          await clickPrev()
          expect(spy).toHaveBeenCalledTimes(1)
          expect(getStepName()).toBe('step1')
        },
      )
    })

    it('should not call startViewTransition when viewTransition is not set', async () => {
      const spy = mockStartViewTransition()
      await usingAsync(await renderWizard([Step1, Step2, Step3]), async ({ clickNext, getStepName }) => {
        spy.mockClear()
        await clickNext()
        expect(spy).not.toHaveBeenCalled()
        expect(getStepName()).toBe('step2')
      })
    })
  })
})
