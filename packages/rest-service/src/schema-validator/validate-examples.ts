/**
 * example string literal type - needed for Typescipt Generics
 */
export type Language = 'en' | 'hu' | 'de' | 'all'

/**
 * example object type - needed for TypeScipt Generics
 */
export interface BodyParameters {
  gender?: 'MALE' | 'FEMALE'
  age?: string
}

/**
 * Example Schema Definition - can be generated from the example types above with ts-json-schema-generator
 */
export const exampleSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  definitions: {
    BodyParameters: {
      additionalProperties: false,
      properties: {
        age: {
          type: 'string',
        },
        gender: {
          enum: ['MALE', 'FEMALE'],
          type: 'string',
        },
      },
      type: 'object',
    },
    Language: {
      enum: ['en', 'hu', 'de', 'all'],
      type: 'string',
    },
  },
}
