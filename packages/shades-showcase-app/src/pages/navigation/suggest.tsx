import { createComponent, Shade } from '@furystack/shades'
import { PageContainer, PageHeader, Paper, Suggest } from '@furystack/shades-common-components'
import { sleepAsync } from '@furystack/utils'

type SuggestEntry = { title: string; description: string }
const entries: SuggestEntry[] = [
  { title: 'First Entry', description: 'This is the first entry' },
  { title: 'Second Entry', description: 'This is the second entry' },
  { title: 'Third Entry', description: 'This is the third entry' },
  { title: 'Fourth Entry', description: 'This is the fourth entry' },
  { title: 'Fifth Entry', description: 'This is the fifth entry' },
]

export const SuggestPage = Shade({
  shadowDomName: 'shades-suggest-page',
  render: () => {
    return (
      <PageContainer centered>
        <PageHeader
          icon="🔍"
          title="Suggest"
          description="Typeahead search functionality with async suggestion loading."
        />
        <Paper elevation={3} style={{ padding: '32px' }}>
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
        </Paper>
      </PageContainer>
    )
  },
})
