import { IAspectField } from './IAspectField'
import { IAspectReference } from './IAspectReference'
import { IContentType } from './IContentType'

/**
 * Model that defines an aspect
 */
export interface IAspect {
  Id: number
  Name: string
  ContentType: Promise<IContentType>
  AspectFields: Promise<IAspectField[]>
  AspectReferences: Promise<IAspectReference[]>
}
