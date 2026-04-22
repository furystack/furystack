import { createComponent, NestedRouteLink, Shade } from '@furystack/shades'
import {
  Button,
  cssVariableTheme,
  Icon,
  icons,
  PageContainer,
  PageHeader,
  Paper,
  Typography,
} from '@furystack/shades-common-components'

const isViewTransitionSupported = typeof document.startViewTransition === 'function'

export const ViewTransitionsPage = Shade({
  customElementName: 'view-transitions-page',
  render: () => {
    return (
      <PageContainer centered>
        <PageHeader
          icon={<Icon icon={icons.compass} />}
          title="View Transitions"
          description="The View Transition API provides animated transitions between route changes. This showcase app has view transitions enabled globally on the NestedRouter — every page navigation you make is animated."
        />

        <Paper
          elevation={2}
          style={{
            padding: '16px 24px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <span
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: isViewTransitionSupported
                ? cssVariableTheme.palette.success.main
                : cssVariableTheme.palette.error.main,
              display: 'inline-block',
              flexShrink: '0',
            }}
          />
          <Typography variant="body1">
            {isViewTransitionSupported
              ? 'Your browser supports the View Transition API. Navigate between pages to see transitions in action.'
              : 'Your browser does not support the View Transition API. Page changes will be instant (graceful fallback).'}
          </Typography>
        </Paper>

        <Typography variant="h3" style={{ marginTop: '24px', marginBottom: '12px' }}>
          Try it out
        </Typography>
        <Paper elevation={3} style={{ padding: '24px' }}>
          <Typography variant="body1" style={{ marginBottom: '16px' }}>
            Click any of these links to navigate and observe the cross-fade transition between pages:
          </Typography>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <NestedRouteLink path="/navigation/tabs">
              <Button variant="outlined">Tabs</Button>
            </NestedRouteLink>
            <NestedRouteLink path="/data-display/grid">
              <Button variant="outlined">Grid</Button>
            </NestedRouteLink>
            <NestedRouteLink path="/surfaces/card">
              <Button variant="outlined">Card</Button>
            </NestedRouteLink>
            <NestedRouteLink path="/feedback/alert">
              <Button variant="outlined">Alert</Button>
            </NestedRouteLink>
            <NestedRouteLink path="/themes">
              <Button variant="outlined">Themes</Button>
            </NestedRouteLink>
          </div>
        </Paper>

        <Typography variant="h3" style={{ marginTop: '32px', marginBottom: '12px' }}>
          Framework integration
        </Typography>
        <Paper elevation={3} style={{ padding: '24px' }}>
          <Typography variant="body1" style={{ marginBottom: '12px' }}>
            View transitions are enabled at the router level with a single prop:
          </Typography>
          <Paper
            elevation={1}
            style={{
              padding: '16px',
              fontFamily: 'Source Code Pro, monospace',
              fontSize: '14px',
              whiteSpace: 'pre',
              overflow: 'auto',
            }}
          >
            {`<NestedRouter
  routes={appRoutes}
  viewTransition
/>`}
          </Paper>
          <Typography variant="body1" style={{ marginTop: '16px', marginBottom: '12px' }}>
            Individual routes can override the behavior or specify transition types for CSS targeting:
          </Typography>
          <Paper
            elevation={1}
            style={{
              padding: '16px',
              fontFamily: 'Source Code Pro, monospace',
              fontSize: '14px',
              whiteSpace: 'pre',
              overflow: 'auto',
            }}
          >
            {`'/about': {
  component: () => <AboutPage />,
  // Opt out of transitions for this route
  viewTransition: false,
}

'/gallery': {
  component: () => <GalleryPage />,
  // Custom types for CSS targeting
  viewTransition: { types: ['slide'] },
}`}
          </Paper>
        </Paper>

        <Typography variant="h3" style={{ marginTop: '32px', marginBottom: '12px' }}>
          Component-level support
        </Typography>
        <Paper elevation={3} style={{ padding: '24px' }}>
          <Typography variant="body1" style={{ marginBottom: '12px' }}>
            Beyond routing, view transitions are supported on individual components that swap content. Each accepts the
            same <code>viewTransition</code> prop:
          </Typography>
          <Paper
            elevation={1}
            style={{
              padding: '16px',
              fontFamily: 'Source Code Pro, monospace',
              fontSize: '14px',
              whiteSpace: 'pre',
              overflow: 'auto',
            }}
          >
            {`// LazyLoad: loader → loaded content
<LazyLoad viewTransition loader={<Skeleton />}
  component={async () => <MyPage />} />

// Tabs: cross-fade between tab panels
<Tabs viewTransition tabs={myTabs} activeKey={key} />

// Wizard: animate between steps
<Wizard viewTransition steps={mySteps} />

// CacheView: loading → content transitions
<CacheView viewTransition cache={myCache}
  args={[id]} content={MyContent} />`}
          </Paper>
        </Paper>

        <Typography variant="h3" style={{ marginTop: '32px', marginBottom: '12px' }}>
          Customizing with CSS
        </Typography>
        <Paper elevation={3} style={{ padding: '24px' }}>
          <Typography variant="body1" style={{ marginBottom: '12px' }}>
            The transition animation is controlled entirely via CSS pseudo-elements at the document level. The default
            is a cross-fade, but you can customize it:
          </Typography>
          <Paper
            elevation={1}
            style={{
              padding: '16px',
              fontFamily: 'Source Code Pro, monospace',
              fontSize: '14px',
              whiteSpace: 'pre',
              overflow: 'auto',
            }}
          >
            {`/* Adjust timing */
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 200ms;
  animation-timing-function: ease-in-out;
}

/* Slide transition using route types */
:root:active-view-transition-type(slide) {
  &::view-transition-old(root) {
    animation: slide-out 0.3s ease-out;
  }
  &::view-transition-new(root) {
    animation: slide-in 0.3s ease-in;
  }
}

/* Respect reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*) {
    animation-duration: 0s !important;
  }
}`}
          </Paper>
        </Paper>

        <Typography variant="h3" style={{ marginTop: '32px', marginBottom: '12px' }}>
          How it works
        </Typography>
        <Paper elevation={3} style={{ padding: '24px' }}>
          <Typography variant="body1" style={{ marginBottom: '8px' }}>
            When a route change occurs with view transitions enabled:
          </Typography>
          <ol style={{ margin: '0', paddingLeft: '24px', lineHeight: '1.8' }}>
            <li>
              <strong>onLeave</strong> hooks run for routes being exited
            </li>
            <li>The browser captures a snapshot of the current (old) view</li>
            <li>The DOM update is applied (new route content rendered)</li>
            <li>The browser captures a snapshot of the new view</li>
            <li>CSS pseudo-elements animate between old and new snapshots</li>
            <li>
              <strong>onVisit</strong> hooks run for routes being entered
            </li>
          </ol>
          <Typography variant="body1" style={{ marginTop: '12px' }}>
            The browser handles the animation overlay and pseudo-element tree. Non-supporting browsers fall back to
            instant page changes with no extra code.
          </Typography>
        </Paper>

        <Typography variant="h3" style={{ marginTop: '32px', marginBottom: '12px' }}>
          Browser support
        </Typography>
        <Paper elevation={3} style={{ padding: '24px' }}>
          <Typography variant="body1">
            Same-document view transitions are <strong>Baseline Newly Available</strong> as of October 2025: Chrome
            111+, Safari 18+, and Firefox 144+. The API is a progressive enhancement — it has zero impact on unsupported
            browsers.
          </Typography>
        </Paper>
      </PageContainer>
    )
  },
})
