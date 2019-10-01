import { createComponent, ShadeComponent } from '@furystack/shades'

export interface HeaderProps {
  title: string
  links: Array<{ name: string; url: string }>
}

export const Header: ShadeComponent<HeaderProps> = props => {
  return (
    <div
      id="header"
      style={{
        width: '100%',
        minHeight: '2em',
        background: '#222',
        color: 'white',
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'center',
        boxShadow: '0 0 3px rgba(0,0,0,0.6)',
        animationName: 'glow',
        animationDuration: '3s',
        animationIterationCount: 'infinite',
        animationTimingFunction: 'linear',
        animationDirection: 'alternate',
      }}>
      <h3 style={{ margin: '0 2em', cursor: 'pointer' }}>
        <a title={props.title} href="/" />
      </h3>
      {props.links.map(link => (
        <a title={link.name} href={link.url} style={{ padding: '0 8px', cursor: 'pointer' }}>
          {link.name || ''}
        </a>
      ))}
    </div>
  )
}
