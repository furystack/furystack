/**
 * Clones a specified GIT repository into
 */
export interface GitClone {
  type: 'GitClone'
  /**
   * The full repository URL (https or ssh)
   */
  repository: string
  /**
   * Optional branch
   */
  branch?: string
  /**
   * What should happen if the cloned repository already exists?
   */
  onExists?: 'fail' | 'pull' | 'stash-and-pull' | 'ignore'
}

/**
 * Installs a Docker image
 */
export interface DockerInstall {
  type: 'DockerInstall'
  /**
   * The name (and version) of the Docker image (e.g.: 'nginx:latest')
   */
  imageName: string
  /**
   * An optional list of port mappings
   */
  portMappings?: Array<{ source: number; destination: number; type: 'TCP' | 'UDP' }>
  /**
   * An optional list of volume mappings
   */
  volumeMappings?: Array<{ source: string; destination: string }>
}

/**
 * Restores a MongoDB Database using 'mongorestore'
 */
export interface MongoRestore {
  type: 'MongoRestore'
  /**
   * The Database name
   */
  dbName: string
  /**
   * Relative (to the input directory) path to the dump folder
   */
  dumpPath: string
  /**
   * Drops each collection before import
   */
  drop?: boolean
  /**
   * An optional mongodb uri string (e.g. mongodb://localhost:123456)
   */
  uri?: string
}

/**
 * Executes an NPM Install command
 */
export interface NpmInstall {
  type: 'NpmInstall'
  /**
   * Optional relative (to the service root) path where the install should be triggered
   */
  path?: string
}

/**
 * Executes an NPM script (e.g. 'npm run build')
 */
export interface NpmScript {
  type: 'NpmScript'
  /**
   * Relative (to the service root) path where the script should be started
   */
  path?: string
  /**
   * The script name (e.g. 'build' in the case of 'npm run build')
   */
  scriptName: string
}

/**
 * Adds a service to NPM
 */
export interface AddToPm2 {
  type: 'AddToPm2'
  /**
   * The display name in PM2
   */
  displayName: string
  /**
   * The script file
   */
  script: string
}

/**
 * Install dependencies with Bower
 */
export interface BowerInstall {
  type: 'BowerInstall'
  /**
   * Optional path (relative to the service root)
   */
  path?: string
}

/**
 * Downloads a file from a specific location
 */
export interface DownloadInputFile {
  type: 'DownloadInputFile'
  /**
   * A full URL to download from
   */
  url: string
  /**
   * The destination path and file name (relative to the INPUT root)
   */
  destination: string
}

/**
 * Executes a Docker Compose UP command
 */
export interface DockerComposeUp {
  type: 'DockerComposeUp'
  /**
   * The Compose file path and name (relative to the INPUT root directory)
   */
  composeFile: string
}

/**
 * Executes a custom Docker command
 */
export interface DockerCommand {
  type: 'DockerCommand'
  /**
   * The command itself (e.g.: 'cp alma.zip')
   */
  command: string
}

export type InstallStep =
  | GitClone
  | MongoRestore
  | DockerInstall
  | AddToPm2
  | NpmInstall
  | NpmScript
  | BowerInstall
  | DownloadInputFile
  | DockerComposeUp
  | DockerCommand
