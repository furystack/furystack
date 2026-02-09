import { createComponent, Shade } from '@furystack/shades'
import { Input, PageContainer, PageHeader, Paper } from '@furystack/shades-common-components'

export const SearchStatePage = Shade({
  shadowDomName: 'shades-search-state-page',
  render: ({ useSearchState, renderCount }) => {
    const [searchValue, setSearchValue] = useSearchState('searchValue', '')

    return (
      <PageContainer centered>
        <PageHeader
          icon="🔎"
          title="Search State"
          description="Demonstrates useSearchState hook that syncs component state with URL search parameters."
        />
        <Paper elevation={3} style={{ padding: '32px' }}>
          <p>
            Search state change ({renderCount})
            <Input placeholder="Search" value={searchValue} onTextChange={setSearchValue} />
          </p>
        </Paper>
      </PageContainer>
    )
  },
})
