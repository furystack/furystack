import type { IconDefinition } from '@furystack/shades-common-components'

declare module '@furystack/shades' {
  interface NestedRouteMeta {
    icon?: IconDefinition
  }
}
