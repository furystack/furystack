import { ChildrenList, createComponent, Shade } from '@furystack/shades'
import { Paper } from '../paper'

export interface WizardStepProps {
  currentPage: number
  maxPages: number
  onNext?: () => void
  onPrev?: () => void
}

export interface WizardProps {
  steps: Array<(props: WizardStepProps, children: ChildrenList) => JSX.Element<any, any>>
  isOpened?: boolean
  onFinish?: () => void
}

interface WizardState {
  currentPage: number
}

export const Wizard = Shade<WizardProps, WizardState>({
  shadowDomName: 'shades-wizard',
  getInitialState: () => ({
    currentPage: 0,
  }),
  render: ({ props, getState, updateState }) => {
    const { currentPage } = getState()

    const CurrentPage = props.steps[currentPage]

    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
        }}
      >
        <Paper elevation={3} onclick={(ev) => ev.stopPropagation()}>
          <CurrentPage
            currentPage={currentPage}
            maxPages={props.steps.length}
            onNext={() => {
              if (currentPage < props.steps.length - 1) {
                updateState({ currentPage: currentPage + 1 })
              } else {
                props.onFinish?.()
              }
            }}
            onPrev={() => {
              if (currentPage > 0) {
                updateState({ currentPage: currentPage - 1 })
              }
            }}
          />
        </Paper>
      </div>
    )
  },
})
