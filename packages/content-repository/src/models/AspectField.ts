import { IAspectField } from "@furystack/content";
import { Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Aspect } from "./Aspect";
import { FieldType } from "./FieldType";

@Entity()
@Index(["Aspect", "FieldType"], { unique: true })
export class AspectField implements IAspectField {
    @PrimaryGeneratedColumn()
    public Id!: number;

    @ManyToOne(() => FieldType, (f) => f.AspectFields)
    public FieldType!: Promise<FieldType>;

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
    public Aspect!: Promise<Aspect>;
}
