/** ToDo: Main entry point */
import { LocationService, shadeInjector } from '@furystack/shades'
import { Layout } from './components/layout'

shadeInjector.getInstance(LocationService).onLocationChanged.subscribe(l => console.log(l))

const root: HTMLDivElement = document.getElementById('root') as HTMLDivElement
root.appendChild(Layout({}, []))
