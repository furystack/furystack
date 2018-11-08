import { IReference } from "@furystack/content";
import { Entity, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Content } from "./Content";
import { ReferenceType } from "./ReferenceType";

@Entity()
export class Reference implements IReference {
    @PrimaryGeneratedColumn()
    public Id!: number;

    @ManyToOne(() => ReferenceType)
    public Type!: ReferenceType;

    @ManyToOne(() => Content, (c) => c.References)
    public Content!: Content;

    @ManyToMany(() => Content)
    @JoinTable()
    public References!: Content[];

}
