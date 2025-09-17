import type { Environment } from 'monaco-editor'

declare global {
  interface Window {
    MonacoEnvironment: Environment
  }
}

const getWorker = async (_workerId: string, label: string): Promise<Worker> => {
  let worker

  switch (label) {
    case 'json':
      worker = await import('monaco-editor/esm/vs/language/json/json.worker?worker')
      break
    case 'css':
    case 'scss':
    case 'less':
      worker = await import('monaco-editor/esm/vs/language/css/css.worker?worker')
      break
    case 'html':
    case 'handlebars':
    case 'razor':
      worker = await import('monaco-editor/esm/vs/language/html/html.worker?worker')
      break
    case 'typescript':
    case 'javascript':
      worker = await import('monaco-editor/esm/vs/language/typescript/ts.worker?worker')
      break
    default:
      worker = await import('monaco-editor/esm/vs/editor/editor.worker?worker')
  }

  return new worker.default()
}

self.MonacoEnvironment = {
  ...self.MonacoEnvironment,
  getWorker,
}
