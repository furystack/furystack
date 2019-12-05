import { createWriteStream, unlinkSync } from 'fs'
import { get } from 'https'
import { Injectable } from '@furystack/inject'

@Injectable()
export class ConfigDownloaderService {
  public async download(url: string, destination: string) {
    const file = createWriteStream(destination)
    await new Promise((resolve, reject) => {
      get(url, response => {
        response.pipe(file)
        file.on('finish', () => {
          ;(file.close as any)(resolve)
        })
      }).on('error', err => {
        unlinkSync(destination)
        reject(err)
      })
    })
  }
}
