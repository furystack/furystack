import type { ObservableValue } from '@furystack/utils'

type ChildItem = string | number | HTMLElement | JSX.Element | ObservableValue<unknown>

export type ChildrenList = Array<ChildItem | ChildItem[]>
