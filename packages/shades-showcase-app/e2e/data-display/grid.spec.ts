import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

test.describe('Data Grid component', () => {
  test.skip(({ isMobile }) => isMobile, 'Desktop-only tests (requires keyboard interaction)')

  const expectRowHasFocus = async (page: Page, rowNumber: number) => {
    await expect(page.locator(`shades-data-grid-row:nth-child(${rowNumber})`)).toHaveClass(/focused/)
  }

  const expectRowIsSelected = async (page: Page, ...rowNumbers: number[]) => {
    for (const rowNumber of rowNumbers) {
      await expect(page.locator(`shades-data-grid-row:nth-child(${rowNumber})`)).toHaveClass(/selected/)
    }
  }

  const expectRowIsUnselected = async (page: Page, rowNumber: number) => {
    await expect(page.locator(`shades-data-grid-row:nth-child(${rowNumber})`)).not.toHaveClass(/selected/)
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

    // Wait for smooth scroll animation to complete (up to 1 second)
    // by waiting for the row to be in viewport
    await expect(row).toBeInViewport({ timeout: 2000 })

    // Additional verification: row should be visible below header and above footer
    const grid = page.locator('shade-data-grid')
    const header = page.locator('shade-data-grid th').first()
    const footer = page.locator('shade-data-grid-footer')

    const rowBox = await row.boundingBox()
    const gridBox = await grid.boundingBox()
    const headerBox = await header.boundingBox()
    const footerBox = await footer.boundingBox()

    expect(rowBox).not.toBeNull()
    expect(gridBox).not.toBeNull()

    // Row should be below the sticky header
    const visibleTop = gridBox!.y + (headerBox?.height || 0)
    // Row should be above the footer
    const visibleBottom = gridBox!.y + gridBox!.height - (footerBox?.height || 0)

    expect(Math.round(rowBox!.y)).toBeGreaterThanOrEqual(Math.round(visibleTop) - 50) // Allow 50px tolerance for smooth scroll and layout variations
    expect(Math.round(rowBox!.y + rowBox!.height)).toBeLessThanOrEqual(Math.round(visibleBottom) + 50) // Allow 50px tolerance
  }

  test.describe('Focus', () => {
    test('With mouse click', async ({ page }) => {
      await page.goto('/data-display/grid')
      const numbers = new Array<number>(10).fill(0).map(() => Math.floor(Math.random() * 100) + 1)
      for (const no of numbers) {
        await clickOnRow(page, no)
        await expectRowHasFocus(page, no)
        await expectSelectionCount(page, 0)
      }
    })

    test('With keyboard', async ({ page }) => {
      await page.goto('/data-display/grid')
      await clickOnRow(page, 1)
      await expectRowHasFocus(page, 1)
      await page.keyboard.press('ArrowDown')
      await expectRowHasFocus(page, 2)
      await page.keyboard.press('ArrowUp')
      await expectRowHasFocus(page, 1)
    })
  })

  test.describe('Selection', () => {
    test.describe('Keyboard shortcuts', () => {
      test('space should invert selection and keep focus', async ({ page }) => {
        await page.goto('/data-display/grid')
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
        await page.goto('/data-display/grid')
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
        await page.goto('/data-display/grid')
        await clickOnRow(page, 1)
        await page.keyboard.press('+', {
          delay: 25,
        })
        await expectSelectionCount(page, 100)
      })

      test('minus should deselect all rows', async ({ page }) => {
        await page.goto('/data-display/grid')
        await clickOnRow(page, 1)
        await page.keyboard.press('Insert')
        await page.keyboard.press('Insert')
        await page.keyboard.press('Insert')
        await expectSelectionCount(page, 3)
        await page.keyboard.press('-')
        await expectSelectionCount(page, 0)
      })

      test('star should invert selection', async ({ page }) => {
        await page.goto('/data-display/grid')
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

  test.describe('Gestures', () => {
    test('CTRL+click should toggle selection', async ({ page }) => {
      await page.goto('/data-display/grid')
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
      await page.goto('/data-display/grid')
      await clickOnRow(page, 1)
      await expectRowHasFocus(page, 1)
      await expectSelectionCount(page, 0)

      await clickOnRow(page, 4, ['Shift'])

      await expectRowIsSelected(page, 1, 2, 3, 4)
      await expectRowHasFocus(page, 4)
    })
  })

  test.describe('Keyboard Navigation Scrolling', () => {
    test('ArrowDown should scroll focused row into view when navigating beyond visible area', async ({ page }) => {
      await page.goto('/data-display/grid')
      await clickOnRow(page, 1)
      await expectRowHasFocus(page, 1)

      // Navigate down many rows to go beyond the visible area
      for (let i = 1; i <= 30; i++) {
        await page.keyboard.press('ArrowDown')
      }

      await expectRowHasFocus(page, 31)
      await expectRowIsInViewport(page, 31)
    })

    test('ArrowUp should scroll focused row into view when navigating beyond visible area', async ({ page }) => {
      await page.goto('/data-display/grid')

      // First navigate to a row far down the list
      await clickOnRow(page, 50)
      await expectRowHasFocus(page, 50)

      // Navigate up many rows to go beyond the visible area
      for (let i = 1; i <= 30; i++) {
        await page.keyboard.press('ArrowUp')
      }

      await expectRowHasFocus(page, 20)
      await expectRowIsInViewport(page, 20)
    })

    test('Home key should scroll to first row', async ({ page }) => {
      await page.goto('/data-display/grid')

      // Start from a row in the middle
      await clickOnRow(page, 50)
      await expectRowHasFocus(page, 50)

      // Press Home to go to first row
      await page.keyboard.press('Home')

      await expectRowHasFocus(page, 1)
      await expectRowIsInViewport(page, 1)
    })

    test('End key should scroll to last row', async ({ page }) => {
      await page.goto('/data-display/grid')

      // Start from the first row
      await clickOnRow(page, 1)
      await expectRowHasFocus(page, 1)

      // Press End to go to last row
      await page.keyboard.press('End')

      await expectRowHasFocus(page, 100)
      await expectRowIsInViewport(page, 100)
    })

    test('Multiple consecutive navigation should scroll to final row', async ({ page }) => {
      await page.goto('/data-display/grid')
      await clickOnRow(page, 1)

      // Navigate down 30 rows and verify final row is visible
      for (let i = 1; i <= 30; i++) {
        await page.keyboard.press('ArrowDown')
      }
      await expectRowHasFocus(page, 31)
      await expectRowIsInViewport(page, 31)
    })
  })
})
