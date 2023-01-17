import { Shade, createComponent } from '@furystack/shades'
import { ThemeProviderService } from '../../services'
import type { CollectionService } from '../../services/collection-service'

export const dataGridItemsPerPage = [10, 20, 25, 50, 100, Infinity]

export const DataGridFooter = Shade<{ service: CollectionService<any> }, { count: number; top: number; skip: number }>({
  shadowDomName: 'shade-data-grid-footer',
  getInitialState: ({ props }) => ({
    count: props.service.data.getValue().count,
    top: props.service.querySettings.getValue().top || Infinity,
    skip: props.service.querySettings.getValue().skip || 0,
  }),
  render: ({ props, injector, useObservable, useState }) => {
    const [top, setTop] = useState('top')
    const [skip, setSkip] = useState('skip')
    const currentPage = Math.ceil(skip) / (top || 1)
    const currentEntriesPerPage = top
    const { theme } = injector.getInstance(ThemeProviderService)
    const [count, setCount] = useState('count')

    useObservable('dataUpdater', props.service.data, (data) => {
      setCount(data.count)
    })

    const [currentQuerySettings] = useObservable('querySettings', props.service.querySettings, (querySettings) => {
      setTop(querySettings.top || Infinity)
      setSkip(querySettings.skip || 0)
    })

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
              {[...new Array(Math.ceil(count / (props.service.querySettings.getValue().top || Infinity)))].map(
                (_val, index) => (
                  <option value={index.toString()} selected={currentPage === index}>
                    {(index + 1).toString()}
                  </option>
                ),
              )}
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
