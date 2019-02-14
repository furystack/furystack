import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Content } from './Content'
import { ContentType } from './ContentType'

/**
 * Represents a permission that is related to a content type
 */
@Entity()
export class ContentTypePermission {
  @PrimaryGeneratedColumn()
  public id!: number
  @ManyToOne(() => Content)
  public identity!: Content

  @ManyToOne(() => ContentType, c => c.permissions)
  public contentType!: ContentType

  @Column({ type: 'varchar' })
  public type!: 'Read' | 'Write' | 'ModifyJobs' | 'Delete' | 'Search' | 'Create'
}
