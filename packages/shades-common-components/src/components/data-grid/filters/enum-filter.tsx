import { createComponent, Shade } from '@furystack/shades'
import { SegmentedControl } from '../../button-group.js'
import { Button } from '../../button.js'
import { close as closeIcon, search as searchIcon } from '../../icons/icon-definitions.js'
import { Icon } from '../../icons/icon.js'
import { Checkbox } from '../../inputs/checkbox.js'
import type { FilterableFindOptions } from '../data-grid.js'
import { cssVariableTheme } from '../../../services/css-variable-theme.js'
import { filterBaseCss } from './filter-styles.js'

type EnumMode = 'include' | 'exclude'

export const EnumFilter = Shade<{
  field: string
  values: Array<{ label: string; value: string }>
  findOptions: FilterableFindOptions
  onFindOptionsChange: (options: FilterableFindOptions) => void
  onClose: () => void
}>({
  customElementName: 'data-grid-enum-filter',
  css: {
    ...filterBaseCss,
    fontFamily: cssVariableTheme.typography.fontFamily,
    '& .filter-mode': {
      marginBottom: '8px',
    },
    '& .filter-checkboxes': {
      maxHeight: '200px',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
      marginBottom: '8px',
    },
    '& shade-checkbox': {
      marginBottom: '0',
    },
  },
  render: ({ props, useState }) => {
    const { findOptions } = props

    const currentFilter = findOptions.filter?.[props.field] as { $in?: string[]; $nin?: string[] } | undefined
    const isExcludeMode = !!currentFilter?.$nin
    const currentSelected = currentFilter?.$in ?? currentFilter?.$nin ?? []

    const [mode, setMode] = useState<EnumMode>('mode', isExcludeMode ? 'exclude' : 'include')
    const selected = new Set<string>(currentSelected)

    const applyFilter = () => {
      const filter = { ...findOptions.filter }
      if (selected.size === 0) {
        delete filter[props.field]
      } else {
        const operator = mode === 'include' ? '$in' : '$nin'
        filter[props.field] = { [operator]: Array.from(selected) }
      }
      props.onFindOptionsChange({ ...findOptions, filter, skip: 0 })
      props.onClose()
    }

    const clearFilter = () => {
      const filter = { ...findOptions.filter }
      delete filter[props.field]
      props.onFindOptionsChange({ ...findOptions, filter, skip: 0 })
      props.onClose()
    }

    return (
      <div>
        <div className="filter-mode">
          <SegmentedControl
            size="small"
            value={mode}
            onValueChange={(v) => setMode(v as EnumMode)}
            options={[
              { value: 'include', label: 'Include' },
              { value: 'exclude', label: 'Exclude' },
            ]}
          />
        </div>
        <div className="filter-checkboxes">
          {props.values.map(({ label, value }) => (
            <Checkbox
              checked={selected.has(value)}
              labelTitle={label}
              onchange={(ev: Event) => {
                const isChecked = (ev.target as HTMLInputElement).checked
                if (isChecked) {
                  selected.add(value)
                } else {
                  selected.delete(value)
                }
              }}
            />
          ))}
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
            type="button"
            variant="outlined"
            size="small"
            color="primary"
            onclick={applyFilter}
            startIcon={<Icon icon={searchIcon} size={14} />}
          >
            Apply
          </Button>
        </div>
      </div>
    )
  },
})
