/**
 * Defines a Parameter object for Odata functions and actions
 */
export interface OdataParameter {
  name: string | 'bindingParameter'
  type: string
}
