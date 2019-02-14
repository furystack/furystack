import { IApi, IPhysicalStore, IUser, LoggerCollection, UserContext } from '@furystack/core'
import { Constructable, Injectable, Injector } from '@furystack/inject'
import { Disposable } from '@sensenet/client-utils'
import { Brackets, createConnection, EntityManager, getConnectionManager, getManager, In } from 'typeorm'
import { AspectManager } from './AspectManager'
import { ContentRepositoryConfiguration } from './ContentRepositoryConfiguration'
import { DefaultAspects } from './DefaultAspects'
import * as Models from './models'
import { Content, ContentField, ISavedContent } from './models'
import { RoleManager } from './RoleManager'
import { SystemContent } from './SystemContent'

/**
 * Main entry point to work with content
 */
@Injectable()
export class Repository implements Disposable, IApi {
  public async activate() {
    await this.initConnection()
  }
  public async dispose() {
    /** */
  }
  public readonly dbEntities = Models

  public getManager() {
    return getManager(this.options.connection.name)
  }

  public async find<T>(options: {
    data: Partial<T>
    contentType?: Constructable<T>
    aspectName: string
    top?: number
    skip?: number
  }): Promise<Array<ISavedContent<T>>> {
    const currentUser = await this.userContext.getCurrentUser()
    let query = (this.getManager() as EntityManager)
      .createQueryBuilder(ContentField, 'ContentField')
      .where(
        new Brackets(qb => {
          for (const key of Object.keys(options.data)) {
            qb = qb.where(
              new Brackets(fieldBracket =>
                fieldBracket.where('ContentField.name = :name', { name: key }).andWhere('ContentField.value = :value', {
                  value: (options.data as any)[key] as string,
                }),
              ),
            )
          }
          return qb
        }),
      )
      .innerJoinAndSelect('ContentField.content', 'content')

    if (options.contentType) {
      query = query.innerJoin('content.contentTypeRef', 'contentType').andWhere('contentType.name = :contentTypeName', {
        contentTypeName: options.contentType.name,
      })
    }

    if (!this.roleManager.hasRole(currentUser, this.systemContent.adminRole)) {
      /** ToDo: add permission checks for content and / or type */
    }

    if (options.top) {
      query = query.take(options.top)
    }

    if (options.skip) {
      query = query.skip(options.skip)
    }

    const result = await query.groupBy('contentId').getMany()
    const contentIds = result.filter(c => c.content && c.content.id).map(c => c.content.id)
    return await this.load({ ids: contentIds, aspectName: options.aspectName })
  }

  public async create<T>(options: { contentType: Constructable<T>; data: T }): Promise<ISavedContent<T>> {
    const contentTypeName = options.contentType.name
    const currentUser = await this.userContext.getCurrentUser()
    return await this.getManager().transaction(async tr => {
      const contentType = await tr.findOneOrFail(this.options.models.ContentType, { where: { Name: contentTypeName } })
      if (!this.roleManager.hasRole(currentUser, this.systemContent.adminRole)) {
        if (
          !this.roleManager.hasPermissionForType({
            user: currentUser,
            contentType,
            permission: 'Create',
          })
        ) {
          throw Error(`No 'Create' permission for content type '${contentTypeName}'`)
        }
      }

      const c = tr.create(Content, {
        type: contentType,
        contentTypeRef: contentType,
      })

      const savedContent = await tr.save(c)
      const fields = Object.keys(options.data).map(field => {
        const fieldDef = contentType.fields && contentType.fields[field as keyof typeof contentType['fields']]
        if (fieldDef && fieldDef.type !== 'Value') {
          if (fieldDef.type === 'Reference') {
            const fieldValue = (options.data as any)[field] as ISavedContent<{}>
            ;(options.data as any)[field] = JSON.stringify(fieldValue.id)
          }
          if (fieldDef.type === 'ReferenceList') {
            const fieldValue = (options.data as any)[field] as Array<ISavedContent<{}>>
            ;(options.data as any)[field] = JSON.stringify(fieldValue.map(f => f.id))
          }
        }
        return tr.create(ContentField, {
          name: field,
          value: (options.data as any)[field],
          content: savedContent,
        }) as ContentField
      })
      const savedFields = await tr.save(fields)
      await tr
        .createQueryBuilder()
        .relation(Content, 'fields')
        .of(savedContent)
        .add(savedFields)
      const reloaded = await this.load<T>({
        contentType: options.contentType,
        ids: [savedContent.id],
        aspectName: DefaultAspects.Details,
        manager: tr,
      })
      return reloaded[0]
    })
  }

