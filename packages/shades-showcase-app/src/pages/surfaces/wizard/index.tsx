import { createComponent, Shade } from '@furystack/shades'
import { PageContainer, PageHeader, Paper } from '@furystack/shades-common-components'
import { WelcomeWizard } from '../wizard/home-wizard.js'

export const WizardPage = Shade({
  tagName: 'shades-showcase-wizard',
  render: () => {
    return (
      <PageContainer maxWidth="800px" centered>
        <PageHeader
          icon="🧙"
          title="Wizard"
          description="The Wizard component guides users through multi-step processes with a modal dialog interface. Each step can contain its own form or content, with navigation between steps controlled by Next/Back buttons. Wizards are ideal for onboarding flows, complex form submissions, or any sequential process that benefits from breaking into digestible chunks."
        />
        <Paper elevation={3} style={{ padding: '32px' }}>
          <p>Click on the following button to start the Wizard Demo.</p>
          <WelcomeWizard />
        </Paper>
      </PageContainer>
    )
  },
})
