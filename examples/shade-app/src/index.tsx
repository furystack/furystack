/** ToDo: Main entry point */
import { Layout } from './components/layout'
;(async () => {
  await new Promise(resolve => setTimeout(() => resolve()))
  const root: HTMLDivElement = document.getElementById('root') as HTMLDivElement
  const component = Layout()
  root.innerHTML = ''
  root.appendChild(component)
})()
