import type { FindOptions } from '@furystack/core'
import { createComponent, Shade } from '@furystack/shades'
import type { ObservableValue } from '@furystack/utils'
import { cssVariableTheme } from '../../../services/css-variable-theme.js'
import { SegmentedControl } from '../../button-group.js'
import { Button } from '../../button.js'
import { close as closeIcon, search as searchIcon } from '../../icons/icon-definitions.js'
import { Icon } from '../../icons/icon.js'

type DateMode = 'before' | 'after' | 'between'

export const DateFilter = Shade<{
  field: string
  findOptions: ObservableValue<FindOptions<any, any[]>>
  onClose: () => void
}>({
  shadowDomName: 'data-grid-date-filter',
  css: {
    display: 'block',
    '& .filter-row': {
      display: 'flex',
      gap: '6px',
      alignItems: 'center',
      marginBottom: '8px',
    },
    '& input[type="datetime-local"]': {
      flex: '1',
      padding: '4px 6px',
      borderRadius: cssVariableTheme.shape.borderRadius.sm,
      border: `1px solid ${cssVariableTheme.divider}`,
      background: cssVariableTheme.background.default,
      color: cssVariableTheme.text.primary,
      fontSize: cssVariableTheme.typography.fontSize.xs,
    },
    '& .filter-actions': {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '4px',
    },
  },
  render: ({ props, useObservable, useState }) => {
    const [findOptions, setFindOptions] = useObservable('findOptions', props.findOptions)

    const currentFilter = findOptions.filter?.[props.field] as
      | { $lt?: string; $gt?: string; $gte?: string; $lte?: string }
      | undefined

    const detectMode = (): DateMode => {
      if (currentFilter?.$gte && currentFilter?.$lte) return 'between'
      if (currentFilter?.$lt) return 'before'
      if (currentFilter?.$gt) return 'after'
      return 'before'
    }

    const toLocalDateTimeString = (isoStr?: string) => {
      if (!isoStr) return ''
      const d = new Date(isoStr)
      if (isNaN(d.getTime())) return ''
      const pad = (n: number) => n.toString().padStart(2, '0')
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    }

    const getInitialValue = (): string => {
      if (currentFilter?.$gte) return toLocalDateTimeString(currentFilter.$gte)
      if (currentFilter?.$lt) return toLocalDateTimeString(currentFilter.$lt)
      if (currentFilter?.$gt) return toLocalDateTimeString(currentFilter.$gt)
      return ''
    }

    const getInitialSecondValue = (): string => {
      if (currentFilter?.$lte) return toLocalDateTimeString(currentFilter.$lte)
      return ''
    }

    const [selectedMode, setSelectedMode] = useState<DateMode>('selectedMode', detectMode())
    let dateValue = getInitialValue()
    let secondDateValue = getInitialSecondValue()

    const applyFilter = () => {
      const filter = { ...findOptions.filter }
      if (!dateValue) {
        delete filter[props.field]
        setFindOptions({ ...findOptions, filter, skip: 0 })
        props.onClose()
        return
      }

      let filterValue: Record<string, string>
      switch (selectedMode) {
        case 'before':
          filterValue = { $lt: new Date(dateValue).toISOString() }
          break
        case 'after':
          filterValue = { $gt: new Date(dateValue).toISOString() }
          break
        case 'between':
          filterValue = {
            $gte: new Date(dateValue).toISOString(),
            ...(secondDateValue ? { $lte: new Date(secondDateValue).toISOString() } : {}),
          }
          break
        default:
          throw new Error(`Invalid date mode: ${selectedMode as unknown as string}`)
      }

      if (filterValue) {
        filter[props.field] = filterValue
      } else {
        delete filter[props.field]
      }
      setFindOptions({ ...findOptions, filter, skip: 0 })
      props.onClose()
    }

    const clearFilter = () => {
      const filter = { ...findOptions.filter }
      delete filter[props.field]
      setFindOptions({ ...findOptions, filter, skip: 0 })
      props.onClose()
    }

    return (
      <form
        onsubmit={(ev: Event) => {
          ev.preventDefault()
          applyFilter()
        }}
      >
        <div className="filter-row">
          <SegmentedControl
            size="small"
            value={selectedMode}
            onValueChange={(v) => setSelectedMode(v as DateMode)}
            options={[
              { value: 'before', label: 'Before' },
              { value: 'after', label: 'After' },
              { value: 'between', label: 'Between' },
            ]}
          />
        </div>
        <div className="filter-row">
          <input
            data-testid="date-filter-value"
            type="datetime-local"
            value={dateValue}
            autofocus
            oninput={(ev: Event) => {
              dateValue = (ev.target as HTMLInputElement).value
            }}
          />
        </div>
        <div className="filter-row" style={{ display: selectedMode === 'between' ? 'flex' : 'none' }}>
          <input
            data-testid="date-filter-value-end"
            type="datetime-local"
            value={secondDateValue}
            oninput={(ev: Event) => {
              secondDateValue = (ev.target as HTMLInputElement).value
            }}
          />
        </div>
        <div className="filter-actions">
          <Button
            type="button"
            variant="outlined"
            size="small"
            onclick={clearFilter}
            startIcon={<Icon icon={closeIcon} size={14} />}
          >
            Clear
          </Button>
          <Button
            type="submit"
            variant="outlined"
            size="small"
            color="primary"
            startIcon={<Icon icon={searchIcon} size={14} />}
          >
            Apply
          </Button>
        </div>
      </form>
    )
  },
})
