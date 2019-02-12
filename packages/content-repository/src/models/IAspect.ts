/**
 * Represents an aspect field type
 */
export interface IAspectFieldType<T> {
  FieldName: keyof T
  Required?: boolean
  ReadOnly?: boolean
  ControlHint?: string
}

/**
 * Represents an aspect instance
 */
export interface IAspect<T> {
  DisplayName?: string
  Description?: string
  Fields?: {
    [K: number]: IAspectFieldType<T>
  }
}
