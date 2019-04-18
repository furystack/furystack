// import { ODataContext } from './ODataContext'
import { ODataError } from './odata-error'
import { ODataGetOperation } from './odata-get-operation'
import { ODataQuery } from './odata-query'
import { ODataQueryResult } from './odata-query-result'
import { ODataServiceAbstract } from './odata-service-abstract'

/**
 * Abstract OData service class
 */
export abstract class OdataService<T> extends ODataServiceAbstract<T> {
  private defaultInit: RequestInit = {
    credentials: 'include',
  }

  /**
   * Creates an OData Get Operation object.
   * @param id The entity's unique identifier
   */
  public get(id: any): ODataGetOperation<T> {
    const entityUri = this.getUriForEntity(id)
    return new ODataGetOperation<T>(async queryString => {
      return await this.extractResponse<T>(entityUri + queryString)
    })
  }

  /**
   * Executes an OData Post Operation
   * @param entity the entity to be posted
   * @returns an awaitable promise with the created content
   */
  public async post(entity: T): Promise<T> {
    return await this.extractResponse<T>(this.entitySetUrl, {
      method: 'POST',
      body: JSON.stringify(entity),
    })
  }

  /**
   * Executes an OData Patch Operation
   * @param id The entitie's unique identifier
   * @param entity's delta to be patched
   * @returns an awaitable promise
   */
  public async patch(id: any, entity: any): Promise<any> {
    return await this.extractResponse(this.getUriForEntity(id), {
      method: 'PATCH',
      body: JSON.stringify(entity),
    })
  }

  /**
   * Executes an OData Put Operation
   * @param id The entitie's unique identifier
   * @param entity the entity to be putted
   * @returns an awaitable promise with the putted content
   */
  public async put(id: any, entity: T): Promise<T> {
    return await this.extractResponse<T>(this.getUriForEntity(id), {
      method: 'PUT',
      body: JSON.stringify(entity),
    })
  }

  /**
   * Executes an OData Delete Operation
   * @param id The entity's unique identifier
   * @returns an awaitable promise
   */
  public async delete(id: any): Promise<any> {
    return await this.extractResponse<T>(this.getUriForEntity(id), {
      method: 'DELETE',
    })
  }

  /**
   * Creates an OData Query object
   * @param id The entitie's unique identifier
   * @param entity the entity to be posted
   * @returns an awaitable promise with the created content
   */
  public query(): ODataQuery<T> {
    const evaluateQuery = async (queryString: string): Promise<ODataQueryResult<T>> => {
      const url = this.entitySetUrl + '/' + queryString
      return this.extractResponse<ODataQueryResult<T>>(url)
    }

    return new ODataQuery(evaluateQuery)
  }

  protected getUriForEntity(id: any): string {
    return this.entitySetUrl + this.getEntityUriSegment(id)
  }

  /**
   * Executes a custom action on an OData entity
   * @param actionName The action's actionName
   * @param id The entity's unique identifier
   * @param ...args The other optional arguments
   * @returns An awaitable promise
   */
  protected async execCustomAction<TReturns, TData = {}>(
    actionName: string,
    entityId: any,
    postData?: TData,
  ): Promise<TReturns> {
    return await this.extractResponse<TReturns>(this.getUriForEntity(entityId) + `/${actionName}`, {
      method: 'POST',
      body: JSON.stringify(postData),
    })
  }

  /**
   * Executes a custom action on an OData entity collection
   * @param actionName The action's actionName
   * @param ...args The other optional arguments
   * @returns An awaitable promise
   */
  protected async execCustomCollectionAction<TReturns, TData = {}>(
    actionName: string,
    postData?: TData,
  ): Promise<TReturns> {
    return await this.extractResponse<TReturns>(actionName, {
      method: 'POST',
      body: JSON.stringify(postData),
    })
  }

  /**
   * Executes a custom function on an OData entity
   * @param actionName The action's actionName
   * @param id The entity's unique identifier
   * @param ...args The other optional arguments
   * @returns An awaitable promise
   */
  protected async execCustomFunction<TReturns>(fucntionName: string, entityId: any): Promise<TReturns> {
    return await this.extractResponse<TReturns>(this.getUriForEntity(entityId) + `/${fucntionName}`)
  }

  /**
   * Executes a custom function on an OData entity collection
   * @param actionName The action's actionName
   * @param ...args The other optional arguments
   * @returns An awaitable promise
   */
  protected async execCustomCollectionFunction<TReturns>(functionName: string): Promise<TReturns> {
    return await this.extractResponse<TReturns>(functionName)
  }

  private async extractResponse<TResponse>(input: Request | string, init?: RequestInit): Promise<TResponse> {
    const response = await fetch(input, {
      ...this.defaultInit,
      ...init,
    })
    const body: TResponse = await response.json()
    if (response.status < 200 || response.status >= 300) {
      throw new ODataError(response)
    }
    return body
  }
}
