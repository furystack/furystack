import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Content } from './Content'

/**
 * Represents a Content permission
 */
@Entity()
export class ContentPermission {
  @PrimaryGeneratedColumn()
  public id!: number
  @ManyToOne(() => Content)
  public identity!: Content

  @ManyToOne(() => Content, c => c.permissions)
  public content!: Content
  @Column({ type: 'varchar' })
  public type!: 'Read' | 'Write' | 'ModifyJobs' | 'Delete'
}
