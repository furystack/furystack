import type { Locator, Page } from '@playwright/test'
import { test, expect } from '@playwright/test'
import { pages } from './pages.js'

const getGrid = async (page: Page) => {
  return await page.locator('shade-data-grid')
}

test.describe('Data Grid component', () => {
  let grid!: Locator
  let focusedEntry!: Locator
  let selectionCount!: Locator

  const expectRowHasFocus = async (rowNumber: number) => {
    const row = await grid.locator(`shades-data-grid-row:nth-child(${rowNumber})`)
    const rowTextCell = await row.locator('td:nth-child(2)')
    expect(await focusedEntry.inputValue()).toBe(await rowTextCell.textContent())
  }

  const expectRowIsSelected = async (...rowNumbers: number[]) => {
    for (const rowNumber of rowNumbers) {
      const row = await grid.locator(`shades-data-grid-row:nth-child(${rowNumber})`)
      const checkbox = await row.locator('td:nth-child(1) input[type=checkbox]')
      expect(await checkbox.isChecked()).toBe(true)
    }
  }

  const expectRowIsUnselected = async (rowNumber: number) => {
    const row = await grid.locator(`shades-data-grid-row:nth-child(${rowNumber})`)
    const checkbox = await row.locator('td:nth-child(1) input[type=checkbox]')
    expect(await checkbox.isChecked()).toBe(false)
  }

  const expectSelectionCount = async (count: number) => {
    expect(await selectionCount.inputValue()).toBe(count.toString())
  }

  const clickOnRow = async (rowNumber: number, modifiers?: Array<'Alt' | 'Control' | 'Meta' | 'Shift'>) => {
    const row = await grid.locator(`shades-data-grid-row:nth-child(${rowNumber})`)
    await row.click({ modifiers })
  }

  test.beforeEach(async ({ page }) => {
    await page.goto(pages.grid.url)
    grid = await getGrid(page)
    focusedEntry = await page.locator('[name="focusedEntry"]')
    selectionCount = await page.locator('[name="selectionCount"]')
  })

  test.describe('Focus', async () => {
    test('With mouse click', async () => {
      const numbers = new Array(10).fill(Math.round(Math.random() * 100))
      for (const no of numbers) {
        await clickOnRow(no)
        await expectRowHasFocus(no)
        await expectSelectionCount(0)
      }
    })

    test('With keyboard', async ({ page }) => {
      await clickOnRow(1)
      await expectRowHasFocus(1)
      await page.keyboard.press('ArrowDown')
      await expectRowHasFocus(2)
      await page.keyboard.press('ArrowUp')
      await expectRowHasFocus(1)
    })
  })

  test.describe('Selection', async () => {
    test.describe('Keyboard shortcuts', () => {
      test('space should invert selection and keep focus', async ({ page }) => {
        await clickOnRow(1)

        // select row 1
        await expectRowHasFocus(1)
        await page.keyboard.press(' ')
        await expectRowHasFocus(1)
        await expectSelectionCount(1)
        await expectRowIsSelected(1)

        // select row 2
        await page.keyboard.press('ArrowDown')
        await page.keyboard.press(' ')
        await expectRowHasFocus(2)
        await expectSelectionCount(2)
        await expectRowIsSelected(1)
        await expectRowIsSelected(2)

        // select row 3
        await page.keyboard.press('ArrowDown')
        await page.keyboard.press(' ')
        await expectRowHasFocus(3)
        await expectSelectionCount(3)
        await expectRowIsSelected(1)
        await expectRowIsSelected(2)
        await expectRowIsSelected(3)

        // deselect row 2
        await page.keyboard.press('ArrowUp')
        await page.keyboard.press(' ')
        await expectRowHasFocus(2)
        await expectSelectionCount(2)
        await expectRowIsSelected(1)
        await expectRowIsUnselected(2)
        await expectRowIsSelected(3)
      })

      test('insert should invert selection and move focus down', async ({ page }) => {
        await clickOnRow(1)

        // select row 1, focus on 2
        await page.keyboard.press('Insert')
        await expectRowHasFocus(2)
        await expectRowIsSelected(1)
        await expectSelectionCount(1)

        // select row 2, focus on 3
        await page.keyboard.press('Insert')
        await expectRowHasFocus(3)
        await expectRowIsSelected(2)
        await expectSelectionCount(2)

        await page.keyboard.press('ArrowUp')
        await expectRowHasFocus(2)
        await page.keyboard.press('Insert')
        await expectRowIsUnselected(2)
        await expectSelectionCount(1)
        await expectRowHasFocus(3)
      })

      test('plus should select all rows', async ({ page }) => {
        await clickOnRow(1)
        await page.keyboard.press('+', {
          delay: 25,
        })
        await expectSelectionCount(100)
      })

      test('minus should deselect all rows', async ({ page }) => {
        await clickOnRow(1)
        await page.keyboard.press('Insert')
        await page.keyboard.press('Insert')
        await page.keyboard.press('Insert')
        await expectSelectionCount(3)
        await page.keyboard.press('-')
        await expectSelectionCount(0)
      })

      test('star should invert selection', async ({ page }) => {
        await clickOnRow(1)
        await page.keyboard.press('Insert')
        await page.keyboard.press('Insert')
        await page.keyboard.press('Insert')
        await expectSelectionCount(3)
        await page.keyboard.press('*')
        await expectSelectionCount(97)
      })
    })
  })

  test.describe('Gestures', async () => {
    test('CTRL+click should toggle selection', async ({ page }) => {
      /** TODO */
      await clickOnRow(1, ['Control'])
      await expectRowHasFocus(1)
      await expectRowIsSelected(1)
      await expectSelectionCount(1)

      await clickOnRow(2, ['Control'])
      await expectRowHasFocus(2)
      await expectRowIsSelected(2)
      await expectSelectionCount(2)

      await clickOnRow(2, ['Control'])
      await expectRowHasFocus(2)
      await expectRowIsUnselected(2)
      await expectSelectionCount(1)
    })

    test('SHIFT+click should select range', async ({ page }) => {
      await clickOnRow(1)
      await expectRowHasFocus(1)
      await expectSelectionCount(0)

      await clickOnRow(4, ['Shift'])

      await expectRowIsSelected(1, 2, 3, 4)
      await expectRowHasFocus(4)
    })
  })
})
