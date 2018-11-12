import { IViewReference } from "@furystack/content";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Reference } from "./Reference";
import { ReferenceType } from "./ReferenceType";
import { View } from "./View";

@Entity()
export class ViewReference implements IViewReference {
    @PrimaryGeneratedColumn()
    public Id!: number;

    @ManyToOne(() => Reference)
    public ReferenceType!: ReferenceType;

    @Column()
    public Order!: number;

    @Column()
    public Category!: string;
    @Column()
    public ReadOnly!: boolean;

    @Column()
    public ControlName!: string;

    @ManyToOne(() => View, (v) => v.ViewReferences)
    public View!: View;
    @Column()
    public Required!: boolean;
}
