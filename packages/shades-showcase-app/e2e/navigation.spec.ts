import type { Locator, Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

const pages = {
  buttons: {
    name: 'Buttons',
    url: '/buttons',
  },
  inputs: {
    name: 'Inputs',
    url: '/inputs',
  },
  form: {
    name: 'Form',
    url: '/form',
  },
  grid: {
    name: 'Grid',
    url: '/grid',
  },
  nipple: {
    name: 'Nipple',
    url: '/nipple',
  },
  lottie: {
    name: 'Lottie',
    url: '/lottie',
  },
  monaco: {
    name: 'Monaco',
    url: '/monaco',
  },
  wizard: {
    name: 'Wizard',
    url: '/wizard',
  },
  notys: {
    name: 'Notys',
    url: '/notys',
  },
  tabs: {
    name: 'Tabs',
    url: '/tabs',
  },
  i18n: {
    name: 'I18N',
    url: '/i18n',
  },
  mfe: {
    name: 'MFE',
    url: '/mfe',
  },
  misc: {
    name: 'Misc',
    url: '/misc',
  },
}

const getNavigationEntry = async (page: Page, entryName: string) => {
  const appBar = page.locator('shade-app-bar')
  const menuEntry = appBar.locator('shade-app-bar-link', { has: page.locator(`text=${entryName}`) })
  return menuEntry
}

const expectSelected = async (menuEntry: Locator) => await expect(menuEntry).toHaveCSS('opacity', '1')

const expectNotSelected = async (menuEntry: Locator) => await expect(menuEntry).not.toHaveCSS('opacity', '1')

const expectPageTitle = async (page: Page, title: string) => page.locator('shade-router h1', { hasText: title })

test.describe('Navigation', () => {
  Object.values(pages).forEach(({ name, url }) => {
    test(`${name} Should be available from Navigation menu`, async ({ page }) => {
      await page.goto('http://localhost:8080/')
      const homePageTitle = page.locator('shades-showcase-home')
      await expect(homePageTitle).toBeVisible()

      // Home should be selected
      const homeMenuElement = await getNavigationEntry(page, 'Home')
      await expectSelected(homeMenuElement)

      const targetMenuElement = await getNavigationEntry(page, name)
      await expectNotSelected(targetMenuElement)

      await targetMenuElement.click()
      await expect(page).toHaveURL(url)

      await expectSelected(targetMenuElement)
      await expectNotSelected(homeMenuElement)

      await page.goBack()
      await expectSelected(homeMenuElement)

      await page.goForward()
      await expectSelected(targetMenuElement)
    })
    test(`${name} Should be available from URL`, async ({ page }) => {
      await page.goto(url)
      const menuEntry = await getNavigationEntry(page, name)
      await expectSelected(menuEntry)
      await expectPageTitle(page, name)
    })
  })

  test('Should have a 404 page', async ({ page }) => {
    await page.goto('/non-existing-page')
    const notFoundTitle = page.locator('shade-router h1', { hasText: '404' })
    await expect(notFoundTitle).toBeVisible()
    const notFoundContent = page.locator('shade-router p', { hasText: 'Have you seen this cat? 😸' })
    await expect(notFoundContent).toBeVisible()
  })
})
