import { attachStyles, createComponent, ScreenService, Shade } from '@furystack/shades'
import type { WizardStepProps } from '@furystack/shades-common-components'
import { Button, fadeIn, fadeOut, Input, Modal, showParallax, Wizard } from '@furystack/shades-common-components'

export const WizardStep = Shade<{ title: string } & WizardStepProps>({
  shadowDomName: 'wizard-step',

  render: ({ props, children, useObservable, injector, useRef }) => {
    const h1Ref = useRef<HTMLHeadingElement>('h1')
    const contentRef = useRef<HTMLDivElement>('content')
    const actionsRef = useRef<HTMLDivElement>('actions')
    const formRef = useRef<HTMLFormElement>('form')

    const getResponsiveStyles = (isLargeScreen: boolean) => {
      return {
        padding: '16px',
        width: isLargeScreen ? '800px' : `${window.innerWidth - 16}px`,
        height: isLargeScreen ? '500px' : `${window.innerHeight - 192}px`,
      }
    }

    setTimeout(() => {
      void showParallax(h1Ref.current)
      void showParallax(contentRef.current, { delay: 200, duration: 600 })
      void showParallax(actionsRef.current, { delay: 400, duration: 2000 })
    }, 1)

    const [isLargeScreenInitial] = useObservable(
      'screenSizeChange',
      injector.getInstance(ScreenService).screenSize.atLeast.md,
      {
        onChange: (isLargeScreen) => {
          if (formRef.current) {
            attachStyles(formRef.current, { style: getResponsiveStyles(isLargeScreen) })
          }
        },
      },
    )

    return (
      <form
        ref={formRef}
        onsubmit={(ev) => {
          ev.preventDefault()
          props.onNext?.()
        }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          maxWidth: 'calc(100% - 32px)',
          maxHeight: 'calc(100% - 32px)',
          ...getResponsiveStyles(isLargeScreenInitial),
        }}
      >
        <h1 ref={h1Ref} style={{ opacity: '0' }}>
          {props.title}
        </h1>
        <div
          ref={contentRef}
          style={{ opacity: '0', flexShrink: '1', overflow: 'auto', padding: '0 .1em' }}
          className="content"
        >
          {children}
        </div>
        <div
          ref={actionsRef}
          className="actions"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            paddingTop: '12px',
            opacity: '0',
          }}
        >
          <Button onclick={() => props.onPrev?.()} disabled={props.currentPage < 1} variant="outlined">
            Previous
          </Button>
          <Button
            type="submit"
            disabled={props.currentPage > props.maxPages - 1}
            variant="contained"
            color={props.currentPage === props.maxPages - 1 ? 'success' : 'primary'}
            onclick={(ev) => (ev.target as HTMLElement)?.closest('form')?.requestSubmit()}
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
  render: ({ props, useDisposable, useRef }) => {
    const wrapperRef = useRef<HTMLDivElement>('wrapper')

    useDisposable('auto-focus', () => {
      const timer = setTimeout(() => {
        wrapperRef.current?.querySelector('input')?.focus()
      }, 0)
      return { [Symbol.dispose]: () => clearTimeout(timer) }
    })

    return (
      <WizardStep title="Step 1" {...props}>
        <div ref={wrapperRef}>
          <p>Welcome in the Wizard Component Demo. Please enter your name and click on the "Next" button to continue</p>
          <Input
            labelTitle="Name"
            required
            name="username"
            variant="outlined"
            value=""
            getHelperText={({ state }) => {
              if (!state.validity.valid) {
                if (state.validity.valueMissing) {
                  return 'The username is required to proceed. Pls enter your name... 😒'
                }
              }
              return 'Please enter your name to proceed'
            }}
          />
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
        <p>
          This is the second step. You can go back or forward by clicking on the navigation buttons. You can also close
          with clicking on the background
        </p>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore
          magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
          consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
          pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id
          est laborum.
        </p>
        <h2>Section 1.10.32 of "de Finibus Bonorum et Malorum", written by Cicero in 45 BC</h2>
        <p>
          Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem
          aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
          Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni
          dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit
          amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam
          aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit
          laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea
          voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla
          pariatur?"
        </p>
      </WizardStep>
    )
  },
})

export const Step3 = Shade<WizardStepProps>({
  shadowDomName: 'shades-wiz-step3',
  render: ({ props }) => {
    return (
      <WizardStep title="Step 3" {...props}>
        <p>All Done, click on Finish to close the Wizard</p>
      </WizardStep>
    )
  },
})

export const WelcomeWizard = Shade({
  shadowDomName: 'shades-welcome-wizard',
  render: ({ useState }) => {
    const [isOpened, setIsOpened] = useState('isOpened', false)
    return (
      <>
        <Button type="button" onclick={() => setIsOpened(true)}>
          Open Wizard
        </Button>
        <Modal
          isVisible={isOpened}
          onClose={() => setIsOpened(false)}
          backdropStyle={{
            backdropFilter: 'blur(10px)',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}
          showAnimation={(el) => fadeIn(el)}
          hideAnimation={(el) => fadeOut(el)}
        >
          <Wizard steps={[Step1, Step2, Step3]} onFinish={() => setIsOpened(false)} />
        </Modal>
      </>
    )
  },
})
