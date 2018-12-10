import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Content } from "./Content";

@Entity()
export class ContentPermission {
    @PrimaryGeneratedColumn()
    public Id!: number;
    @ManyToOne(() => Content)
    public Identity!: Content;

    @ManyToOne(() => Content, (c) => c.Permissions)
    public Content!: Content;
    @Column({ type: "varchar"})
    public PermissionType!: "Read" | "Write" | "ModifyJobs" | "Delete";
}
