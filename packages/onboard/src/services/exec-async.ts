import { exec, ExecOptions } from 'child_process'
import { Injector } from '@furystack/inject/dist/injector'
import { Injectable } from '@furystack/inject'

@Injectable({ lifetime: 'singleton' })
export class ExecAsyncService {
  public async exec(command: string, options: ExecOptions) {
    return await new Promise<string>((resolve, reject) =>
      exec(command, { ...options }, (err, stdout, _stderr) => {
        if (err) {
          reject(err)
        } else {
          resolve(stdout)
        }
      }),
    )
  }
}

declare module '@furystack/inject/dist/injector' {
  export interface Injector {
    execAsync(command: string, options: ExecOptions): Promise<string>
  }
}

Injector.prototype.execAsync = async function (command, options) {
  return await this.getInstance(ExecAsyncService).exec(command, options)
}
