import type { Locator, Page } from '@playwright/test'
import { test, expect } from '@playwright/test'

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
  misc: {
    name: 'Misc',
    url: '/misc',
  },
}

const getNavigationEntry = async (page: Page, entryName: string) => {
  const appBar = await page.locator('shade-app-bar')
  const menuEntry = await appBar.locator('shade-app-bar-link', { has: page.locator(`text=${entryName}`) })
  return menuEntry
}

const expectSelected = async (menuEntry: Locator) => await expect(menuEntry).toHaveCSS('opacity', '1')

const expectNotSelected = async (menuEntry: Locator) => await expect(menuEntry).not.toHaveCSS('opacity', '1')

const expectPageTitle = async (page: Page, title: string) => await page.locator('shade-router h1', { hasText: title })

test.describe('Navigation', () => {
  Object.values(pages).forEach(({ name, url }) => {
    test(`${name} Should be available from Navigation menu`, async ({ page }) => {
      await page.goto('http://localhost:8080/')
      const homePageTitle = await page.locator('shades-showcase-home')
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
})
