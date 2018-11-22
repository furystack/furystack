import { Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Content } from "./Content";

@Entity()
export class Permission {
    @PrimaryGeneratedColumn()
    public Id!: number;
    @ManyToOne(() => Content)
    public User!: string;
    @ManyToOne(() => Content)
    public Content!: string;
    public PermissionType!: string;
}
