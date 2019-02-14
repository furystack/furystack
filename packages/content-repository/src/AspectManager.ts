import { Injectable } from '@furystack/inject'
import { Content, IAspect, ISavedContent } from './models'

/**
 * Manager class for content repository aspects
 */
@Injectable()
export class AspectManager {
  public getAspect(content: Content, aspectName: string) {
    return content.type.aspects && content.type.aspects[aspectName]
  }

  public getAspectOrFail(content: Content, aspectName: string) {
    const asp = this.getAspect(content, aspectName)
    if (!asp) {
      throw Error(`Aspect '${aspectName}' not found for content type '${content.type.name}'`)
    }
    return asp
  }

  public async transformPlainContent<T>(options: {
    content: Content
    aspect: IAspect<T>
    loadRef: (ids: number[]) => Promise<Array<ISavedContent<{}>>>
  }) {
    const { ...content } = { ...options.content }
    const createdObject: ISavedContent<T> = {
      ...JSON.parse(JSON.stringify(content)),
    }

    for (const field of Object.values(options.aspect.fields || [])) {
      const contentField = options.content.fields.find(f => f.name === field.fieldName)
      const contentFieldType = options.content.type.fields && options.content.type.fields[field.fieldName as any]
      if (contentField && contentFieldType && contentField.value) {
        if (contentFieldType.type === 'Value') {
          createdObject[field.fieldName as keyof T] = contentField.value as any
        } else if (contentFieldType.type === 'Reference') {
          const id = JSON.parse(contentField.value) as number
          const ref = await options.loadRef([id])
          createdObject[field.fieldName as keyof T] = ref[0] as any
        } else if (contentFieldType.type === 'ReferenceList') {
          const ids = JSON.parse(contentField.value) as number[]
          const refs = await options.loadRef(ids)
          createdObject[field.fieldName as keyof T] = refs as any
        }
      }
    }
    return createdObject
  }

  public validate<T>(originalEntity: Content, change: Partial<T>, aspect: IAspect<T>) {
    const missing = []
    const readonly = []
    if (aspect.fields) {
      for (const aspectField of Object.values(aspect.fields)) {
        const fieldName = (aspectField.fieldName as any) as (keyof typeof originalEntity['fields'] &
          keyof typeof change)
        const field = originalEntity.fields && Object.values(originalEntity.fields).find(f => f.name === fieldName)
        // Try to update a read-only field
        if (aspectField.readOnly && field && field.value !== change[fieldName]) {
          readonly.push(fieldName)
        }
        if (aspectField.required) {
          if (
            // not defined in the original entity AND in the change
            (field && !field.value && !change[fieldName]) ||
            // explicitly try to override with null
            change[fieldName] === null
          ) {
            missing.push(fieldName)
          }
        }
      }
    }
    return {
      missing,
      readonly,
      isValid: missing.length + readonly.length ? false : true,
    }
  }
}
