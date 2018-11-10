import { IRole } from "./Models/IRole";

export class SystemRoles {
    public static Visitors: IRole = {
        Name: "Visitor",
        DisplayName: "The user is a Visitor",
        Description: "Roles applied for non-authenticated users",
    };

    public static AuthenticatedUsers: IRole = {
        Name: "Authenticated",
        DisplayName: "Authenticated users",
        Description: "The user is logged in with a valid account",
    };

}
