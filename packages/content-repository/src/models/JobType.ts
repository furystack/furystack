import { IJobType } from "@furystack/content";
import { Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { ContentType } from "./ContentType";
import { Permission } from "./Permission";
import { View } from "./View";

@Entity()
export class JobType implements IJobType {
    @PrimaryGeneratedColumn()
    public Id!: number;

    @Column()
    public Name!: string;

    @Column({ nullable: true })
    public DisplayName!: string;

    @Column({
        nullable: true,
    })
    public Description!: string;

    @Column({
        default: false,
    })
    public Completed!: boolean;

    @ManyToOne(() => ContentType, (c) => c.JobTypes)
    public ContentType!: ContentType;

    @ManyToMany(() => JobType)
    @JoinTable()
    public Prerequisites!: JobType[];

    @OneToOne(() => View)
    public View!: View;

    @OneToMany(() => Permission, (p) => p.JobType)
    public Permissions!: Permission[];
}
