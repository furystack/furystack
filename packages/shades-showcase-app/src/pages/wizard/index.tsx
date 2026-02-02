import { createComponent, Shade } from '@furystack/shades'
import { Paper } from '@furystack/shades-common-components'
import { WelcomeWizard } from '../wizard/home-wizard.js'

export const WizardPage = Shade({
  shadowDomName: 'shades-showcase-wizard',
  render: () => {
    return (
      <Paper elevation={3} style={{ padding: '32px' }}>
        <h1>Wizard</h1>
        <p>Click on the following button to start the Wizard Demo.</p>
        <WelcomeWizard />
      </Paper>
    )
  },
})
