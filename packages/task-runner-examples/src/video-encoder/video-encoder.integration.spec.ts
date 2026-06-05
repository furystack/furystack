import { describe, expect, it } from 'vitest'
import { WebSocket as NodeWebSocket } from 'ws'
import { TaskRunnerClient } from '@furystack/task-runner-client'
import { makeFakeVideoBytes } from './codec.js'
import { startVideoEncoderServer } from './bootstrap.js'
import type { ProcessUploadPayload, ProcessUploadResult } from './types.js'
import type { Task, TaskStatus, TaskTreeNode } from '@furystack/task-runner'

const TERMINAL: ReadonlySet<TaskStatus> = new Set(['succeeded', 'failed', 'cancelled'])
const ACTIVE: ReadonlySet<TaskStatus> = new Set(['pending', 'claimed', 'running', 'waiting', 'cancelling'])

const makeClient = (rootUrl: string, wsUrl: string): TaskRunnerClient =>
  new TaskRunnerClient({
    rootUrl,
    wsUrl,
    createWebSocket: (url) => new NodeWebSocket(url) as unknown as WebSocket,
  })

const submitUpload = (client: TaskRunnerClient): Promise<Task> =>
  client.submitTask<ProcessUploadPayload>({
    type: 'process-upload',
    handlerVersion: 1,
    payload: { sourceKey: '', profiles: ['480p', '720p', '1080p'] },
    uploads: { source: { body: makeFakeVideoBytes('spec-upload'), contentType: 'video/mp4' } },
    resolvePayload: ({ payload, uploadedKeys }) => ({ ...payload, sourceKey: uploadedKeys.source }),
  })

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

/** Drafts + uploads the source but does not start the task, so a subscription can be attached first. */
const draftUpload = async (client: TaskRunnerClient): Promise<{ taskId: string; sourceKey: string }> => {
  const draft = await client.draftTask<ProcessUploadPayload>({
    type: 'process-upload',
    handlerVersion: 1,
    payload: { sourceKey: '', profiles: ['480p', '720p', '1080p'] },
    uploads: { source: { contentType: 'video/mp4' } },
  })
  const ticket = draft.uploads.source
  await client.uploadBlob(ticket, makeFakeVideoBytes('spec-upload'), 'video/mp4')
  return { taskId: draft.task.id, sourceKey: ticket.key }
}

const waitFor = async (
  client: TaskRunnerClient,
  taskId: string,
  predicate: (task: Task) => boolean,
  timeoutMs = 30_000,
): Promise<Task> => {
  const deadline = Date.now() + timeoutMs
  for (;;) {
    const task = await client.getTask(taskId)
    if (task && predicate(task)) return task
    if (Date.now() > deadline) throw new Error(`Timed out waiting for task ${taskId} (last status: ${task?.status})`)
    await sleep(25)
  }
}

const flattenTree = (node: TaskTreeNode): Task[] => [node.task, ...node.children.flatMap(flattenTree)]

describe('video-encoder showcase — integration', () => {
  it('runs the full process-upload DAG to success with fan-in and live progress', async () => {
    await using server = await startVideoEncoderServer()
    using client = makeClient(server.rootUrl, server.wsUrl)

    const { taskId, sourceKey } = await draftUpload(client)

    const progressPercents: number[] = []
    using live = client.subscribeProgress(taskId)
    live.state.subscribe((state) => {
      if (state.status === 'subscribed' && state.task.progress) progressPercents.push(state.task.progress.percent)
    })
    // Wait for the WS subscription to be live before dispatching, so the
    // hot-lane progress stream is observed from the first emit.
    await new Promise<void>((resolve, reject) => {
      if (live.state.getValue().status === 'subscribed') {
        resolve()
        return
      }
      const timer = setTimeout(() => reject(new Error('subscription did not become live')), 5_000)
      const sub = live.state.subscribe((state) => {
        if (state.status === 'subscribed') {
          clearTimeout(timer)
          sub[Symbol.dispose]()
          resolve()
        }
      })
    })

    await client.startTask<ProcessUploadPayload>(taskId, { sourceKey, profiles: ['480p', '720p', '1080p'] })

    const submitted = { id: taskId }
    const terminal = await waitFor(client, submitted.id, (t) => TERMINAL.has(t.status))
    expect(terminal.status).toBe('succeeded')

    const result = terminal.result as ProcessUploadResult
    expect(result.manifestBlob.key).toContain('manifest.m3u8')
    expect(result.thumbnailBlob.key).toContain('thumbnail.jpg')
    expect(terminal.producedBlobs).toHaveLength(2)

    const tree = await client.getTaskTree(submitted.id)
    const all = flattenTree(tree)
    const typeCounts = all.reduce<Record<string, number>>((acc, t) => {
      acc[t.type] = (acc[t.type] ?? 0) + 1
      return acc
    }, {})
    expect(typeCounts['process-upload']).toBe(1)
    expect(typeCounts['video-encode-h264']).toBe(3)
    expect(typeCounts.thumbnail).toBe(1)
    expect(typeCounts['video-package']).toBe(1)
    expect(typeCounts['video-mux']).toBe(3)
    expect(typeCounts['video-encode-chunk']).toBeGreaterThanOrEqual(6)
    expect(all.every((t) => t.status === 'succeeded')).toBe(true)

    expect(progressPercents.length).toBeGreaterThan(0)

    const download = await fetch(`${server.rootUrl}/${submitted.id}/download`)
    expect(download.ok).toBe(true)
    const bytes = new Uint8Array(await download.arrayBuffer())
    expect(bytes.byteLength).toBeGreaterThan(0)
  })

  it('cancels mid-run and cascades cancellation to descendants', async () => {
    await using server = await startVideoEncoderServer()
    using client = makeClient(server.rootUrl, server.wsUrl)

    const submitted = await submitUpload(client)

    await waitFor(client, submitted.id, (t) => t.status === 'running' || t.status === 'waiting')
    await waitFor(client, submitted.id, (t) => t.childTaskIds.length > 0)

    await client.cancelTask(submitted.id, 'user-abort')

    const terminal = await waitFor(client, submitted.id, (t) => TERMINAL.has(t.status))
    expect(terminal.status).toBe('cancelled')

    const all = flattenTree(await client.getTaskTree(submitted.id))
    expect(all.every((t) => !ACTIVE.has(t.status))).toBe(true)
    expect(all.some((t) => t.status === 'cancelled')).toBe(true)
  })
})
