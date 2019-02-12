/**
 * Represents a reference type
 */
export interface IReferenceType {
  DisplayName?: string
  Description?: string
  Category?: string
  AllowMultiple?: boolean
  AllowedTypeNames?: string[]
  Type: 'Reference' | 'ReferenceList'
}
