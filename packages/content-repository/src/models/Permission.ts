import { Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Content } from "./Content";

@Entity()
export class Permission {
    @PrimaryGeneratedColumn()
    public Id!: number;
    @ManyToOne(() => Content)
    public User!: Content;
    @ManyToOne(() => Content)
    public Content!: Content;
    public PermissionType!: string;
}
