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
  steps: Array<(props: WizardStepProps, children: ChildrenList) => JSX.Element<any>>
  /**
   * A callback that will be executed when the wizard is completed
   */
  onFinish?: () => void
}

export const Wizard = Shade<WizardProps>({
  shadowDomName: 'shades-wizard',
  css: {
    '& .wizard-container': {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '100%',
    },
  },
  render: ({ props, useState }) => {
    const [currentPage, setCurrentPage] = useState('currentPage', 0)

    const CurrentPage = props.steps[currentPage]

    return (
      <div className="wizard-container">
        <Paper style={{ maxWidth: '100%', maxHeight: '100%' }} elevation={3} onclick={(ev) => ev.stopPropagation()}>
          <CurrentPage
            currentPage={currentPage}
            maxPages={props.steps.length}
            onNext={() => {
              if (currentPage < props.steps.length - 1) {
                setCurrentPage(currentPage + 1)
              } else {
                props.onFinish?.()
              }
            }}
            onPrev={() => {
              if (currentPage > 0) {
                setCurrentPage(currentPage - 1)
              }
            }}
          />
        </Paper>
      </div>
    )
  },
})
