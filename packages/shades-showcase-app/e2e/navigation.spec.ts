import type { Locator, Page } from '@playwright/test'
import { test, expect } from '@playwright/test'
import { pages } from './pages'

const getNavigationEntry = async (page: Page, entryName: string) => {
  const appBar = await page.locator('shade-app-bar')
  const menuEntry = await appBar.locator(`text=${entryName}`)
  return menuEntry
}

const expectSelected = async (menuEntry: Locator) =>
  await expect(menuEntry).toHaveCSS('background-color', 'rgba(0, 0, 0, 0.54)')

const expectNotSelected = async (menuEntry: Locator) =>
  await expect(menuEntry).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0.54)')

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

      const buttonsMenuElement = await getNavigationEntry(page, name)
      await expectNotSelected(buttonsMenuElement)

      await buttonsMenuElement.click()
      await expect(page).toHaveURL(url)

      await expectSelected(buttonsMenuElement)
      await expectNotSelected(homeMenuElement)
    })
    test(`${name} Should be available from URL`, async ({ page }) => {
      await page.goto(url)
      const menuEntry = await getNavigationEntry(page, name)
      await expectSelected(menuEntry)
      await expectPageTitle(page, name)
    })
  })
})
