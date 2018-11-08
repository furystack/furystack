import { IReferenceType } from "@furystack/content";
import { Column, Entity, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { ContentType } from "./ContentType";

@Entity()
export class ReferenceType implements IReferenceType {
    @PrimaryGeneratedColumn()
    public Id!: number;
    @Column()
    public Name!: string;
    @Column({ nullable: true })
    public DisplayName!: string;
    @Column({ nullable: true })
    public Description!: string;

    @ManyToOne(() => ContentType)
    public ContentType!: ContentType;

    @ManyToMany(() => ContentType)
    @JoinTable()
    public AllowedTypes!: ContentType[];

}
