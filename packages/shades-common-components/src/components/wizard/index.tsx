import type { ChildrenList } from '@furystack/shades'
import { createComponent, Shade } from '@furystack/shades'
import { Paper } from '../paper.js'

export interface WizardStepProps {
  /**
   * The current page number
   */
  currentPage: number
  /**
   * Total count of the wizard pages
   */
  maxPages: number
  /**
   * Callback that will be executed when the user navigates to the next page
   */
  onNext?: () => void
  /**
   * Callback that will be executed when the user navigates to the previous page
   */
  onPrev?: () => void
}

export interface WizardProps {
  /**
   * An array of Shade<WizardStepProps> components
   */
  steps: Array<(props: WizardStepProps, children: ChildrenList) => JSX.Element<any, any>>
  /**
   * A callback that will be executed when the wizard is completed
   */
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
        <Paper style={{ maxWidth: '100%', maxHeight: '100%' }} elevation={3} onclick={(ev) => ev.stopPropagation()}>
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
