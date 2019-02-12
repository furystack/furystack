/**
 * Represents an entity with basic values
 */
export interface IValueType {
  DisplayName?: string
  Description?: string
  DefaultValue?: string
  Unique?: boolean
  Type: 'Value'
}
