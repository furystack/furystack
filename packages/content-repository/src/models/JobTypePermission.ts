import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Content } from './Content'
import { ContentType } from './ContentType'

/**
 * Represents a job type permission
 */
@Entity()
export class JobTypePermission {
  @PrimaryGeneratedColumn()
  public Id!: number
  @ManyToOne(() => Content)
  public Identity!: Content

  @ManyToOne(() => ContentType, c => c.JobTypePermissions)
  public ContentType!: ContentType
  @Column({ type: 'varchar' })
  public Type!: 'Read' | 'Write' | 'Complete' | 'Reject'
  @Column()
  public JobName!: string
}
