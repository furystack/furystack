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
    @Field({
        Unique: true,
        Visible: {
            Create: {
                ReadOnly: true,
                Category: "Profile",
                Order: 1,
                Required: true,
                Visible: true,
                ControlName: "UserNameField",
            },
        },
    })

    public Username!: string;
    @Reference({
        AllowedTypes: [Role],
    })
    public Roles!: IRole[];
    public Permissions!: IPermission[];
    public Password!: string;
}
