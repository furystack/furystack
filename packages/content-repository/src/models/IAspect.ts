/**
 * Represents an aspect field type
 */
export interface IAspectFieldType<T> {
  fieldName: keyof T
  required?: boolean
  readOnly?: boolean
  controlHint?: string
}

/**
 * Represents an aspect instance
 */
export interface IAspect<T> {
  displayName?: string
  description?: string
  fields?: {
    [K: number]: IAspectFieldType<T>
  }
}
