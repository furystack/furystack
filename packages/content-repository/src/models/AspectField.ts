import { IAspectField } from "@furystack/content";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Aspect } from "./Aspect";
import { FieldType } from "./FieldType";

@Entity()
export class AspectField implements IAspectField {
    @PrimaryGeneratedColumn()
    public Id!: number;

    @ManyToOne(() => FieldType, (f) => f.AspectFields)
    public FieldType!: FieldType;

    @Column()
    public Category!: string;

    @Column()
    public Order!: number;

    @Column()
    public ReadOnly!: boolean;

    @Column()
    public Required!: boolean;

    @Column()
    public ControlName!: string;

    @ManyToOne(() => Aspect, (v) => v.AspectFields)
    public Aspect!: Aspect;
}
