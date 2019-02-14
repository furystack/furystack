/**
 * Represents a reference type
 */
export interface IReferenceType {
  displayName?: string
  description?: string
  category?: string
  allowMultiple?: boolean
  allowedTypeNames?: string[]
  type: 'Reference' | 'ReferenceList'
}
