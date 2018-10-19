import { IPermissionType } from "./Models/IPermissionType";

export class SystemPermissions {
    public static CanLogin: IPermissionType = {
        Id: 1,
        Name: "Can log in",
        Description: "The user is not logged in to the system and has access to the login actions",
    };

    public static CanLogout: IPermissionType = {
        Id: 2,
        Name: "Can log out",
        Description : "The user is logged in and has permission to the Logout action",
    };

    public static CanResetPassword: IPermissionType = {
        Id: 3,
        Name: "Can reset password",
        Description: "The user can reset a password",
    };

    public static CanManageExternalLogins: IPermissionType = {
        Id: 4,
        Name: "Can manage external logins",
        Description: "The user can connect / disconnect external accounts",
    };

    public static CanSetPermissions: IPermissionType = {
        Id: 5,
        Name: "Can set permissions",
        Description: "The user can set permissions",
    };

    public static CanRegisterWithExternalLoginProvider: IPermissionType = {
        Id: 5,
        Name: "Can register with external Login provider",
        Description: "A new user will be created during the first login with an external login provider",
    };

}

export enum IdentityClaims {
    IsVisitor = "IsVisitor",
    IsLoggedIn = "IsLoggedIn",
}
