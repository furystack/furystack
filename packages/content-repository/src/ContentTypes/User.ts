import { IPermission, IRole } from "@furystack/content";
import { ContentType } from "../Decorators/ContentType";
import { Field } from "../Decorators/Field";
import { Reference } from "../Decorators/Reference";
import { Role } from "./Role";

@ContentType({
    DisplayName: "User",
    Description: "Represents an User content",
    Category: "System",
})
export class User {
    @Field({
        Category: "Default",
        Description: "The unique name for the user",
        DefaultValue: "assd",
        DisplayName: "User Name",
        Index: 2,
        Unique: true,
        Aspects: {
            Create: {
                ReadOnly: false,
                Category: "Profile",
                Order: 1,
                Required: true,
                ControlName: "InputText",
            },
            List: {
                ReadOnly: true,
                Category: "Profile",
                Order: 1,
                Required: true,
                ControlName: "ShortText",
            }, Details: {
                ReadOnly: true,
                Category: "Profile",
                Order: 1,
                Required: true,
                ControlName: "ShortText",
            },
        },
    })
    public Username!: string;
    @Reference({
        AllowedTypes: [Role],
        Aspects: {
            Create: {
                ControlName: "RolePicker",
                ReadOnly: false,
                Required: false,
                Visible: true,
                Order: 1,
            },
            List: {
                ControlName: "RolePicker",
                ReadOnly: false,
                Required: false,
                Visible: true,
                Order: 1,
            },
            Details: {
                ControlName: "RoleList",
                ReadOnly: false,
                Required: false,
                Visible: true,
                Order: 1,
            },
        },
    })
    public Roles!: IRole[];
    public Permissions!: Promise<IPermission[]>;
    public Password!: string;
}
