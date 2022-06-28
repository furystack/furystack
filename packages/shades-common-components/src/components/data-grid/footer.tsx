import { Shade, createComponent } from '@furystack/shades'
import { ThemeProviderService } from '../../services'
import { CollectionService, CollectionData } from '../../services/collection-service'

export const dataGridItemsPerPage = [10, 20, 25, 50, 100, Infinity]

export const DataGridFooter = Shade<{ service: CollectionService<any> }, { data: CollectionData<any> }>({
  shadowDomName: 'shade-data-grid-footer',
  getInitialState: ({ props }) => ({
    data: props.service.data.getValue(),
  }),
  constructed: ({ props, updateState, injector, element }) => {
    const disposables = [
      props.service.data.subscribe((data) => updateState({ data })),

      injector.getInstance(ThemeProviderService).theme.subscribe((t) => {
        const el = element.querySelector('div') as HTMLDivElement
        el.style.color = t.text.secondary
        el.style.background = t.background.paper
      }),
    ]

    return () => disposables.forEach((d) => d.dispose())
  },
  render: ({ props, getState, injector }) => {
    const state = getState()
    const currentQuerySettings = props.service.querySettings.getValue()
    const currentPage = Math.ceil(currentQuerySettings.skip || 0) / (currentQuerySettings.top || 1)
    const currentEntriesPerPage = currentQuerySettings.top || Infinity
    const theme = injector.getInstance(ThemeProviderService).theme.getValue()

    return (
      <div
        className="pager"
        style={{
          backdropFilter: 'blur(10px)',
          color: theme.text.secondary,
          position: 'sticky',
          bottom: '0',
          display: 'flex',
          justifyContent: 'flex-end',
          padding: '1em',
          alignItems: 'center',
        }}
      >
        {currentEntriesPerPage !== Infinity && (
          <div>
            Goto page
            <select
              style={{ margin: '0 1em' }}
              onchange={(ev) => {
                const value = parseInt((ev.target as any).value, 10)
                const currentQuery = props.service.querySettings.getValue()
                props.service.querySettings.setValue({ ...currentQuery, skip: (currentQuery.top || 0) * value })
              }}
            >
              {[
                ...new Array(Math.ceil(state.data.count / (props.service.querySettings.getValue().top || Infinity))),
              ].map((_val, index) => (
                <option value={index.toString()} selected={currentPage === index}>
                  {(index + 1).toString()}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          Show
          <select
            style={{ margin: '0 1em' }}
            onchange={(ev) => {
              const value = parseInt((ev.currentTarget as any).value as string, 10)
              props.service.querySettings.setValue({
                ...currentQuerySettings,
                top: value,
                skip: currentPage * value,
              })
            }}
          >
            {dataGridItemsPerPage.map((no) => (
              <option value={no.toString()} selected={no === currentEntriesPerPage}>
                {no.toString()}
              </option>
            ))}
          </select>
          items per page
        </div>
      </div>
    )
  },
})
