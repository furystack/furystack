// @ts-expect-error - Monaco doesn't have types for this
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
// @ts-expect-error - Monaco doesn't have types for this
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
// @ts-expect-error - Monaco doesn't have types for this
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
// @ts-expect-error - Monaco doesn't have types for this
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
// @ts-expect-error - Monaco doesn't have types for this
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
;(self as any).MonacoEnvironment = {
  getWorker(_: any, label: any) {
    if (label === 'json') {
      return new jsonWorker()
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return new cssWorker()
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return new htmlWorker()
    }
    if (label === 'typescript' || label === 'javascript') {
      return new tsWorker()
    }
    return new editorWorker()
  },
}
