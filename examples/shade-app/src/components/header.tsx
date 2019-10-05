import { createComponent, RouteLink, Shade } from '@furystack/shades'

export interface HeaderProps {
  title: string
  links: Array<{ name: string; url: string }>
}

const urlStyle: Partial<CSSStyleDeclaration> = {
  color: '#aaa',
  textDecoration: 'none',
}

export const Header = Shade<HeaderProps>({
  shadowDomName: 'shade-app-header',
  render: ({ props }) => {
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
          padding: '8px',
        }}>
        <h3 style={{ margin: '0 2em 0 0', cursor: 'pointer' }}>
          <RouteLink title={props.title} href="/" style={urlStyle}>
            {props.title}
          </RouteLink>
        </h3>
        {props.links.map(link => (
          <RouteLink title={link.name} href={link.url} style={{ ...urlStyle, padding: '0 8px', cursor: 'pointer' }}>
            {link.name || ''}
          </RouteLink>
        ))}
      </div>
    )
  },
})
