import { createComponent, createFragment, Shade } from '@furystack/shades'
import { animations, Button, Input, Modal, Wizard, WizardStepProps } from '@furystack/shades-common-components'
import { ObservableValue } from '@furystack/utils'

export const WizardStep = Shade<{ title: string } & WizardStepProps>({
  shadowDomName: 'wizard-step',
  render: ({ props, element, children }) => {
    setTimeout(() => animations.showParallax(element.querySelector('h1')), 1)
    return (
      <form
        onsubmit={(ev) => {
          ev.preventDefault()
          props.onNext?.()
        }}
        style={{
          width: '800px',
          height: '450px',
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <h1>{props.title}</h1>
        <div> {children}</div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            paddingTop: '12px',
          }}
        >
          <Button onclick={() => props.onPrev?.()} disabled={props.currentPage < 1} variant="outlined">
            Previous
          </Button>
          <Button
            autofocus
            type="submit"
            disabled={props.currentPage > props.maxPages - 1}
            variant="contained"
            color={props.currentPage === props.maxPages - 1 ? 'success' : 'primary'}
          >
            {props.currentPage < props.maxPages - 1 ? 'Next' : 'Finish'}
          </Button>
        </div>
      </form>
    )
  },
})

export const Step1 = Shade<WizardStepProps>({
  shadowDomName: 'shades-wiz-step1',
  constructed: ({ element }) => {
    element.querySelector('input')?.focus()
  },
  render: ({ props }) => {
    return (
      <WizardStep title="Step 1" {...props}>
        <div>
          <p>Welcome in the Wizard Component. Click on the "Next" button to continue</p>
          <Input labelTitle="Please enter your name" required autofocus name="username" value="" />
          <input type="submit" style={{ display: 'none' }} />
        </div>
      </WizardStep>
    )
  },
})

export const Step2 = Shade<WizardStepProps>({
  shadowDomName: 'shades-wiz-step2',
  render: ({ props }) => {
    return (
      <WizardStep title="Step 2" {...props}>
        <p>You can go back or forward...</p>
      </WizardStep>
    )
  },
})

export const Step3 = Shade<WizardStepProps>({
  shadowDomName: 'shades-wiz-step3',
  render: ({ props }) => {
    return (
      <WizardStep title="Step 3" {...props}>
        <p>Click on Finish to close the Wizard</p>
      </WizardStep>
    )
  },
})

export const WelcomeWizard = Shade<unknown, { isOpened: ObservableValue<boolean> }>({
  shadowDomName: 'shades-welcome-wizard',
  getInitialState: () => ({ isOpened: new ObservableValue(false) }),
  constructed: ({ getState }) => {
    return () => getState().isOpened.dispose()
  },
  render: ({ getState }) => {
    const { isOpened } = getState()
    return (
      <>
        <Button onclick={() => isOpened.setValue(true)}>Open Wizard</Button>
        <Modal
          isVisible={isOpened}
          onClose={() => isOpened.setValue(false)}
          backdropStyle={{
            backdropFilter: 'blur(10px)',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}
          showAnimation={(el) => animations.fadeIn(el)}
          hideAnimation={(el) => animations.fadeOut(el)}
        >
          <Wizard steps={[Step1, Step2, Step3]} onFinish={() => isOpened.setValue(false)} />
        </Modal>
      </>
    )
  },
})
