import { createComponent, Shade } from '@furystack/shades'
import { WelcomeWizard } from '../wizard/home-wizard.js'

export const WizardPage = Shade({
  shadowDomName: 'shades-showcase-wizard',
  render: () => {
    return (
      <div>
        <h1>Wizard</h1>
        <p>Click on the following button to start the Wizard Demo.</p>
        <WelcomeWizard />
      </div>
    )
  },
})
