import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm'
import { Content } from './Content'
import { ContentTypePermission } from './ContentTypePermissions'
import { IAspect } from './IAspect'
import { IJob } from './IJob'
import { IReferenceType } from './IReferenceType'
import { IValueType } from './IValueType'
import { JobTypePermission } from './JobTypePermission'

/**
 * Represents a Content Type instance
 */
@Entity()
export class ContentType<T = {}> {
  @PrimaryColumn()
  public name!: string

  @PrimaryColumn()
  public displayName?: string

  @Column({ nullable: true })
  public description?: string
  @Column({ nullable: true })
  public category?: string
  @Column({ nullable: true, type: 'simple-json' })
  public fields?: {
    [K: string]: IValueType | IReferenceType
  }
  @Column({ nullable: true, type: 'simple-json' })
  public aspects?: {
    [K: string]: IAspect<T>
  }
  @Column({ nullable: true, type: 'simple-json' })
  public jobs?: {
    [K: string]: IJob
  }

  @OneToMany(() => Content, c => c.contentTypeRef)
  public contentInstances?: Content[]

  @OneToMany(() => ContentTypePermission, ctp => ctp.contentType, { eager: true, cascade: true })
  public permissions!: ContentTypePermission[]

  @OneToMany(() => JobTypePermission, jtp => jtp.contentType, { eager: true, cascade: true })
  public jobTypePermissions!: JobTypePermission[]
}
