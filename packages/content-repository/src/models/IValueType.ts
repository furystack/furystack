/**
 * Represents an entity with basic values
 */
export interface IValueType {
  displayName?: string
  description?: string
  defaultValue?: string
  unique?: boolean
  type: 'Value'
}
