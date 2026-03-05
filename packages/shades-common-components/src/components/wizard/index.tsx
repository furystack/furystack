import type { ChildrenList, ViewTransitionConfig } from '@furystack/shades'
import { createComponent, maybeViewTransition, Shade } from '@furystack/shades'
import { cssVariableTheme } from '../../services/css-variable-theme.js'
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
  /**
   * Optional labels for each step. When provided, a step indicator is shown above the content.
   */
  stepLabels?: string[]
  /**
   * When true, a progress bar is shown above the content.
   */
  showProgress?: boolean
  viewTransition?: boolean | ViewTransitionConfig
}

export const Wizard = Shade<WizardProps>({
  shadowDomName: 'shades-wizard',
  css: {
    fontFamily: cssVariableTheme.typography.fontFamily,
    '& .wizard-container': {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '100%',
    },
    '& .wizard-step-indicator': {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px 24px 8px',
      gap: '0',
    },
    '& .wizard-step-node': {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '4px',
      zIndex: '1',
      minWidth: '32px',
    },
    '& .wizard-step-circle': {
      width: '28px',
      height: '28px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: cssVariableTheme.typography.fontSize.xs,
      fontWeight: cssVariableTheme.typography.fontWeight.semibold,
      border: `2px solid ${cssVariableTheme.action.subtleBorder}`,
      background: cssVariableTheme.background.default,
      color: cssVariableTheme.text.secondary,
      transition: `all ${cssVariableTheme.transitions.duration.normal} ease`,
    },
    '& .wizard-step-circle[data-active]': {
      borderColor: cssVariableTheme.palette.primary.main,
      background: cssVariableTheme.palette.primary.main,
      color: cssVariableTheme.palette.primary.mainContrast,
    },
    '& .wizard-step-circle[data-completed]': {
      borderColor: cssVariableTheme.palette.primary.main,
      background: cssVariableTheme.palette.primary.main,
      color: cssVariableTheme.palette.primary.mainContrast,
      opacity: '0.7',
    },
    '& .wizard-step-label': {
      fontSize: cssVariableTheme.typography.fontSize.xs,
      color: cssVariableTheme.text.secondary,
      textAlign: 'center',
      maxWidth: '80px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    '& .wizard-step-label[data-active]': {
      color: cssVariableTheme.palette.primary.main,
      fontWeight: cssVariableTheme.typography.fontWeight.semibold,
    },
    '& .wizard-step-connector': {
      flex: '1',
      height: '2px',
      background: cssVariableTheme.action.subtleBorder,
      minWidth: '24px',
      alignSelf: 'flex-start',
      marginTop: '14px',
      transition: `background ${cssVariableTheme.transitions.duration.normal} ease`,
    },
    '& .wizard-step-connector[data-completed]': {
      background: cssVariableTheme.palette.primary.main,
    },
    '& .wizard-progress-bar': {
      height: '4px',
      background: cssVariableTheme.action.subtleBorder,
      margin: '12px 24px 4px',
      borderRadius: '2px',
      overflow: 'hidden',
    },
    '& .wizard-progress-fill': {
      height: '100%',
      background: cssVariableTheme.palette.primary.main,
      borderRadius: '2px',
      transition: `width ${cssVariableTheme.transitions.duration.normal} ease`,
    },
  },
  render: ({ props, useState }) => {
    const [currentPage, setCurrentPage] = useState('currentPage', 0)

    if (props.stepLabels && props.stepLabels.length !== props.steps.length) {
      console.warn(
        `[Wizard] stepLabels length (${props.stepLabels.length}) does not match steps length (${props.steps.length}).`,
      )
    }

    const CurrentPage = props.steps[currentPage]
    const progressPercent = props.steps.length > 1 ? (currentPage / (props.steps.length - 1)) * 100 : 100

    return (
      <div className="wizard-container">
        <Paper style={{ maxWidth: '100%', maxHeight: '100%' }} elevation={3} onclick={(ev) => ev.stopPropagation()}>
          {props.stepLabels && props.stepLabels.length > 0 && (
            <div className="wizard-step-indicator" data-testid="wizard-step-indicator">
              {props.steps.map((_, index) => (
                <>
                  {index > 0 && (
                    <div
                      className="wizard-step-connector"
                      {...(index <= currentPage ? { 'data-completed': '' } : {})}
                    />
                  )}
                  <div className="wizard-step-node">
                    <div
                      className="wizard-step-circle"
                      {...(index === currentPage ? { 'data-active': '' } : {})}
                      {...(index < currentPage ? { 'data-completed': '' } : {})}
                    >
                      {(index + 1).toString()}
                    </div>
                    <span className="wizard-step-label" {...(index === currentPage ? { 'data-active': '' } : {})}>
                      {props.stepLabels?.[index] ?? ''}
                    </span>
                  </div>
                </>
              ))}
            </div>
          )}
          {props.showProgress && (
            <div className="wizard-progress-bar" data-testid="wizard-progress-bar">
              <div className="wizard-progress-fill" style={{ width: `${progressPercent}%` }} />
            </div>
          )}
          <CurrentPage
            currentPage={currentPage}
            maxPages={props.steps.length}
            onNext={() => {
              if (currentPage < props.steps.length - 1) {
                void maybeViewTransition(props.viewTransition, () => setCurrentPage(currentPage + 1))
              } else {
                props.onFinish?.()
              }
            }}
            onPrev={() => {
              if (currentPage > 0) {
                void maybeViewTransition(props.viewTransition, () => setCurrentPage(currentPage - 1))
              }
            }}
          />
        </Paper>
      </div>
    )
  },
})
