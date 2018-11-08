import { IJob } from "@furystack/content";
import { Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Content } from "./Content";
import { Permission } from "./Permission";
import { View } from "./View";

@Entity()
export class Job implements IJob {
    @PrimaryGeneratedColumn()
    public Id!: number;

    @Column()
    public Name!: string;
    @Column({ nullable: true })
    public DisplayName!: string;

    @Column({ nullable: true })
    public Description!: string;

    @Column()
    public Completed!: boolean;

    @ManyToOne(() => Content, (c) => c.Jobs)
    public Content!: Content;

    @ManyToMany(() => Job)
    @JoinTable()
    public Prerequisites!: Job[];

    @OneToOne(() => View)
    public View!: View;

    @OneToMany(() => Permission, (p) => p.Job)
    public Permissions!: Permission[];
}
