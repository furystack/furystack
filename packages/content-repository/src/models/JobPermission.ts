import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Content } from './Content'

/**
 * Represents a job type permission
 */
@Entity()
export class JobPermission {
  @PrimaryGeneratedColumn()
  public Id!: number
  @ManyToOne(() => Content)
  public Identity!: Content

  @ManyToOne(() => Content, c => c.JobPermissions)
  public Content!: Content
  @Column({ type: 'varchar' })
  public Type!: 'Read' | 'Write' | 'Complete' | 'Reject'
  @Column()
  public JobName!: string
}
