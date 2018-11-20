import { IPermission } from "@furystack/content";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Content, ContentType, Job, JobType } from "./";
import { PermissionType } from "./PermissionType";

@Entity()
export class Permission implements IPermission {

    @PrimaryGeneratedColumn()
    public Id!: number;

    @Column()
    public IdentityType: "user" | "role" = "user";

    public get IdentityId(): number {
        return 0;
    }

    @ManyToOne(() => Content, (u) => u.Permissions)
    public User!: Promise<Content>;

    @ManyToOne(() => PermissionType)
    public PermissionType!: Promise<PermissionType>;

    @ManyToOne(() => Content, (c) => c.Permissions, {
        nullable: true,
    })
    public Content!: Promise<Content>;

    @ManyToOne(() => Job, (j) => j.Permissions, {
        nullable: true,
    })
    public Job!: Promise<Job>;

    @ManyToOne(() => JobType, (j) => j.Permissions, {
        nullable: true,
    })
    public JobType!: Promise<JobType>;

    @ManyToOne(() => ContentType, (c) => c.Permissions, {
        nullable: true,
    })
    public ContentType!: Promise<ContentType>;

}
