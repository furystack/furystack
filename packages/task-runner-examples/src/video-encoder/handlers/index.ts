import type { AnyTaskHandlerDescriptor } from '@furystack/task-runner'
import { processUpload } from './process-upload.js'
import { videoProbe } from './video-probe.js'
import { videoEncodeH264 } from './video-encode-h264.js'
import { videoEncodeChunk } from './video-encode-chunk.js'
import { videoMux } from './video-mux.js'
import { videoPackage } from './video-package.js'
import { thumbnail } from './thumbnail.js'

export { processUpload, videoProbe, videoEncodeH264, videoEncodeChunk, videoMux, videoPackage, thumbnail }

/** Every video-encoder handler, ready to register on a worker. */
export const videoEncoderHandlers: AnyTaskHandlerDescriptor[] = [
  processUpload,
  videoProbe,
  videoEncodeH264,
  videoEncodeChunk,
  videoMux,
  videoPackage,
  thumbnail,
]
