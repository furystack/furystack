import { createComponent, ShadeComponent } from '@furystack/shades'
import { Body } from './body'
import { Header } from './header'

export const Layout: ShadeComponent = () => {
  return (
    <div
      id="Layout"
      style={{
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        background: '#dedede',
        display: 'flex',
        flexDirection: 'column',
      }}
      className="eee">
      <Header title="Scout" links={[{ name: 'Home', url: '/' }, { name: 'Debug', url: '/debug' }]} />
      <Body />
    </div>
  )
}
