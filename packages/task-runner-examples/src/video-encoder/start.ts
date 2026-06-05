import { realpathSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { WebSocket as NodeWebSocket } from 'ws'
import { TaskRunnerClient } from '@furystack/task-runner-client'
import { makeFakeVideoBytes } from './codec.js'
import { startVideoEncoderServer } from './bootstrap.js'
import type { ProcessUploadPayload, ProcessUploadResult } from './types.js'
import type { Task } from '@furystack/task-runner'

/**
 * Runs the end-to-end showcase: boots the server, uploads a fake video,
 * submits a `process-upload` task, streams progress over WS, then
 * downloads the produced manifest. Invoke with `yarn workspace
 * @furystack/task-runner-examples start`.
 */
const main = async (): Promise<void> => {
  await using server = await startVideoEncoderServer()
  using client = new TaskRunnerClient({
    rootUrl: server.rootUrl,
    wsUrl: server.wsUrl,
    createWebSocket: (url) => new NodeWebSocket(url) as unknown as WebSocket,
  })

  console.info(`Showcase server listening on http://localhost:${server.port}`)

  const task = await client.submitTask<ProcessUploadPayload>({
    type: 'process-upload',
    handlerVersion: 1,
    payload: { sourceKey: '', profiles: ['480p', '720p', '1080p'] },
    uploads: { source: { body: makeFakeVideoBytes('demo-upload'), contentType: 'video/mp4' } },
    resolvePayload: ({ payload, uploadedKeys }) => ({ ...payload, sourceKey: uploadedKeys.source }),
  })
  console.info(`Submitted process-upload task ${task.id}`)

  using live = client.subscribeProgress(task.id)
  const terminal = await new Promise<Task>((resolve) => {
    const subscription = live.state.subscribe((state) => {
      if (state.status !== 'subscribed') return
      const { task: row } = state
      if (row.progress) console.info(`  progress ${row.status}: ${row.progress.percent}%`)
      if (row.status === 'succeeded' || row.status === 'failed' || row.status === 'cancelled') {
        subscription[Symbol.dispose]()
        resolve(row)
      }
    })
  })

  console.info(`Task ${terminal.id} finished: ${terminal.status}`)
  const result = terminal.result as ProcessUploadResult | undefined
  if (result) console.info(`  manifest: ${result.manifestBlob.key}, thumbnail: ${result.thumbnailBlob.key}`)

  const download = await fetch(`${server.rootUrl}/${terminal.id}/download`)
  const bytes = new Uint8Array(await download.arrayBuffer())
  console.info(`Downloaded manifest (${bytes.byteLength} bytes)`)
}

const isDirectRun = (): boolean => {
  const entry = process.argv[1]
  if (!entry) return false
  try {
    return realpathSync(entry) === fileURLToPath(import.meta.url)
  } catch {
    return false
  }
}

if (isDirectRun()) {
  main().catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
}
