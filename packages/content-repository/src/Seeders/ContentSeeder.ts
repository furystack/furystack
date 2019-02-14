import { IUser } from '@furystack/core'
import { HttpAuthenticationSettings } from '@furystack/http-api'
import { Constructable, Injectable } from '@furystack/inject'
import { Role, User } from '../ContentTypes'
import { ElevatedRepository } from '../ElevatedRepository'
import { SystemContent } from '../SystemContent'

/**
 * Class for populating a database with content that already has a prepopulated schema
 */
@Injectable()
export class ContentSeeder {
  /**
   *
   */
  constructor(
    private readonly repository: ElevatedRepository,
    private readonly systemContent: SystemContent,
    private readonly authSettings: HttpAuthenticationSettings<IUser>,
  ) {}

  public async ensureContentExists<T>(contentType: Constructable<T>, findOptions: Partial<T>, instance: T) {
    try {
      const existing = (await this.repository.find<T>({ data: findOptions, contentType, aspectName: 'Create' }))[0]
      if (!existing) {
        return await this.repository.create({ contentType, data: instance })
      }
      const reloaded = (await this.repository.load<T>({ contentType, ids: [existing.id], aspectName: 'Create' }))[0]
      return reloaded
    } catch (error) {
      throw error
    }
  }

  public async seedSystemContent() {
    await this.repository.activate()
    const visitorRole = await this.ensureContentExists(
      Role,
      { name: 'Visitor' },
      {
        name: 'Visitor',
        displayName: 'Visitor Role',
        description: 'The user is not authenticated',
      },
    )

    const authenticatedRole = await this.ensureContentExists(
      Role,
      { name: 'Authenticated' },
      {
        name: 'Authenticated',
        description: 'The user is authenticated',
        displayName: 'Authenticated',
      },
    )

    const adminRole = await this.ensureContentExists(
      Role,
      { name: 'Admin' },
      {
        name: 'Admin',
        displayName: 'Administrator',
        description: 'The user is a global administrator',
      },
    )

    const visitorUser = await this.ensureContentExists(
      User,
      { username: 'Visitor' },
      {
        username: 'Visitor',
        password: this.authSettings.hashMethod('Visitor'),
        roles: [this.systemContent.visitorRole],
      },
    )
    const adminUser = await this.ensureContentExists(
      User,
      { username: 'Administrator' },
      {
        username: 'Administrator',
        password: this.authSettings.hashMethod('admin'),
        roles: [this.systemContent.authenticatedRole, this.systemContent.adminRole],
      },
    )

    this.systemContent.adminRole = adminRole
    this.systemContent.authenticatedRole = authenticatedRole
    this.systemContent.visitorRole = visitorRole
    this.systemContent.visitorUser = visitorUser
    this.systemContent.adminUser = adminUser
  }
}
