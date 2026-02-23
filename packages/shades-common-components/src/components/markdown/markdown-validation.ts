import type { InputValidationResult } from '../inputs/input.js'

type ValidationOptions = {
  value: string
  required?: boolean
  getValidationResult?: (options: { value: string }) => InputValidationResult
  getHelperText?: (options: { value: string; validationResult?: InputValidationResult }) => JSX.Element | string
}

export type ValidationState = {
  validationResult: InputValidationResult | undefined
  isRequired: boolean
  isInvalid: boolean
  helperNode: JSX.Element | string
}

/**
 * Computes validation state from common markdown field props.
 * Shared between MarkdownInput and MarkdownEditor to keep the logic in one place.
 */
export const resolveValidationState = (options: ValidationOptions): ValidationState => {
  const validationResult = options.getValidationResult?.({ value: options.value })
  const isRequired = !!options.required && !options.value
  const isInvalid = validationResult?.isValid === false || isRequired

  const helperNode =
    (validationResult?.isValid === false && validationResult?.message) ||
    (isRequired && 'Value is required') ||
    options.getHelperText?.({ value: options.value, validationResult }) ||
    ''

  return { validationResult, isRequired, isInvalid, helperNode }
}
