import { IField } from "@furystack/content";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Content } from "./Content";
import { FieldType } from "./FieldType";

@Entity()
export class Field implements IField {
    @PrimaryGeneratedColumn()
    public Id!: number;
    @Column()
    public Value!: string;

    @ManyToOne(() => FieldType)
    public Type!: FieldType;

    @ManyToOne(() => Content, (c) => c.Fields)
    public Content!: Content;
}
