import { IRole, IRole as CoreRole } from "@furystack/core";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Role implements CoreRole, IRole {

    @PrimaryGeneratedColumn()
    public Id?: number;

    @Column({
        unique: true,
    })
    public Name!: string;

    @Column({ nullable: true })
    public DisplayName?: string;

    @Column()
    public Description?: string;

}
