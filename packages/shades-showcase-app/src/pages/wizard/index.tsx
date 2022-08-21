import { createComponent, Shade } from '@furystack/shades'
import { WelcomeWizard } from '../wizard/home-wizard'

export const WizardPage = Shade<unknown, { isWizardOpened?: boolean }>({
  shadowDomName: 'shades-showcase-wizard',
  getInitialState: () => ({ isWizardOpened: false }),

  render: () => {
    return (
      <div>
        <h1>Wizard</h1>
        <p>Click on the following button to open the wizard demo.</p>
        <WelcomeWizard />
      </div>
    )
  },
})
