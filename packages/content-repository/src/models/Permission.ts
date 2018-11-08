import { IPermission } from "@furystack/content";
import { IAccessControlItem } from "@furystack/core";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Content, ContentType, Job, JobType } from "./";
import { PermissionType } from "./PermissionType";

@Entity()
export class Permission implements IAccessControlItem, IPermission {

    @PrimaryGeneratedColumn()
    public Id!: number;

    @Column()
    public IdentityType: "user" | "role" = "user";

    public get IdentityId(): number {
        return this.User.Id;
    }

    @ManyToOne(() => Content, (u) => u.Permissions)
    public User!: Content;

    @ManyToOne(() => PermissionType)
    public PermissionType!: PermissionType;

    @ManyToOne(() => Content, (c) => c.Permissions, {
        nullable: true,
    })
    public Content!: Content;

    @ManyToOne(() => Job, (j) => j.Permissions, {
        nullable: true,
    })
    public Job!: Job;

    @ManyToOne(() => JobType, (j) => j.Permissions, {
        nullable: true,
    })
    public JobType!: JobType;

    @ManyToOne(() => ContentType, (c) => c.Permissions, {
        nullable: true,
    })
    public ContentType!: ContentType;

}
