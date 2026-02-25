import { createComponent, Shade } from '@furystack/shades'
import { Icon, icons, Input, PageContainer, PageHeader, Paper, Typography } from '@furystack/shades-common-components'

export const SearchStatePage = Shade({
  shadowDomName: 'shades-search-state-page',
  render: ({ useSearchState, renderCount }) => {
    const [searchValue, setSearchValue] = useSearchState('searchValue', '')

    return (
      <PageContainer centered>
        <PageHeader
          icon={<Icon icon={icons.search} />}
          title="Search State"
          description="Demonstrates useSearchState hook that syncs component state with URL search parameters."
        />
        <Paper elevation={3} style={{ padding: '32px' }}>
          <Typography variant="body1">
            Search state change ({renderCount})
            <Input placeholder="Search" value={searchValue} onTextChange={setSearchValue} />
          </Typography>
        </Paper>
      </PageContainer>
    )
  },
})
