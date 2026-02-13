import { createComponent, Shade } from '@furystack/shades'
import { Icon, icons, Input, PageContainer, PageHeader, Paper } from '@furystack/shades-common-components'

export const StoredStatePage = Shade({
  shadowDomName: 'shades-stored-state-page',
  render: ({ useStoredState, renderCount }) => {
    const [searchValue, setSearchValue] = useStoredState('storedStateValue', '', sessionStorage)

    return (
      <PageContainer centered>
        <PageHeader
          icon={<Icon icon={icons.save} />}
          title="Stored State"
          description="Demonstrates useStoredState hook that persists component state to sessionStorage."
        />
        <Paper elevation={3} style={{ padding: '32px' }}>
          <p>
            Stored state change ({renderCount})
            <Input placeholder="Search" value={searchValue} onTextChange={setSearchValue} />
          </p>
        </Paper>
      </PageContainer>
    )
  },
})
