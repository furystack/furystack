import { join } from 'path'
import { createWriteStream } from 'fs'
import got from 'got'
import { Injectable } from '@furystack/inject'
import { DownloadInputFile } from '../models/install-step'
import { ExecInstallContext } from './exec-install-step'
import { GenericStep } from './generic-step'

@Injectable()
export class DownloadInputFileInstallStep implements GenericStep<DownloadInputFile> {
  prerequisites = []

  public run = async (step: DownloadInputFile, context: ExecInstallContext) => {
    const result = await got(step.url, { isStream: true })
    result.pipe(createWriteStream(join(context.inputDir, step.destination)))
  }
}
