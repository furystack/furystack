import { IRole } from '@furystack/core'

/**
 * keep in sync with client
 */
export class ContentRepositoryRoles {
  public static manageContentTypes: IRole = {
    name: 'ManageContentTypes',
    displayName: 'Manage content types',
    description: 'Allow the editing of content types, aspects and jobs',
  }

  public static console: IRole = {
    name: 'SystemConsole',
    displayName: 'Access to the System Console',
    description: 'Allow the user to access the system console',
  }

  public static lowLevelData: IRole = {
    name: 'LowLevelDataAccess',
    displayName: 'Low Level Data Access',
    description: 'Allow the user to access the low level data storage',
  }
}
