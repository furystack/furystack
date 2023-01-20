import { createComponent, Shade } from '@furystack/shades'
import { Avatar, CommandPalette, Fab, Suggest } from '@furystack/shades-common-components'
import { sleepAsync } from '@furystack/utils'

type SuggestEntry = { title: string; description: string }
const entries: SuggestEntry[] = [
  { title: 'First Entry', description: 'This is the first entry' },
  { title: 'Second Entry', description: 'This is the second entry' },
  { title: 'Third Entry', description: 'This is the third entry' },
  { title: 'Fourth Entry', description: 'This is the fourth entry' },
  { title: 'Fifth Entry', description: 'This is the fifth entry' },
]

export const MiscPage = Shade({
  shadowDomName: 'shades-misc-page',
  render: () => {
    return (
      <div
        style={{
          position: 'fixed',
          top: '32px',
          left: '0',
          width: 'calc(100% - 64px)',
          height: '100%',
          padding: '32px',
        }}
      >
        <h1>Misc</h1>
        <div>
          <h2>Avatar</h2>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Avatar title="Avatar" avatarUrl="avatar.jpg" />
            <Avatar title="Broken Avatar without fallback" avatarUrl="broken.jpg" />
            <Avatar title="Broken Avatar with fallback" avatarUrl="broken.jpg" fallback={<>👽</>} />
          </div>
        </div>
        <hr />
        <div>
          <h2>FAB (Bottom Right) </h2>
          <Fab>👍</Fab>
        </div>
        <div>
          <h2>Suggest</h2>
          <Suggest<SuggestEntry>
            getEntries={async (term) => {
              await sleepAsync(1000)
              return entries.filter((e) => e.title.includes(term) || e.description.includes(term))
            }}
            getSuggestionEntry={(entry) => {
              return {
                element: <div>{entry.title}</div>,
                score: 1,
              }
            }}
            onSelectSuggestion={(entry) => {
              console.log(entry)
            }}
            defaultPrefix=">"
          />
        </div>
        <div>
          <h2>Command Palette</h2>
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
        </div>
      </div>
    )
  },
})
