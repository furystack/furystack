import { exec, ExecOptions } from 'child_process'

export const execAsync = async (command: string, options: ExecOptions) =>
  await new Promise<string>((resolve, reject) =>
    exec(command, { ...options }, (err, stdout, _stderr) => {
      if (err) {
        reject(err)
      } else {
        resolve(stdout)
      }
    }),
  )
