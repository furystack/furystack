import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

test.describe('Data Grid component', () => {
  test.skip(({ isMobile }) => isMobile, 'Desktop-only tests (requires keyboard interaction)')

  const expectRowHasFocus = async (page: Page, rowNumber: number) => {
    await expect(page.locator(`shades-data-grid-row:nth-child(${rowNumber})`)).toHaveAttribute('data-focused', '')
  }

  const expectRowIsSelected = async (page: Page, ...rowNumbers: number[]) => {
    for (const rowNumber of rowNumbers) {
      await expect(page.locator(`shades-data-grid-row:nth-child(${rowNumber})`)).toHaveAttribute('data-selected', '')
    }
  }

  const expectRowIsUnselected = async (page: Page, rowNumber: number) => {
    await expect(page.locator(`shades-data-grid-row:nth-child(${rowNumber})`)).not.toHaveAttribute('data-selected')
  }

  const expectSelectionCount = async (page: Page, count: number) => {
    expect(await page.locator('shades-data-grid-row[aria-selected="true"]').count()).toBe(count)
    expect(await page.locator('shades-grid-status input[name="selectionCount"]').inputValue()).toBe(count.toString())
  }

  const clickOnRow = async (page: Page, rowNumber: number, modifiers?: Array<'Alt' | 'Control' | 'Meta' | 'Shift'>) => {
    await page.locator(`shades-data-grid-row:nth-child(${rowNumber})`).click({ modifiers })
  }

  const expectRowIsInViewport = async (page: Page, rowNumber: number) => {
    const row = page.locator(`shades-data-grid-row:nth-child(${rowNumber})`)

    await expect(row).toBeInViewport({ timeout: 2000 })

    const grid = page.locator('shade-data-grid')
    const header = page.locator('shade-data-grid th').first()
    const footer = page.locator('shade-data-grid-footer')

    const rowBox = await row.boundingBox()
    const gridBox = await grid.boundingBox()
    const headerBox = await header.boundingBox()
    const footerBox = await footer.boundingBox()

    expect(rowBox).not.toBeNull()
    expect(gridBox).not.toBeNull()

    const visibleTop = gridBox!.y + (headerBox?.height || 0)
    const visibleBottom = gridBox!.y + gridBox!.height - (footerBox?.height || 0)

    expect(Math.round(rowBox!.y)).toBeGreaterThanOrEqual(Math.round(visibleTop) - 100)
    expect(Math.round(rowBox!.y + rowBox!.height)).toBeLessThanOrEqual(Math.round(visibleBottom) + 100)
  }

  test('focus: mouse click and keyboard navigation', async ({ page }) => {
    await page.goto('/data-display/grid')

    // Mouse click focus
    const numbers = new Array<number>(10).fill(0).map(() => Math.floor(Math.random() * 100) + 1)
    for (const no of numbers) {
      await clickOnRow(page, no)
      await expectRowHasFocus(page, no)
      await expectSelectionCount(page, 0)
    }

    // Keyboard navigation
    await clickOnRow(page, 1)
    await expectRowHasFocus(page, 1)
    await page.keyboard.press('ArrowDown')
    await expectRowHasFocus(page, 2)
    await page.keyboard.press('ArrowUp')
    await expectRowHasFocus(page, 1)
  })

  test('selection: space, insert, plus, minus, and star keyboard shortcuts', async ({ page }) => {
    await page.goto('/data-display/grid')
    await clickOnRow(page, 1)

    // Space should invert selection and keep focus
    await expectRowHasFocus(page, 1)
    await page.keyboard.press(' ')
    await expectRowHasFocus(page, 1)
    await expectSelectionCount(page, 1)
    await expectRowIsSelected(page, 1)

    await page.keyboard.press('ArrowDown')
    await page.keyboard.press(' ')
    await expectRowHasFocus(page, 2)
    await expectSelectionCount(page, 2)
    await expectRowIsSelected(page, 1)
    await expectRowIsSelected(page, 2)

    await page.keyboard.press('ArrowDown')
    await page.keyboard.press(' ')
    await expectRowHasFocus(page, 3)
    await expectSelectionCount(page, 3)
    await expectRowIsSelected(page, 1, 2, 3)

    await expect(page.locator('shade-data-grid')).toHaveScreenshot('grid-with-selection.png')

    // Deselect row 2
    await page.keyboard.press('ArrowUp')
    await page.keyboard.press(' ')
    await expectRowHasFocus(page, 2)
    await expectSelectionCount(page, 2)
    await expectRowIsSelected(page, 1)
    await expectRowIsUnselected(page, 2)
    await expectRowIsSelected(page, 3)

    // Plus should select all rows
    await page.keyboard.press('+', { delay: 25 })
    await expectSelectionCount(page, 100)

    // Minus should deselect all rows
    await page.keyboard.press('-')
    await expectSelectionCount(page, 0)

    // Insert should invert selection and move focus down
    await clickOnRow(page, 1)
    await page.keyboard.press('Insert')
    await expectRowHasFocus(page, 2)
    await expectRowIsSelected(page, 1)
    await expectSelectionCount(page, 1)

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

    // Star should invert selection
    await page.keyboard.press('-')
    await expectSelectionCount(page, 0)
    await clickOnRow(page, 1)
    await page.keyboard.press('Insert')
    await page.keyboard.press('Insert')
    await page.keyboard.press('Insert')
    await expectSelectionCount(page, 3)
    await page.keyboard.press('*')
    await expectSelectionCount(page, 97)
  })

  test('gestures: CTRL+click and SHIFT+click selection', async ({ page }) => {
    await page.goto('/data-display/grid')

    // CTRL+click should toggle selection
    await clickOnRow(page, 1)
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

    // SHIFT+click should select range (deselect all first)
    await page.keyboard.press('-')
    await expectSelectionCount(page, 0)
    await clickOnRow(page, 1)
    await expectRowHasFocus(page, 1)
    await expectSelectionCount(page, 0)

    await clickOnRow(page, 4, ['Shift'])
    await expectRowIsSelected(page, 1, 2, 3, 4)
    await expectRowHasFocus(page, 4)
  })

  test('keyboard scrolling: ArrowDown, ArrowUp, Home, and End', async ({ page }) => {
    await page.goto('/data-display/grid')

    // ArrowDown should scroll focused row into view
    await clickOnRow(page, 1)
    await expectRowHasFocus(page, 1)
    for (let i = 1; i <= 30; i++) {
      await page.keyboard.press('ArrowDown')
    }
    await expectRowHasFocus(page, 31)
    await expectRowIsInViewport(page, 31)

    // Home key should scroll to first row
    await page.keyboard.press('Home')
    await expectRowHasFocus(page, 1)
    await expectRowIsInViewport(page, 1)

    // End key should scroll to last row
    await page.keyboard.press('End')
    await expectRowHasFocus(page, 100)
    await expectRowIsInViewport(page, 100)

    // ArrowUp should scroll focused row into view
    for (let i = 1; i <= 30; i++) {
      await page.keyboard.press('ArrowUp')
    }
    await expectRowHasFocus(page, 70)
    await expectRowIsInViewport(page, 70)
  })
})
