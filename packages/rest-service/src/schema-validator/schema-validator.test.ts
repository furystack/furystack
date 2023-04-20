import { SchemaValidator } from './schema-validator'
import type { BodyParameters, Language } from './validate-examples'
import { exampleSchema } from './validate-examples'
import { SchemaValidationError } from './schema-validation-error'
import { describe, it, expect } from 'vitest'

describe('ValidateSchema', () => {
  describe('String Literal checks', () => {
    it('Should pass on valid string literal parameters', () => {
      expect(new SchemaValidator(exampleSchema).isValid<Language>('en', { schemaName: 'Language' })).toBeTruthy()
    })

    it('Should throw a ValidationError on Age parameters', () => {
      try {
        const result = new SchemaValidator(exampleSchema).isValid<Language>('foo', { schemaName: 'Language' })
        expect(result).toBeFalsy() // should not hit
      } catch (error) {
        expect(error).toBeInstanceOf(SchemaValidationError)
        const { errors } = error as SchemaValidationError
        expect(errors).toHaveLength(1)
        expect(errors[0].message).toEqual('must be equal to one of the allowed values')
      }
    })
  })

  describe('Object checks', () => {
    it('Should fail when string is passed instead of object', () => {
      try {
        new SchemaValidator(exampleSchema).isValid<BodyParameters>('foo', { schemaName: 'BodyParameters' })
      } catch (error) {
        expect(error).toBeInstanceOf(SchemaValidationError)
        const { errors } = error as SchemaValidationError
        expect(errors).toHaveLength(1)
        expect(errors[0].message).toEqual('must be object')
      }
    })

    it('Should fail when an additional property is present', () => {
      try {
        new SchemaValidator(exampleSchema).isValid<BodyParameters>(
          { age: '3', foo: 2 },
          { schemaName: 'BodyParameters' },
        )
      } catch (error) {
        expect(error).toBeInstanceOf(SchemaValidationError)
        const { errors } = error as SchemaValidationError
        expect(errors).toHaveLength(1)
        expect(errors[0].message).toEqual('must NOT have additional properties')
      }
    })

    it('Should pass with empty objects', () => {
      expect(
        new SchemaValidator(exampleSchema).isValid<BodyParameters>({}, { schemaName: 'BodyParameters' }),
      ).toBeTruthy()
    })

    it('Should pass with valid partial objects', () => {
      expect(
        new SchemaValidator(exampleSchema).isValid<BodyParameters>({ age: '3' }, { schemaName: 'BodyParameters' }),
      ).toBeTruthy()
    })
  })

  describe('Multiple checks per validator instance', () => {
    it('Should pass with multiple types from schema per validator instance', () => {
      const validator = new SchemaValidator(exampleSchema)
      expect(validator.isValid<Language>('en', { schemaName: 'Language' })).toBeTruthy()
      expect(
        new SchemaValidator(exampleSchema).isValid<BodyParameters>({}, { schemaName: 'BodyParameters' }),
      ).toBeTruthy()
    })
  })
})
