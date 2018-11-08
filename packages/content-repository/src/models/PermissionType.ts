import { IPermissionType } from "@furystack/content";
import { IPermissionType as CorePermissionType } from "@furystack/core";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class PermissionType implements CorePermissionType, IPermissionType {

    @PrimaryGeneratedColumn()
    public Id!: number;

    @Column({
        unique: true,
    })
    public Name!: string;

    @Column({ nullable: true })
    public DisplayName!: string;

    @Column()
    public Description!: string;

    @Column()
    public Category!: string;

}
