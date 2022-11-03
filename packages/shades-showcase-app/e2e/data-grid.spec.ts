import type { Page } from '@playwright/test'
import { test, expect } from '@playwright/test'
import { pages } from './pages'

test.describe('Data Grid component', () => {
  const expectRowHasFocus = async (page: Page, rowNumber: number) => {
    const row = await page.locator(`shades-data-grid-row:nth-child(${rowNumber})`)
    const rowTextCell = await row.locator('td:nth-child(2)')
    await page.locator(`[data-focusedEntry="${rowTextCell}"`)

    const focusedValue = await page.locator('[name="focusedEntry"]').inputValue()
    const cellValue = await rowTextCell.textContent()
    expect(focusedValue).toBe(cellValue)
  }

  const expectRowIsSelected = async (page: Page, ...rowNumbers: number[]) => {
    for (const rowNumber of rowNumbers) {
      const row = await page.locator(`shades-data-grid-row:nth-child(${rowNumber})`)

      await expect(row).toHaveClass(/selected/)
    }
  }

  const expectRowIsUnselected = async (page: Page, rowNumber: number) => {
    const row = await page.locator(`shades-data-grid-row:nth-child(${rowNumber})`)
    await expect(row).not.toHaveClass(/selected/)
  }

  const expectSelectionCount = async (page: Page, count: number) => {
    const rows = await page.locator('shades-data-grid-row[aria-selected="true"]')
    const selectedCount = await rows.count()
    expect(selectedCount).toBe(count)
  }

  const clickOnRow = async (page: Page, rowNumber: number, modifiers?: Array<'Alt' | 'Control' | 'Meta' | 'Shift'>) => {
    const row = await page.locator(`shades-data-grid-row:nth-child(${rowNumber})`)
    await row.click({ modifiers })
  }

  test.describe('Focus', async () => {
    test('With mouse click', async ({ page }) => {
      await page.goto(pages.grid.url)
      const numbers = new Array(10).fill(Math.round(Math.random() * 100))
      for (const no of numbers) {
        await clickOnRow(page, no)
        await expectRowHasFocus(page, no)
        await expectSelectionCount(page, 0)
      }
    })

    test('With keyboard', async ({ page }) => {
      await page.goto(pages.grid.url)
      await clickOnRow(page, 1)
      await expectRowHasFocus(page, 1)
      await page.keyboard.press('ArrowDown')
      await expectRowHasFocus(page, 2)
      await page.keyboard.press('ArrowUp')
      await expectRowHasFocus(page, 1)
    })
  })

  test.describe('Selection', async () => {
    test.describe('Keyboard shortcuts', () => {
      test('space should invert selection and keep focus', async ({ page }) => {
        await page.goto(pages.grid.url)
        await clickOnRow(page, 1)

        // select row 1
        await expectRowHasFocus(page, 1)
        await page.keyboard.press(' ')
        await expectRowHasFocus(page, 1)
        await expectSelectionCount(page, 1)
        await expectRowIsSelected(page, 1)

        // select row 2
        await page.keyboard.press('ArrowDown')
        await page.keyboard.press(' ')
        await expectRowHasFocus(page, 2)
        await expectSelectionCount(page, 2)
        await expectRowIsSelected(page, 1)
        await expectRowIsSelected(page, 2)

        // select row 3
        await page.keyboard.press('ArrowDown')
        await page.keyboard.press(' ')
        await expectRowHasFocus(page, 3)
        await expectSelectionCount(page, 3)
        await expectRowIsSelected(page, 1)
        await expectRowIsSelected(page, 2)
        await expectRowIsSelected(page, 3)

        // deselect row 2
        await page.keyboard.press('ArrowUp')
        await page.keyboard.press(' ')
        await expectRowHasFocus(page, 2)
        await expectSelectionCount(page, 2)
        await expectRowIsSelected(page, 1)
        await expectRowIsUnselected(page, 2)
        await expectRowIsSelected(page, 3)
      })

      test('insert should invert selection and move focus down', async ({ page }) => {
        await page.goto(pages.grid.url)
        await clickOnRow(page, 1)

        // select row 1, focus on 2
        await page.keyboard.press('Insert')
        await expectRowHasFocus(page, 2)
        await expectRowIsSelected(page, 1)
        await expectSelectionCount(page, 1)

        // select row 2, focus on 3
        await page.keyboard.press('Insert')
        await expectRowHasFocus(page, 3)
        await expectRowIsSelected(page, 2)
        await expectSelectionCount(page, 2)

        await page.keyboard.press('ArrowUp')
        await expectRowHasFocus(page, 2)
        await page.keyboard.press('Insert')
        await expectRowIsUnselected(page, 2)
        await expectSelectionCount(page, 1)
        await expectRowHasFocus(page, 3)
      })

      test('plus should select all rows', async ({ page }) => {
        await page.goto(pages.grid.url)
        await clickOnRow(page, 1)
        await page.keyboard.press('+', {
          delay: 25,
        })
        await expectSelectionCount(page, 100)
      })

      test('minus should deselect all rows', async ({ page }) => {
        await page.goto(pages.grid.url)
        await clickOnRow(page, 1)
        await page.keyboard.press('Insert')
        await page.keyboard.press('Insert')
        await page.keyboard.press('Insert')
        await expectSelectionCount(page, 3)
        await page.keyboard.press('-')
        await expectSelectionCount(page, 0)
      })

      test('star should invert selection', async ({ page }) => {
        await page.goto(pages.grid.url)
        await clickOnRow(page, 1)
        await page.keyboard.press('Insert')
        await page.keyboard.press('Insert')
        await page.keyboard.press('Insert')
        await expectSelectionCount(page, 3)
        await page.keyboard.press('*')
        await expectSelectionCount(page, 97)
      })
    })
  })

  test.describe('Gestures', async () => {
    test('CTRL+click should toggle selection', async ({ page }) => {
      await page.goto(pages.grid.url)
      /** TODO */
      await clickOnRow(page, 1, ['Control'])
      await expectRowHasFocus(page, 1)
      await expectRowIsSelected(page, 1)
      await expectSelectionCount(page, 1)

      await clickOnRow(page, 2, ['Control'])
      await expectRowHasFocus(page, 2)
      await expectRowIsSelected(page, 2)
      await expectSelectionCount(page, 2)

      await clickOnRow(page, 2, ['Control'])
      await expectRowHasFocus(page, 2)
      await expectRowIsUnselected(page, 2)
      await expectSelectionCount(page, 1)
    })

    test('SHIFT+click should select range', async ({ page }) => {
      await page.goto(pages.grid.url)
      await clickOnRow(page, 1)
      await expectRowHasFocus(page, 1)
      await expectSelectionCount(page, 0)

      await clickOnRow(page, 4, ['Shift'])

      await expectRowIsSelected(page, 1, 2, 3, 4)
      await expectRowHasFocus(page, 4)
    })
  })
})
