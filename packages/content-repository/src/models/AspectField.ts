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

    @Column({ nullable: true })
    public Category!: string;

    @Column({ nullable: true })
    public Order!: number;

    @Column({ default: true })
    public ReadOnly!: boolean;

    @Column({ default: false })
    public Required!: boolean;

    @Column({ nullable: true })
    public ControlName!: string;

    @ManyToOne(() => Aspect, (v) => v.AspectFields)
    public Aspect!: Aspect;
}
