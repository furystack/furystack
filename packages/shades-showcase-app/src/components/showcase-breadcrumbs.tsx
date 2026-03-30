import { createComponent, Shade } from '@furystack/shades'
import { Icon, icons, RouteBreadcrumb } from '@furystack/shades-common-components'

export const ShowcaseBreadcrumbComponent = Shade({
  customElementName: 'showcase-breadcrumb-component',
  render: () => (
    <RouteBreadcrumb homeItem={{ path: '/', label: <Icon icon={icons.home} size="small" /> }} separator=" › " />
  ),
})
