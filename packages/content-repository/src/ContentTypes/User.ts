import { IPermission, IRole } from "@furystack/content";
import { IUser } from "@furystack/core";
import { ILoginUser } from "@furystack/http-api";
import { ContentType } from "../Decorators/ContentType";
import { Field } from "../Decorators/Field";
import { Reference } from "../Decorators/Reference";
import { Role } from "./Role";

@ContentType({
    DisplayName: "User",
    Description: "Represents an User content",
    Category: "System",
})
export class User implements ILoginUser<IUser> {
    public Id!: number;
    @Field({
        Unique: true,
    })

    public Username!: string;
    @Reference({
        AllowedTypes: [Role],
    })
    public Roles!: IRole[];
    public Permissions!: IPermission[];
    public Password!: string;
}
