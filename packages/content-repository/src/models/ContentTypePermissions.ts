import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Content } from './Content'
import { ContentType } from './ContentType'

/**
 * Represents a permission that is related to a content type
 */
@Entity()
export class ContentTypePermission {
  @PrimaryGeneratedColumn()
  public Id!: number
  @ManyToOne(() => Content)
  public Identity!: Content

  @ManyToOne(() => ContentType, c => c.Permissions)
  public ContentType!: ContentType

  @Column({ type: 'varchar' })
  public Type!: 'Read' | 'Write' | 'ModifyJobs' | 'Delete' | 'Search' | 'Create'
}
