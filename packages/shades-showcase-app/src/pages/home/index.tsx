import { createComponent, NestedRouteLink, Shade, styledElement, styledShade } from '@furystack/shades'
import { Icon, icons, PageContainer, PageHeader, Paper, Typography } from '@furystack/shades-common-components'

const CustomHeader = styledElement('h1', {
  color: 'black',
})

const CustomNestedRouteLink = styledShade(NestedRouteLink, {
  color: 'blue',
})

export const HomePage = Shade({
  shadowDomName: 'shades-showcase-home',
  render: () => {
    return (
      <PageContainer centered>
        <PageHeader
          icon={<Icon icon={icons.home} />}
          title="Welcome to FuryStack Shades"
          description="Explore the component library and learn how to build modern web applications with the Shades framework."
        />
        <Paper elevation={3} style={{ padding: '16px 32px 32px 32px', textAlign: 'justify' }}>
          <Typography variant="h2">Introduction</Typography>
          <Typography variant="body1">
            FuryStack Shades is a lightweight, dependency-injection powered UI framework for building modern web
            applications. Built on top of Custom Elements, it provides a familiar JSX syntax with framework-agnostic
            components that work anywhere.
          </Typography>

          <Typography variant="h2">Core Features</Typography>
          <Typography variant="body1">
            The framework features a reactive programming model with ObservableValue for state management, automatic
            dependency injection through the Injector system, and a component lifecycle that handles disposal
            automatically. Components are defined using the Shade factory function, which registers Custom Elements with
            a VNode-based reconciler for efficient DOM updates.
          </Typography>

          <Typography variant="h2">Component Library</Typography>
          <Typography variant="body1">
            This showcase application demonstrates the shades-common-components library, which provides a collection of
            ready-to-use UI components. You'll find form controls like Buttons, Inputs, and Autocomplete fields, layout
            components like PageLayout and Paper, and specialized components for data display, notifications, and more.
          </Typography>

          <Typography variant="h2">Getting Started</Typography>
          <Typography variant="body1">
            Use the navigation bar above to explore different component categories. Each page demonstrates the
            component's usage with live examples and interactive controls. The source code for this showcase app itself
            serves as documentation for how to integrate these components into your own applications.
          </Typography>

          <Typography variant="h2">Styled Elements Demo</Typography>
          <Typography variant="body1">
            The styled elements demo below shows how to create custom styled components using the styledElement and
            styledShade utilities, allowing you to extend base components with your own styling while maintaining type
            safety.
          </Typography>
          <hr />
          <CustomHeader style={{ color: 'white' }}>Custom styled elements:</CustomHeader>
          <div>
            <CustomNestedRouteLink href="/wizard" style={{ color: 'black' }}>
              Go to wizard
            </CustomNestedRouteLink>
            &nbsp;
            <CustomNestedRouteLink href="/">NestedRouteLink</CustomNestedRouteLink>
          </div>
        </Paper>
      </PageContainer>
    )
  },
})
