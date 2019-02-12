import { Injectable } from '@furystack/inject'
import { Content, IAspect, ISavedContent } from './models'

/**
 * Manager class for content repository aspects
 */
@Injectable()
export class AspectManager {
  public GetAspect(content: Content, aspectName: string) {
    return content.Type.Aspects && content.Type.Aspects[aspectName]
  }

  public GetAspectOrFail(content: Content, aspectName: string) {
    const asp = this.GetAspect(content, aspectName)
    if (!asp) {
      throw Error(`Aspect '${aspectName}' not found for content type '${content.Type.Name}'`)
    }
    return asp
  }

  public async TransformPlainContent<T>(options: {
    content: Content
    aspect: IAspect<T>
    loadRef: (ids: number[]) => Promise<Array<ISavedContent<{}>>>
  }) {
    const { ...content } = { ...options.content }
    const createdObject: ISavedContent<T> = {
      ...JSON.parse(JSON.stringify(content)),
    } as ISavedContent<T>

    for (const field of Object.values(options.aspect.Fields || [])) {
      const contentField = options.content.Fields.find(f => f.Name === field.FieldName)
      const contentFieldType = options.content.Type.Fields && options.content.Type.Fields[field.FieldName as any]
      if (contentField && contentFieldType && contentField.Value) {
        if (contentFieldType.Type === 'Value') {
          createdObject[field.FieldName as keyof T] = contentField.Value as any
        } else if (contentFieldType.Type === 'Reference') {
          const id = JSON.parse(contentField.Value) as number
          const ref = await options.loadRef([id])
          createdObject[field.FieldName as keyof T] = ref[0] as any
        } else if (contentFieldType.Type === 'ReferenceList') {
          const ids = JSON.parse(contentField.Value) as number[]
          const refs = await options.loadRef(ids)
          createdObject[field.FieldName as keyof T] = refs as any
        }
      }
    }
    return createdObject
  }

  public Validate<T>(originalEntity: Content, change: Partial<T>, aspect: IAspect<T>) {
    const missing = []
    const readonly = []
    if (aspect.Fields) {
      for (const aspectField of Object.values(aspect.Fields)) {
        const fieldName = (aspectField.FieldName as any) as (keyof typeof originalEntity['Fields'] &
          keyof typeof change)
        const field = originalEntity.Fields && Object.values(originalEntity.Fields).find(f => f.Name === fieldName)
        // Try to update a read-only field
        if (aspectField.ReadOnly && field && field.Value !== change[fieldName]) {
          readonly.push(fieldName)
        }
        if (aspectField.Required) {
          if (
            // not defined in the original entity AND in the change
            (field && !field.Value && !change[fieldName]) ||
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
