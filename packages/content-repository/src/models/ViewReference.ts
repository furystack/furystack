import { IViewReference } from "@furystack/content";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Reference } from "./Reference";
import { View } from "./View";

@Entity()
export class ViewReference implements IViewReference {
    @PrimaryGeneratedColumn()
    public Id!: number;

    @ManyToOne(() => Reference)
    public Reference!: Reference;

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
}
