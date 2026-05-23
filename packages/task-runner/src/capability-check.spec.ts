import { describe, it, expect } from 'vitest'
import { assertCapabilities } from './capability-check.js'
import type { TaskRunnerCapabilities } from './task-runner.js'
import type { BlobStoreCapabilities } from '@furystack/blob-store'

const inProcessRunner: TaskRunnerCapabilities = {
  persistent: false,
  fleetCapEnforcement: false,
  delayedDispatch: true,
  maxPayloadBytes: Infinity,
}

const persistentRunner: TaskRunnerCapabilities = {
  persistent: true,
  fleetCapEnforcement: true,
  delayedDispatch: true,
  maxPayloadBytes: 1024 * 1024,
}

const memoryBlob: BlobStoreCapabilities = {
  presignedUrls: false,
  multipart: false,
  range: false,
  crossNodeAccessible: false,
  maxObjectBytes: Infinity,
}

const s3Blob: BlobStoreCapabilities = {
  presignedUrls: true,
  multipart: false,
  range: false,
  crossNodeAccessible: true,
  maxObjectBytes: 5 * 1024 * 1024 * 1024,
}

describe('assertCapabilities', () => {
  it('accepts in-process runner + in-memory blob + in-process bus', () => {
    expect(() =>
      assertCapabilities(inProcessRunner, memoryBlob, {
        persistent: false,
        replay: true,
        assignsSequence: true,
        crossNodeDelivery: false,
      }),
    ).not.toThrow()
  })

  it('accepts persistent runner + S3 blob + cross-node bus', () => {
    expect(() =>
      assertCapabilities(persistentRunner, s3Blob, {
        persistent: true,
        replay: true,
        assignsSequence: true,
        crossNodeDelivery: true,
      }),
    ).not.toThrow()
  })

  it('rejects persistent runner + non-cross-node blob', () => {
    expect(() =>
      assertCapabilities(persistentRunner, memoryBlob, {
        persistent: true,
        replay: true,
        assignsSequence: true,
        crossNodeDelivery: true,
      }),
    ).toThrow(/cross-node-accessible/i)
  })

  it('rejects persistent runner + in-process bus', () => {
    expect(() =>
      assertCapabilities(persistentRunner, s3Blob, {
        persistent: false,
        replay: true,
        assignsSequence: true,
        crossNodeDelivery: false,
      }),
    ).toThrow(/cross-node bus/i)
  })

  it('accepts in-process runner + memory blob + cross-node bus (heterogeneous OK)', () => {
    expect(() =>
      assertCapabilities(inProcessRunner, memoryBlob, {
        persistent: true,
        replay: true,
        assignsSequence: true,
        crossNodeDelivery: true,
      }),
    ).not.toThrow()
  })

  it('accepts persistent runner + S3 blob + persistent in-process bus (still rejects: bus is in-process)', () => {
    expect(() =>
      assertCapabilities(persistentRunner, s3Blob, {
        persistent: true,
        replay: true,
        assignsSequence: true,
        crossNodeDelivery: false,
      }),
    ).toThrow(/cross-node bus/i)
  })
})
