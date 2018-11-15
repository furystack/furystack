import { IAspectReference } from "@furystack/content";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Aspect } from "./Aspect";
import { ReferenceType } from "./ReferenceType";

@Entity()
export class AspectReference implements IAspectReference {
    @PrimaryGeneratedColumn()
    public Id!: number;

    @ManyToOne(() => ReferenceType)
    public ReferenceType!: ReferenceType;

    @Column()
    public Order!: number;

    @Column({ nullable: true })
    public Category!: string;
    @Column()
    public ReadOnly!: boolean;

    @Column()
    public ControlName!: string;

    @ManyToOne(() => Aspect, (v) => v.AspectReferences)
    public Aspect!: Aspect;
    @Column()
    public Required!: boolean;
}
