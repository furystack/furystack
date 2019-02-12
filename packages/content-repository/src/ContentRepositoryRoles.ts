import { IRole } from '@furystack/core'

/**
 * keep in sync with client
 */
export class ContentRepositoryRoles {
  public static ManageContentTypes: IRole = {
    Name: 'ManageContentTypes',
    DisplayName: 'Manage content types',
    Description: 'Allow the editing of content types, aspects and jobs',
  }

  public static Console: IRole = {
    Name: 'SystemConsole',
    DisplayName: 'Access to the System Console',
    Description: 'Allow the user to access the system console',
  }

  public static LowLevelData: IRole = {
    Name: 'LowLevelDataAccess',
    DisplayName: 'Low Level Data Access',
    Description: 'Allow the user to access the low level data storage',
  }
}
