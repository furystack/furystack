import { createComponent, Shade } from '@furystack/shades'
import { AppBar, AppBarLink } from '@furystack/shades-common-components'

import { ThemeSwitch } from './theme-switch.js'

/**
 * Main navigation AppBar for the showcase application.
 * Contains links to all top-level pages and the theme switcher.
 */
export const ShowcaseAppBar = Shade({
  shadowDomName: 'showcase-app-bar',
  render: () => (
    <AppBar>
      <h3 style={{ margin: '0', paddingLeft: '16px' }}>Showcase App</h3>
      <div
        style={{
          display: 'flex',
          height: '32px',
          paddingLeft: '16px',
          gap: '4px',
          overflow: 'hidden',
          overflowX: 'auto',
        }}
      >
        <AppBarLink href="/">Home</AppBarLink>
        <AppBarLink href="/buttons">Buttons</AppBarLink>
        <AppBarLink href="/inputs">Inputs</AppBarLink>
        <AppBarLink href="/form">Form</AppBarLink>
        <AppBarLink href="/grid">Grid</AppBarLink>
        <AppBarLink href="/nipple">Nipple</AppBarLink>
        <AppBarLink href="/lottie">Lottie</AppBarLink>
        <AppBarLink href="/monaco">Monaco</AppBarLink>
        <AppBarLink href="/wizard">Wizard</AppBarLink>
        <AppBarLink href="/notys">Notys</AppBarLink>
        <AppBarLink href="/tabs">Tabs</AppBarLink>
        <AppBarLink href="/i18n">I18N</AppBarLink>
        <AppBarLink href="/mfe">MFE</AppBarLink>
        <AppBarLink href="/misc">Misc</AppBarLink>
        <AppBarLink href="/layout-tests" routingOptions={{ end: false }}>
          Layout Tests
        </AppBarLink>
      </div>
      <ThemeSwitch />
    </AppBar>
  ),
})
