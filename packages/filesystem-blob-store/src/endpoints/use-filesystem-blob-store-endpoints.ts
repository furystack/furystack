import type { Injector } from '@furystack/inject'
import { HttpServerPoolToken, type ServerApi } from '@furystack/rest-service'
import { buildFileSystemBlobStoreServerApi, type FileSystemBlobStoreServerApiOptions } from './build-blob-server-api.js'

/**
 * Options accepted by {@link useFileSystemBlobStoreEndpoints}.
 */
export type UseFileSystemBlobStoreEndpointsOptions = FileSystemBlobStoreServerApiOptions & {
  injector: Injector
  /** Hostname for the HTTP server pool record. Defaults to `'localhost'`. */
  hostName?: string
  /** Port the API should listen on. */
  port: number
}

/**
 * Acquires (or reuses) a pooled HTTP server for `port`/`hostName` and
 * attaches a {@link ServerApi} that mounts the filesystem blob-store
 * upload/download endpoints.
 *
 * Returns the registered {@link ServerApi} so callers can later remove
 * it from the pool record manually if needed.
 */
export const useFileSystemBlobStoreEndpoints = async (
  options: UseFileSystemBlobStoreEndpointsOptions,
): Promise<ServerApi> => {
  const { injector, hostName, port, ...rest } = options
  const pool = injector.get(HttpServerPoolToken)
  const record = await pool.acquire({ port, hostName })
  const serverApi = buildFileSystemBlobStoreServerApi(rest)
  record.apis.push(serverApi)
  return serverApi
}
