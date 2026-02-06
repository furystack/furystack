import { createComponent, Shade } from '@furystack/shades'
import { AppBar, createAppBarLink } from '@furystack/shades-common-components'

import type { appRoutes } from '../routes.tsx'
import { ShowcaseBreadcrumbComponent } from './showcase-breadcrumbs.tsx'
import { ThemeSwitch } from './theme-switch.js'

// Create type-safe components constrained to the app routes
const ShowcaseAppBarLinks = createAppBarLink<typeof appRoutes>()

/**
 * Main navigation AppBar for the showcase application.
 * Contains links to all top-level pages and the theme switcher.
 */
export const ShowcaseAppBar = Shade({
  shadowDomName: 'showcase-app-bar',
  render: () => {
    return (
      <AppBar>
        <div style={{ paddingLeft: '16px', fontSize: '0.9em' }}>
          <ShowcaseBreadcrumbComponent />
        </div>
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
          <ShowcaseAppBarLinks href="/">Home</ShowcaseAppBarLinks>
          <ShowcaseAppBarLinks href="/buttons">Buttons</ShowcaseAppBarLinks>
          <ShowcaseAppBarLinks href="/inputs">Inputs</ShowcaseAppBarLinks>
          <ShowcaseAppBarLinks href="/form">Form</ShowcaseAppBarLinks>
          <ShowcaseAppBarLinks href="/grid">Grid</ShowcaseAppBarLinks>
          <ShowcaseAppBarLinks href="/nipple">Nipple</ShowcaseAppBarLinks>
          <ShowcaseAppBarLinks href="/lottie">Lottie</ShowcaseAppBarLinks>
          <ShowcaseAppBarLinks href="/monaco">Monaco</ShowcaseAppBarLinks>
          <ShowcaseAppBarLinks href="/wizard">Wizard</ShowcaseAppBarLinks>
          <ShowcaseAppBarLinks href="/notys">Notys</ShowcaseAppBarLinks>
          <ShowcaseAppBarLinks href="/tabs">Tabs</ShowcaseAppBarLinks>
          <ShowcaseAppBarLinks href="/i18n">I18N</ShowcaseAppBarLinks>
          <ShowcaseAppBarLinks href="/mfe">MFE</ShowcaseAppBarLinks>
          <ShowcaseAppBarLinks href="/misc">Misc</ShowcaseAppBarLinks>
          <ShowcaseAppBarLinks href="/layout-tests" routingOptions={{ end: false }}>
            Layout Tests
          </ShowcaseAppBarLinks>
        </div>
        <ThemeSwitch />
      </AppBar>
    )
  },
})
