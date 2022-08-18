import { Locator, Page, test } from '@playwright/test'
import { pages } from './pages'

const getGrid = async (page: Page) => {
  return await page.locator('shade-data-grid')
}

test.describe('Data Grid component', () => {
  let grid!: Locator
  let focusedEntry!: Locator
  let selectionCount!: Locator

  const expectRowHasFocus = async (page: Page, rowNumber: number) => {
    const row = await page.locator(`shades-data-grid-row:nth-child(${rowNumber})`)
    const rowTextCell = await row.locator('td:nth-child(2)')
    test.expect(await focusedEntry.inputValue()).toBe(await rowTextCell.textContent())
  }

  const expectSelectionCound = async (page: Page, count: number) => {
    test.expect(await selectionCount.inputValue()).toBe(count.toString())
  }

  const clickOnRow = async (page: Page, rowNumber: number) => {
    const row = await page.locator(`shades-data-grid-row:nth-child(${rowNumber})`)
    await row.click()
  }

  test.beforeEach(async ({ page }) => {
    await page.goto(pages.grid.url)
    grid = await getGrid(page)
    focusedEntry = await page.locator('[name="focusedEntry"]')
    selectionCount = await page.locator('[name="selectionCount"]')
  })

  test.describe('Focus', async () => {
    test('With mouse click', async ({ page }) => {
      const numbers = new Array(10).fill(Math.round(Math.random() * 100))
      for (const no of numbers) {
        await clickOnRow(page, no)
        await expectRowHasFocus(page, no)
        await expectSelectionCound(page, 0)
      }
    })

    test('With keyboard', async ({ page }) => {
      await clickOnRow(page, 1)
      await expectRowHasFocus(page, 1)
      await page.keyboard.press('ArrowDown')
      await expectRowHasFocus(page, 2)
      await page.keyboard.press('ArrowUp')
      await expectRowHasFocus(page, 1)
    })
  })
})
