import { createComponent, Shade } from '@furystack/shades'
import { CommandPalette, PageContainer, PageHeader, Paper } from '@furystack/shades-common-components'

type SuggestEntry = { title: string; description: string }
const entries: SuggestEntry[] = [
  { title: 'First Entry', description: 'This is the first entry' },
  { title: 'Second Entry', description: 'This is the second entry' },
  { title: 'Third Entry', description: 'This is the third entry' },
  { title: 'Fourth Entry', description: 'This is the fourth entry' },
  { title: 'Fifth Entry', description: 'This is the fifth entry' },
]

export const CommandPalettePage = Shade({
  shadowDomName: 'shades-command-palette-page',
  render: () => {
    return (
      <PageContainer maxWidth="900px" centered>
        <PageHeader
          icon="⌨️"
          title="Command Palette"
          description="Keyboard-driven command interface similar to VS Code's command palette."
        />
        <Paper elevation={3} style={{ padding: '32px' }}>
          <CommandPalette
            defaultPrefix=">"
            commandProviders={[
              async ({ term }) => {
                return entries
                  .filter((e) => e.title.includes(term) || e.description.includes(term))
                  .map((e) => ({
                    element: (
                      <div>
                        {e.title} <br /> <hr /> {e.description}
                      </div>
                    ),
                    score: 1,
                    onSelected: () => {
                      console.log(e)
                    },
                  }))
              },
            ]}
          />
        </Paper>
      </PageContainer>
    )
  },
})
