import { ODataGetOperation } from './odata-get-operation'
import { ODataQuery } from './odata-query'

/**
 * Abstract class for OData Services
 */
export abstract class ODataServiceAbstract<T> {
  protected abstract entitySetUrl: string

  /**
   * Creates an OData Get Operation object.
   * @param id The entity's unique identifier
   */
  public abstract get(id: any): ODataGetOperation<T>

  /**
   * Executes an OData Post Operation
   * @param entity the entity to be posted
   * @returns an awaitable promise with the created content
   */

  public abstract async post(entity: T): Promise<T>

  /**
   * Executes an OData Patch Operation
   * @param id The entitie's unique identifier
   * @param entity's delta to be patched
   * @returns an awaitable promise
   */
  public abstract async patch(id: any, entity: T): Promise<T>

  /**
   * Executes an OData Put Operation
   * @param id The entitie's unique identifier
   * @param entity the entity to be putted
   * @returns an awaitable promise with the putted content
   */
  public abstract async put(id: any, entity: T): Promise<T>

  /**
   * Executes an OData Delete Operation
   * @param id The entity's unique identifier
   * @returns an awaitable promise
   */
  public abstract async delete(id: any): Promise<any>

  /**
   * Executes a custom action on an OData entity
   * @param actionName The action's actionName
   * @param id The entity's unique identifier
   * @param ...args The other optional arguments
   * @returns An awaitable promise
   */
  protected abstract execCustomAction(actionName: string, id: any, ...args: any[]): Promise<any>
  /**
   * Executes a custom action on an OData entity collection
   * @param actionName The action's actionName
   * @param ...args The other optional arguments
   * @returns An awaitable promise
   */
  protected abstract execCustomCollectionAction(actionName: string, ...args: any[]): Promise<any>

  /**
   * Executes a custom function on an OData entity
   * @param actionName The action's actionName
   * @param id The entity's unique identifier
   * @param ...args The other optional arguments
   * @returns An awaitable promise
   */
  protected abstract execCustomFunction(fucntionName: string, id: any, ...args: any[]): Promise<any>
  /**
   * Executes a custom function on an OData entity collection
   * @param actionName The action's actionName
   * @param ...args The other optional arguments
   * @returns An awaitable promise
   */
  protected abstract execCustomCollectionFunction(fucntionName: string, ...args: any[]): Promise<any>

  /**
   * Creates an OData Query object
   * @param id The entitie's unique identifier
   * @param entity the entity to be posted
   * @returns an awaitable promise with the created content
   */
  public abstract query(): ODataQuery<T>

  protected getEntityUriSegment(entityKey: any): string {
    entityKey = entityKey.toString()
    if (!/^[0-9]*$/.test(entityKey)) {
      return `('${entityKey}')`
    }

    return `(${entityKey})`
  }
}
