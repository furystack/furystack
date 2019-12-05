import { ServiceModel } from './service'

/**
 * Configuration Root Type
 */
export interface Config {
  $schema: string
  /**
   * Absolute paths of the specific directories
   */
  directories: {
    /**
     * Will be used as the root of your cloned services
     */
    output: string

    /**
     * You can place input data, DB dumps, etc... in this folder
     */
    input: string
  }
  /**
   * List of service definitions
   */
  services: ServiceModel[]
}
