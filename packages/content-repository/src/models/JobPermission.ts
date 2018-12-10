import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Content } from "./Content";

@Entity()
export class JobPermission {
    @PrimaryGeneratedColumn()
    public Id!: number;
    @ManyToOne(() => Content)
    public Identity!: Content;

    @ManyToOne(() => Content, (c) => c.JobPermissions)
    public Content!: Content;
    @Column({ type: "varchar"})
    public PermissionType!: "Read" | "Write" | "Complete" | "Reject";
    @Column()
    public JobName!: string;
}
