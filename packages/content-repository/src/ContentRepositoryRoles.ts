import { IRole } from "@furystack/core";

// keep in sync with client
export class ContentRepositoryRoles {
    // Get metadata from API Endpoints
    public static GetMetadata: IRole = {
        Name: "GetMetadata",
        DisplayName: "Get Metadata",
        Description: "Returns metadata from the API Endpoints",
    };

    // Get details about the system usage (free space, cpu / mem. usage, etc...)
    public static GetSystemDetails: IRole = {
        Name: "SystemDetails",
        DisplayName: "Get system details",
        Description: "Retrieve detailed info about the hosting system and environment",
    };

    // Wake up devices
    public static WakeOnLan: IRole = {
        Name: "Wake On Lan",
        DisplayName: "Wake On Lan",
        Description: "Can awake devices remotely",
    };

    // Create / edit / disable users
    public static ManageUsers: IRole = {
        Name: "ManageUsers",
        DisplayName: "Manage users",
        Description: "Permissions for user management",
    };

    // Create / edit / disable groups
    public static ManageRoles: IRole = {
        Name: "ManageRoles",
        DisplayName: "Manage Roles",
        Description: "Can assign an unassign roles to users",
    };
    public static ManageContentTypes: IRole = {
        Name: "ManageContentTypes",
        DisplayName: "Manage content types",
        Description: "Allow the editing of content types, views and jobs",
    };

    public static Console: IRole = {
        Name: "SystemConsole",
        DisplayName: "Access to the System Console",
        Description: "Allow the user to access the system console",
    };

    public static LowLevelData: IRole = {
        Name: "LowLevelDataAccess",
        DisplayName: "Low Level Data Access",
        Description: "Allow the user to access the low level data storage",
    };
}
