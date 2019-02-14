import { AspectManager } from '../src/AspectManager'
import { Content, IAspect } from '../src/models'

describe('Aspect Manager', () => {
  const av = new AspectManager()

  describe('Validate', () => {
    it('Should return true for empty fields', () => {
      /**/
      const result = av.validate<{ a: string }>({ fields: [{ name: 'a', value: '1' }] } as Content, {}, {})
      expect(result.isValid).toBeTruthy()
    })

    it('Should return true for valid aspects', () => {
      /**/
      const result = av.validate<{ a: string }>({ fields: [{ name: 'a', value: '1' }] } as Content, {}, {
        Fields: {
          a: {
            FieldName: 'a',
            Required: true,
          },
        },
      } as IAspect<{ a: string }>)
      expect(result.isValid).toBeTruthy()
    })

    describe('Missing fields', () => {
      it('Should return false if not defined in original content and in the change', () => {
        /**/
        const result = av.validate<{ a: string }>({ fields: [{ name: 'a', value: undefined as any }] } as Content, {}, {
          fields: {
            a: {
              fieldName: 'a',
              required: true,
            },
          },
        } as IAspect<{ a: string }>)
        expect(result.isValid).toBeFalsy()
        expect(result.readonly.length).toEqual(0)
        expect(result.missing).toContain('a')
      })
    })

    it('Should return false and fill read only fields', () => {
      const result = av.validate({ fields: [{ name: 'a', value: '1' }] } as Content, { a: 2 }, {
        fields: {
          a: {
            fieldName: 'a',
            readOnly: true,
          },
        },
      } as IAspect<{ a: number }>)
      expect(result.isValid).toBeFalsy()
      expect(result.missing.length).toEqual(0)
      expect(result.readonly).toContain('a')
    })
  })

  describe('TransformPlainContent', () => {
    it('Should transform plain object to the defined value', async () => {
      const transformed = await av.transformPlainContent<{ userName: string }>({
        content: {
          id: 123,
          type: {
            fields: {
              userName: {
                type: 'Value',
              },
            },
          } as any,
          contentTypeRef: undefined as any,
          creationDate: new Date(),
          modificationDate: new Date(),
          fields: [
            {
              id: 123,
              name: 'userName',
              value: 'Béla',
              content: undefined as any,
            },
          ],
          permissions: [],
          jobPermissions: [],
        },
        aspect: {
          fields: {
            0: {
              readOnly: false,
              required: false,
              fieldName: 'userName',
            },
          },
        },
        loadRef: () => Promise.resolve({ Id: 1 }) as any,
      })
      const expectedValue = { Id: 123, UserName: 'Béla' }
      for (const key of Object.keys(expectedValue)) {
        expect(transformed[key as keyof typeof transformed]).toEqual(expectedValue[key as keyof typeof expectedValue])
      }
    })
  })

  describe('GetAspect', () => {
    it('Should return undefined when no aspect has been found', () => {
      const aspect = av.getAspect(
        {
          id: 123,
          contentTypeRef: null as any,
          fields: [],
          creationDate: new Date(),
          modificationDate: new Date(),
          type: {
            name: 'ContentType',
            aspects: {},
            permissions: [],
            jobTypePermissions: [],
          },
          jobPermissions: [],
          permissions: [],
        },
        'Create',
      )
      expect(aspect).toBeUndefined()
    })

    it('Should return a valid aspect', () => {
      const a = {
        fields: [],
        displayName: 'create Aspect',
      }
      const aspect = av.getAspect(
        {
          id: 123,
          contentTypeRef: null as any,
          fields: [],
          creationDate: new Date(),
          modificationDate: new Date(),
          type: {
            name: 'ContentType',
            aspects: {
              create: a,
            },
            permissions: [],
            jobTypePermissions: [],
          },
          permissions: [],
          jobPermissions: [],
        },
        'create',
      )
      expect(aspect).toEqual(a)
    })
  })

  describe('GetAspectOrFail()', () => {
    it('Should return an aspect', () => {
      const a = {
        fields: [],
        displayName: 'Create Aspect',
      }
      const aspect = av.getAspectOrFail(
        {
          id: 123,
          contentTypeRef: null as any,
          fields: [],
          creationDate: new Date(),
          modificationDate: new Date(),
          type: {
            name: 'ContentType',
            aspects: {
              create: a,
            },
            permissions: [],
            jobTypePermissions: [],
          },
          permissions: [],
          jobPermissions: [],
        },
        'create',
      )
      expect(aspect).toEqual(a)
    })

    it('Should throw an error for non-existing aspects', () => {
      expect(() => {
        av.getAspectOrFail(
          {
            id: 123,
            contentTypeRef: null as any,
            fields: [],
            creationDate: new Date(),
            modificationDate: new Date(),
            type: {
              name: 'ContentType',
              aspects: {},
              permissions: [],
              jobTypePermissions: [],
            },
            permissions: [],
            jobPermissions: [],
          },
          'Create',
        )
      }).toThrowError("Aspect 'Create' not found for content type 'ContentType'")
    })
  })
})
