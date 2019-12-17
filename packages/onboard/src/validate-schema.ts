import Ajv from 'ajv'
import { JSONSchema7 } from 'json-schema'

export const validateSchema = <T>(options: { data: T; schema: JSONSchema7 }) => {
  const ajv = new Ajv()
  const validator = ajv.compile(options.schema)
  const result = validator(options.data)

  return { result, errors: validator.errors }
}
