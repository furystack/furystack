import { IRole } from "./Models/IRole";

export class SystemRoles {
    public static Visitors: IRole = {
        Id: 1,
        Name: "The user is a Visitor",
        Description: "Roles applied for non-authenticated users",
    };

    public static AuthenticatedUsers: IRole = {
        Id: 2,
        Name: "Authenticated users",
        Description: "The user is logged in with a valid account",
    };

}
