import type { Locator, Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

const categories = [
  {
    name: 'Inputs & Forms',
    url: '/inputs-and-forms/buttons',
    pages: [
      { name: 'Buttons', url: '/inputs-and-forms/buttons' },
      { name: 'Inputs', url: '/inputs-and-forms/inputs' },
      { name: 'Form', url: '/inputs-and-forms/form' },
    ],
  },
  {
    name: 'Data Display',
    url: '/data-display/grid',
    pages: [
      { name: 'Grid', url: '/data-display/grid' },
      { name: 'List', url: '/data-display/list' },
      { name: 'Tree', url: '/data-display/tree' },
      { name: 'Avatar', url: '/data-display/avatar' },
      { name: 'Breadcrumb', url: '/data-display/breadcrumb' },
    ],
  },
  {
    name: 'Navigation',
    url: '/navigation/tabs',
    pages: [
      { name: 'Tabs', url: '/navigation/tabs' },
      { name: 'Context Menu', url: '/navigation/context-menu' },
      { name: 'Command Palette', url: '/navigation/command-palette' },
      { name: 'Suggest', url: '/navigation/suggest' },
    ],
  },
  {
    name: 'Feedback',
    url: '/feedback/notifications',
    pages: [{ name: 'Notifications', url: '/feedback/notifications' }],
  },
  {
    name: 'Surfaces',
    url: '/surfaces/wizard',
    pages: [
      { name: 'Wizard', url: '/surfaces/wizard' },
      { name: 'FAB', url: '/surfaces/fab' },
    ],
  },
  {
    name: 'Integrations',
    url: '/integrations/monaco',
    pages: [
      { name: 'Monaco', url: '/integrations/monaco' },
      { name: 'Lottie', url: '/integrations/lottie' },
      { name: 'Nipple', url: '/integrations/nipple' },
      { name: 'MFE', url: '/integrations/mfe' },
      { name: 'I18N', url: '/integrations/i18n' },
    ],
  },
  {
    name: 'Utilities',
    url: '/utilities/search-state',
    pages: [
      { name: 'Search State', url: '/utilities/search-state' },
      { name: 'Stored State', url: '/utilities/stored-state' },
    ],
  },
]

const getAppBarLink = (page: Page, linkText: string) => {
  const appBar = page.locator('shade-app-bar')
  return appBar.locator('shade-app-bar-link', { has: page.locator(`text=${linkText}`) })
}

const expectSelected = async (link: Locator) => await expect(link).toHaveCSS('opacity', '1')

const expectNotSelected = async (link: Locator) => await expect(link).not.toHaveCSS('opacity', '1')

test.describe('Navigation', () => {
  test.describe('Category links in AppBar', () => {
    categories.forEach(({ name: categoryName, url: categoryUrl }) => {
      test(`${categoryName} should be accessible from AppBar and navigate to first child`, async ({ page }) => {
        await page.goto('http://localhost:8080/')
        const homePageTitle = page.locator('shades-showcase-home')
        await expect(homePageTitle).toBeVisible()

        const homeLink = getAppBarLink(page, 'Home')
        await expectSelected(homeLink)

        const categoryLink = getAppBarLink(page, categoryName)
        await expectNotSelected(categoryLink)

        await categoryLink.click()
        await expect(page).toHaveURL(categoryUrl)

        await expectSelected(categoryLink)
        await expectNotSelected(homeLink)

        await page.goBack()
        await expectSelected(homeLink)

        await page.goForward()
        await expectSelected(categoryLink)
      })
    })
  })

  test.describe('Pages accessible from URL', () => {
    categories.forEach(({ name: categoryName, pages }) => {
      pages.forEach(({ name: pageName, url: pageUrl }) => {
        test(`${pageName} should be accessible from URL and highlight ${categoryName} category`, async ({ page }) => {
          await page.goto(pageUrl)
          const categoryLink = getAppBarLink(page, categoryName)
          await expectSelected(categoryLink)
        })
      })
    })
  })

  test('Should have a 404 page', async ({ page }) => {
    await page.goto('/non-existing-page')
    const notFoundTitle = page.locator('h1', { hasText: '404' })
    await expect(notFoundTitle).toBeVisible()
    const notFoundContent = page.locator('p', { hasText: 'Have you seen this cat? 😸' })
    await expect(notFoundContent).toBeVisible()
  })
})
