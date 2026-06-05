import { createReadStream, createWriteStream, type Stats } from 'node:fs'
import { mkdir, readdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises'
import { dirname, join, posix, relative, resolve, sep } from 'node:path'
import { Readable, Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import {
  BlobStoreError,
  validateBlobKey,
  type BlobDownloadUrlOptions,
  type BlobGetResult,
  type BlobListOptions,
  type BlobListResult,
  type BlobMetadata,
  type BlobPutInput,
  type BlobPutOptions,
  type BlobRef,
  type BlobStore,
  type BlobStoreCapabilities,
  type BlobUploadUrl,
  type BlobUploadUrlOptions,
} from '@furystack/blob-store'
import { MIN_SECRET_LENGTH, signToken } from './sign-token.js'

const CAPABILITIES: BlobStoreCapabilities = Object.freeze({
  /**
   * The filesystem adapter exposes server-proxy upload/download endpoints
   * that mimic the presigned-URL flow at the API layer, but the URL is
   * not transport-direct. The capability flag stays `false` so deployment
   * checks treat it as a local-only store.
   */
  presignedUrls: false,
  multipart: false,
  range: false,
  crossNodeAccessible: false,
  /** Effectively unbounded — limited by the host filesystem. */
  maxObjectBytes: Number.POSITIVE_INFINITY,
})

const META_SUFFIX = '.meta.json'

/**
 * On-disk metadata sidecar shape. Persisted next to every blob payload as
 * `<key>.meta.json` so `head` / `list` can return content-type + custom
 * metadata without parsing the payload itself.
 */
type StoredMetadata = {
  contentType?: string
  etag?: string
  customMetadata?: Record<string, string>
}

/**
 * Options accepted by {@link FileSystemBlobStore}.
 */
export type FileSystemBlobStoreOptions = {
  /** Absolute path under which all blobs (and metadata sidecars) are stored. */
  root: string
  /**
   * HMAC secret used to sign upload/download tokens served via the
   * `endpoints` subpath helper. Required at construction so misconfigured
   * deployments fail loudly. Must be at least {@link MIN_SECRET_LENGTH}
   * characters or bytes.
   */
  secret: string | Uint8Array
  /**
   * Adapter binding name. Defaults to `'filesystem'`. Set to a stable
   * string when the same injector binds multiple filesystem stores so
   * {@link BlobRef} entries stay distinguishable.
   */
  name?: string
  /**
   * Public base URL the signed token endpoints are mounted under (e.g.
   * `https://api.example.com/blobs`). Required only when callers will
   * use {@link FileSystemBlobStore.getDownloadUrl} /
   * {@link FileSystemBlobStore.getUploadUrl}.
   */
  publicUrlBase?: string
  /** Override `Date.now` for deterministic tests. */
  now?: () => number
}

/**
 * Filesystem-backed {@link BlobStore} adapter. Stores each blob at
 * `<root>/<key>` literally so `list(prefix)` walks naturally; persists
 * metadata in a sibling `.meta.json` sidecar.
 *
 * Cross-node use is **not** supported — pair only with single-pod
 * deployments. The boot-time capability cross-check in the task runner
 * refuses Redis/SQS queues alongside this adapter.
 */
export class FileSystemBlobStore implements BlobStore {
  public readonly capabilities: BlobStoreCapabilities = CAPABILITIES
  public readonly storeName: string

  readonly #root: string
  readonly #secret: string | Uint8Array
  readonly #publicUrlBase: string | undefined
  readonly #now: () => number
  #disposed = false

  constructor(options: FileSystemBlobStoreOptions) {
    if (!options.root || typeof options.root !== 'string') {
      throw new BlobStoreError('invalid-config', 'FileSystemBlobStore requires a non-empty `root` path')
    }
    const secretLength =
      typeof options.secret === 'string' ? options.secret.length : (options.secret as Uint8Array | undefined)?.length
    if (!secretLength || secretLength < MIN_SECRET_LENGTH) {
      throw new BlobStoreError(
        'invalid-config',
        `FileSystemBlobStore requires a \`secret\` of at least ${MIN_SECRET_LENGTH} characters/bytes`,
        { limit: MIN_SECRET_LENGTH, actual: secretLength ?? 0 },
      )
    }
    this.#root = resolve(options.root)
    this.#secret = options.secret
    this.#publicUrlBase = options.publicUrlBase
    this.#now = options.now ?? Date.now
    this.storeName = options.name ?? 'filesystem'
  }

  public async put(key: string, payload: BlobPutInput, options: BlobPutOptions = {}): Promise<BlobRef> {
    this.#ensureLive()
    validateBlobKey(key)
    this.#assertNoTraversal(key)
    const fullPath = this.#payloadPath(key)
    await mkdir(dirname(fullPath), { recursive: true })

    const tempPath = `${fullPath}.${this.#now()}.tmp`
    let contentLength = 0
    const counting = new Transform({
      transform(chunk: Buffer, _encoding, callback) {
        contentLength += chunk.byteLength
        callback(null, chunk)
      },
    })
    const inputStream = toNodeReadable(payload)
    try {
      await pipeline(inputStream, counting, createWriteStream(tempPath))
      if (options.contentLength !== undefined && options.contentLength !== contentLength) {
        await rm(tempPath, { force: true })
        throw new BlobStoreError(
          'invalid-config',
          `Declared contentLength ${options.contentLength} does not match payload size ${contentLength}`,
          { key, storeName: this.storeName, limit: options.contentLength, actual: contentLength },
        )
      }
      await rename(tempPath, fullPath)
    } catch (cause) {
      await rm(tempPath, { force: true }).catch(() => undefined)
      if (BlobStoreError.is(cause)) throw cause
      throw new BlobStoreError('io-error', `Failed to write blob ${key}`, {
        key,
        storeName: this.storeName,
        cause,
      })
    }

    const sidecar: StoredMetadata = {
      contentType: options.contentType,
      etag: undefined,
      customMetadata: options.metadata ? { ...options.metadata } : undefined,
    }
    await writeFile(this.#metaPath(key), JSON.stringify(sidecar), 'utf8').catch((cause: unknown) => {
      throw new BlobStoreError('io-error', `Failed to write metadata sidecar for ${key}`, {
        key,
        storeName: this.storeName,
        cause,
      })
    })

    return {
      storeName: this.storeName,
      key,
      contentType: options.contentType,
      contentLength,
    }
  }

  public async get(key: string): Promise<BlobGetResult> {
    this.#ensureLive()
    validateBlobKey(key)
    this.#assertNoTraversal(key)
    const fullPath = this.#payloadPath(key)
    let stats: Stats
    try {
      stats = await stat(fullPath)
    } catch (cause) {
      if ((cause as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new BlobStoreError('not-found', `Blob not found: ${key}`, { key, storeName: this.storeName })
      }
      throw new BlobStoreError('io-error', `Failed to read blob ${key}`, { key, storeName: this.storeName, cause })
    }
    const sidecar = await this.#readSidecar(key)
    const nodeStream = createReadStream(fullPath)
    const stream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>
    return {
      stream,
      contentType: sidecar?.contentType,
      contentLength: stats.size,
    }
  }

  public async head(key: string): Promise<BlobMetadata | undefined> {
    this.#ensureLive()
    validateBlobKey(key)
    this.#assertNoTraversal(key)
    const fullPath = this.#payloadPath(key)
    let stats: Stats
    try {
      stats = await stat(fullPath)
    } catch (cause) {
      if ((cause as NodeJS.ErrnoException).code === 'ENOENT') return undefined
      throw new BlobStoreError('io-error', `Failed to stat blob ${key}`, { key, storeName: this.storeName, cause })
    }
    const sidecar = await this.#readSidecar(key)
    return {
      key,
      contentType: sidecar?.contentType,
      contentLength: stats.size,
      lastModified: stats.mtime,
      customMetadata: sidecar?.customMetadata,
    }
  }

  public async delete(key: string): Promise<void> {
    this.#ensureLive()
    validateBlobKey(key)
    this.#assertNoTraversal(key)
    await Promise.all([rm(this.#payloadPath(key), { force: true }), rm(this.#metaPath(key), { force: true })])
  }

  public async list(prefix: string, options: BlobListOptions = {}): Promise<BlobListResult> {
    this.#ensureLive()
    if (typeof prefix !== 'string') {
      throw new BlobStoreError('invalid-config', 'Prefix must be a string')
    }
    const limit = options.limit ?? 100
    if (!Number.isInteger(limit) || limit <= 0) {
      throw new BlobStoreError('invalid-config', `Limit must be a positive integer, got ${String(options.limit)}`)
    }
    const allKeys = (await this.#walkKeys(this.#root)).filter((k) => k.startsWith(prefix)).sort()
    const startIndex = options.cursor ? allKeys.indexOf(options.cursor) : 0
    if (startIndex < 0) {
      throw new BlobStoreError('invalid-config', 'Cursor does not match any current key', { key: options.cursor })
    }
    const slice = allKeys.slice(startIndex, startIndex + limit)
    const items = await Promise.all(
      slice.map(async (k) => {
        const meta = await this.head(k)
        return meta
      }),
    )
    const nextIndex = startIndex + limit
    return {
      items: items.filter((item): item is BlobMetadata => item !== undefined),
      nextCursor: nextIndex < allKeys.length ? allKeys[nextIndex] : undefined,
    }
  }

  public async getDownloadUrl(key: string, options: BlobDownloadUrlOptions): Promise<string> {
    this.#ensureLive()
    validateBlobKey(key)
    this.#assertNoTraversal(key)
    if (!this.#publicUrlBase) {
      throw new BlobStoreError(
        'invalid-config',
        'FileSystemBlobStore.getDownloadUrl requires `publicUrlBase` to be set at construction',
        { storeName: this.storeName },
      )
    }
    const token = signToken(
      {
        k: key,
        o: 'download',
        e: Math.floor(this.#now() / 1000) + options.ttlSec,
        n: createNonce(),
      },
      this.#secret,
    )
    return `${stripTrailingSlash(this.#publicUrlBase)}/${encodeURIComponent(token)}`
  }

  public async getUploadUrl(key: string, options: BlobUploadUrlOptions): Promise<BlobUploadUrl> {
    this.#ensureLive()
    validateBlobKey(key)
    this.#assertNoTraversal(key)
    if (!this.#publicUrlBase) {
      throw new BlobStoreError(
        'invalid-config',
        'FileSystemBlobStore.getUploadUrl requires `publicUrlBase` to be set at construction',
        { storeName: this.storeName },
      )
    }
    const token = signToken(
      {
        k: key,
        o: 'upload',
        e: Math.floor(this.#now() / 1000) + options.ttlSec,
        c: options.contentType,
        m: options.maxBytes,
        n: createNonce(),
      },
      this.#secret,
    )
    return {
      url: `${stripTrailingSlash(this.#publicUrlBase)}/${encodeURIComponent(token)}`,
      method: 'PUT',
    }
  }

  public [Symbol.dispose](): void {
    this.#disposed = true
  }

  #payloadPath(key: string): string {
    return join(this.#root, ...key.split('/'))
  }

  #metaPath(key: string): string {
    return `${this.#payloadPath(key)}${META_SUFFIX}`
  }

  async #readSidecar(key: string): Promise<StoredMetadata | undefined> {
    try {
      const text = await readFile(this.#metaPath(key), 'utf8')
      return JSON.parse(text) as StoredMetadata
    } catch (cause) {
      if ((cause as NodeJS.ErrnoException).code === 'ENOENT') return undefined
      throw new BlobStoreError('io-error', `Failed to read metadata sidecar for ${key}`, {
        key,
        storeName: this.storeName,
        cause,
      })
    }
  }

  async #walkKeys(dir: string): Promise<string[]> {
    let entries: Array<{ name: string; isDirectory(): boolean; isFile(): boolean }>
    try {
      entries = await readdir(dir, { withFileTypes: true, encoding: 'utf8' })
    } catch (cause) {
      if ((cause as NodeJS.ErrnoException).code === 'ENOENT') return []
      throw new BlobStoreError('io-error', `Failed to list directory ${dir}`, { storeName: this.storeName, cause })
    }
    const out: string[] = []
    for (const entry of entries) {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) {
        out.push(...(await this.#walkKeys(full)))
      } else if (entry.isFile() && !entry.name.endsWith(META_SUFFIX)) {
        const rel = relative(this.#root, full)
        out.push(rel.split(sep).join(posix.sep))
      }
    }
    return out
  }

  #assertNoTraversal(key: string): void {
    const segments = key.split('/')
    for (const segment of segments) {
      if (segment === '..' || segment === '.' || segment.includes('\\')) {
        throw new BlobStoreError('invalid-key', 'Blob key contains forbidden path segments', {
          key,
          storeName: this.storeName,
        })
      }
    }
  }

  #ensureLive(): void {
    if (this.#disposed) {
      throw new BlobStoreError('io-error', 'FileSystemBlobStore has been disposed', { storeName: this.storeName })
    }
  }
}

const stripTrailingSlash = (input: string): string => (input.endsWith('/') ? input.slice(0, -1) : input)

const createNonce = (): string => Math.random().toString(36).slice(2, 10)

/**
 * Coerces any {@link BlobPutInput} variant into a Node `Readable`. The
 * filesystem adapter writes via `fs.pipeline`, which expects Node
 * streams, so converting up-front avoids the structural mismatch
 * between DOM `ReadableStream<Uint8Array>` and Node's
 * `node:stream/web.ReadableStream` under TypeScript 6's stricter BYOB
 * variance.
 */
const toNodeReadable = (input: BlobPutInput): Readable => {
  if (input instanceof Uint8Array) {
    return Readable.from(Buffer.from(input))
  }
  if (typeof (input as ReadableStream<Uint8Array>).getReader === 'function') {
    const reader = (input as ReadableStream<Uint8Array>).getReader()
    return new Readable({
      read() {
        reader.read().then(
          ({ done, value }) => {
            if (done) {
              this.push(null)
              return
            }
            this.push(Buffer.from(value))
          },
          (cause: unknown) => {
            this.destroy(cause as Error)
          },
        )
      },
    })
  }
  return Readable.from(input as NodeJS.ReadableStream)
}
