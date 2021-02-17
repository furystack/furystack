import Ajv, { ErrorObject, Options } from 'ajv'
import useFormats from 'ajv-formats'
import { SchemaValidationError } from './schema-validation-error'

export class SchemaValidator<TSchema extends { definitions: {} }> {
  private readonly ajv = new Ajv({
    allErrors: true,
    ...this.ajvOptions,
  })
  constructor(private readonly schema: TSchema, private readonly ajvOptions?: Options) {
    useFormats(this.ajv)
  }

  /**
   * @param data The object to validate
   * @param options Options for the schema validation
   * @param options.schemaName The name of the type in the Schema Definitions
   * @throws SchemaValidationError when the validation has been failed
   * @returns true in case of validation success
   */
  public isValid<T>(data: any, options: { schemaName: keyof TSchema['definitions'] }): data is T {
    const schema = { ...this.schema, $ref: `#/definitions/${options.schemaName}` }
    const validatorFn = this.ajv.compile(schema)
    const isValid = validatorFn(data)
    if (!isValid) {
      throw new SchemaValidationError(validatorFn.errors as ErrorObject[])
    }

    return true
  }
}