  public async load<T>(options: {
    contentType?: Constructable<T>
    ids: number[]
    aspectName: string
    manager?: EntityManager
  }): Promise<Array<ISavedContent<T>>> {
    const currentUser = await this.userContext.getCurrentUser()
    const isAdmin =
      currentUser.id === this.systemContent.adminUser.id ||
      !this.roleManager.hasRole(currentUser, this.systemContent.adminRole)

    const content = await (options.manager || this.getManager()).find(Content, {
      where: {
        Id: In(options.ids),
      },
      loadEagerRelations: true,
    })

    const filtered = await content.filterAsync(async c => {
      const contentPermission = await this.roleManager.hasPermissionForContent({
        user: currentUser,
        content: c,
        permission: 'Read',
      })
      const typePermission =
        (options.contentType &&
          (await this.roleManager.hasPermissionForType({
            user: currentUser,
            permission: 'Read',
            contentType: c.contentTypeRef,
          }))) ||
        false
      return isAdmin || contentPermission || typePermission
    })

    return await Promise.all(
      filtered.map(async c =>
        this.aspectManager.transformPlainContent<T>({
          content: c,
          aspect: this.aspectManager.getAspectOrFail(c, options.aspectName),
          loadRef: async ids => await this.load({ ids, aspectName: DefaultAspects.Expanded }),
        }),
      ),
    )
  }

  private async initConnection() {
    this.logger.verbose({
      scope: this.logScope,
      message: 'Initializing connection',
    })
    try {
      const modelArray = Object.values(this.options.models)

      const cm = getConnectionManager()
      if (this.options.connection.name && !cm.has(this.options.connection.name)) {
        await createConnection({
          ...this.options.connection,
          entities: modelArray,
        })
      }
    } catch (error) {
      this.logger.fatal({
        scope: this.logScope,
        message: 'Failed to initialize repository DB connection.',
        data: { options: this.options.connection, error },
      })
      throw error
    }
  }
  public readonly logScope = '@furystack/content-repository/ContentRepository'

  public async remove(...ids: number[]): Promise<void> {
    return await this.getManager().transaction(async tr => {
      await tr.delete(Content, { Id: In(ids) })
    })
  }

  public async update<T>(options: { id: number; change: Partial<T>; aspectName?: string }): Promise<ISavedContent<T>> {
    return await this.getManager().transaction(async tm => {
      const aspectName = options.aspectName || DefaultAspects.Edit
      const existingContent = await tm.findOne(Content, options.id, {
        loadEagerRelations: true,
      })

      const currentUser = await this.userContext.getCurrentUser()
      const isAdmin = await this.roleManager.hasRole(currentUser, this.systemContent.adminRole)

      if (!isAdmin) {
        const contentPermission =
          existingContent &&
          (await this.roleManager.hasPermissionForContent({
            user: currentUser,
            content: existingContent,
            permission: 'Write',
          }))
        const typePermission =
          existingContent &&
          (await this.roleManager.hasPermissionForType({
            user: currentUser,
            permission: 'Write',
            contentType: existingContent.contentTypeRef,
          }))
        if (!contentPermission && !typePermission) {
          throw Error(`No 'Write' permission for content :(`)
        }
      }

      if (!existingContent) {
        throw Error(`Content not found with id '${options.id}'`)
      }

      const aspect = this.aspectManager.getAspectOrFail(existingContent, aspectName)
      const validationResult = this.aspectManager.validate(existingContent, options.change, aspect)
      if (!validationResult.isValid) {
        throw Error(`Content update is not valid. Details: ${JSON.stringify(validationResult)}`)
      }
      for (const field of existingContent.fields) {
        const changeValue = options.change[field.name as keyof T]
        if (changeValue !== field.value) {
          field.value = (changeValue && changeValue.toString && changeValue.toString()) || (null as any)
          await tm.save(field)
        }
      }
      return (await this.load({
        ids: [existingContent.id],
        aspectName: DefaultAspects.Edit,
      }))[0] as ISavedContent<T>
    })
  }

  public getPhysicalStoreForType = <TM extends ISavedContent<any>>(contentType: Constructable<TM>) =>
    ({
      primaryKey: 'Id',
      logger: this.logger,
      add: data => this.create({ contentType, data }),
      count: () => this.getManager().count(contentType),
      dispose: () => undefined as any,
      update: async (id, change) => {
        await this.update({ id, change })
      },
      get: async key =>
        (await this.load({
          contentType,
          ids: [key],
          aspectName: DefaultAspects.List,
        }))[0],
      remove: async id => await this.remove(id),
      filter: async (data, aspectName = DefaultAspects.Details) => await this.find({ data, contentType, aspectName }),
    } as IPhysicalStore<TM>)

  public readonly options: ContentRepositoryConfiguration
  constructor(
    protected readonly logger: LoggerCollection,
    protected readonly aspectManager: AspectManager,
    protected readonly systemContent: SystemContent,
    protected readonly injector: Injector,
    protected readonly roleManager: RoleManager,
    protected readonly userContext: UserContext<ISavedContent<IUser>>,
  ) {
    this.options = this.injector.getInstance(ContentRepositoryConfiguration)
  }
}
