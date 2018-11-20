import { IField } from "@furystack/content";
import { Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Content } from "./Content";
import { FieldType } from "./FieldType";

@Entity()
@Index(["Content", "Type"], { unique: true })
export class Field implements IField {
    @PrimaryGeneratedColumn()
    public Id!: number;
    @Column()
    public Value!: string;

    @ManyToOne(() => FieldType)
    public Type!: Promise<FieldType>;

    @ManyToOne(() => Content, (c) => c.Fields)
    public Content!: Promise<Content>;
}
