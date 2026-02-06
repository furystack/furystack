import { createComponent, Shade } from '@furystack/shades'
import {
  Avatar,
  Breadcrumb,
  CommandPalette,
  createBreadcrumb,
  Fab,
  Input,
  PageContainer,
  PageHeader,
  Paper,
  Suggest,
} from '@furystack/shades-common-components'
import { sleepAsync } from '@furystack/utils'

import type { appRoutes } from '../routes.js'

const AppBreadcrumb = createBreadcrumb<typeof appRoutes>()

type SuggestEntry = { title: string; description: string }
const entries: SuggestEntry[] = [
  { title: 'First Entry', description: 'This is the first entry' },
  { title: 'Second Entry', description: 'This is the second entry' },
  { title: 'Third Entry', description: 'This is the third entry' },
  { title: 'Fourth Entry', description: 'This is the fourth entry' },
  { title: 'Fifth Entry', description: 'This is the fifth entry' },
]

const ExampleSearchChangeComponent = Shade({
  shadowDomName: 'shades-example-search-change',
  render: ({ useSearchState, renderCount }) => {
    const [searchValue, setSearchValue] = useSearchState('searchValue', '')

    return (
      <p>
        Search state change ({renderCount})
        <Input placeholder="Search" value={searchValue} onTextChange={setSearchValue} />
      </p>
    )
  },
})

const ExampleStoredStateChangeComponent = Shade({
  shadowDomName: 'shades-example-storedstate-change',
  render: ({ useStoredState, renderCount }) => {
    const [searchValue, setSearchValue] = useStoredState('storedStateValue', '', sessionStorage)

    return (
      <p>
        Stored state change ({renderCount})
        <Input placeholder="Search" value={searchValue} onTextChange={setSearchValue} />
      </p>
    )
  },
})

export const MiscPage = Shade({
  shadowDomName: 'shades-misc-page',
  render: () => {
    return (
      <PageContainer maxWidth="900px" centered>
        <PageHeader
          icon="🎨"
          title="Miscellaneous Components"
          description="A collection of utility components for common UI patterns. Avatar displays user images with fallback support for broken URLs. Fab (Floating Action Button) provides a prominent action button positioned at screen corners. Suggest offers typeahead search functionality, while CommandPalette provides a keyboard-driven command interface similar to VS Code's command palette."
        />
        <Paper elevation={3} style={{ padding: '32px' }}>
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
          <hr />
          <ExampleSearchChangeComponent />
          <ExampleStoredStateChangeComponent />
          <hr />
          <div>
            <h2>Breadcrumb</h2>

            <h3>Basic Breadcrumb</h3>
            <Breadcrumb homeItem={{ path: '/' as const, label: 'Home' }} items={[{ path: '/misc', label: 'Misc' }]} />

            <h3>Multiple Items</h3>
            <Breadcrumb
              items={[
                { path: '/' as const, label: 'Home' },
                { path: '/buttons' as const, label: 'Buttons' },
                { path: '/misc' as const, label: 'Miscellaneous' },
              ]}
            />

            <h3>Custom Separator</h3>
            <Breadcrumb
              items={[
                { path: '/' as const, label: 'Home' },
                { path: '/grid' as const, label: 'Grid' },
                { path: '/misc' as const, label: 'Misc' },
              ]}
              separator=" → "
            />

            <h3>Custom Rendering</h3>
            <Breadcrumb
              items={[
                {
                  path: '/' as const,
                  label: 'Home',
                  render: (item, isActive) => (
                    <span style={{ fontWeight: isActive ? 'bold' : 'normal', color: isActive ? 'var(--primary)' : '' }}>
                      🏠 {item.label}
                    </span>
                  ),
                },
                {
                  path: '/misc' as const,
                  label: 'Misc',
                  render: (item, isActive) => (
                    <span style={{ fontWeight: isActive ? 'bold' : 'normal', color: isActive ? 'var(--primary)' : '' }}>
                      🎨 {item.label}
                    </span>
                  ),
                },
              ]}
              separator=" › "
              lastItemClickable={true}
            />

            <h3>Type-Safe Breadcrumb (using createBreadcrumb)</h3>
            <AppBreadcrumb
              homeItem={{ path: '/', label: '🏠 Home' }}
              items={[{ path: '/misc', label: 'Miscellaneous' }]}
              separator=" / "
            />

            <h3>Last Item Non-Clickable (default)</h3>
            <Breadcrumb
              items={[
                { path: '/' as const, label: 'Home' },
                { path: '/misc' as const, label: 'Misc (not clickable)' },
              ]}
              lastItemClickable={false}
            />
          </div>
        </Paper>
      </PageContainer>
    )
  },
})
