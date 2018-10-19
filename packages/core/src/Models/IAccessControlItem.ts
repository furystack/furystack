import { IPermissionType } from "./IPermissionType";

export interface IAccessControlItem {
    IdentityType: "user" | "role";
    IdentityId: number;
    PermissionType: IPermissionType;
}
