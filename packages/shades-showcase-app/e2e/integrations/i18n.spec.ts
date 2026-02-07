import { expect, test } from '@playwright/test'

test.describe('I18n', () => {
  test('Should be able to change language', async ({ page }) => {
    await page.goto('/integrations/i18n')

    const select = page.locator('select[name="currentLanguage"]')
    const greeting = page.locator('#greeting')
    const farewell = page.locator('#farewell')

    await expect(select).toHaveValue('en')
    await expect(greeting).toHaveText('Hello')
    await expect(farewell).toHaveText('Goodbye')

    await select.selectOption({ value: 'de' })
    await expect(select).toHaveValue('de')
    await expect(greeting).toHaveText('Hallo')
    await expect(farewell).toHaveText('Auf Wiedersehen')

    await select.selectOption({ value: 'hu' })
    await expect(select).toHaveValue('hu')
    await expect(greeting).toHaveText('Szia')
    await expect(farewell).toHaveText('Viszlát')

    await select.selectOption({ value: 'fr' })
    await expect(select).toHaveValue('fr')
    await expect(greeting).toHaveText('Bonjour')
    await expect(farewell).toHaveText('Goodbye')

    await select.selectOption({ value: 'es' })
    await expect(select).toHaveValue('es')
    await expect(greeting).toHaveText('Hola')
    await expect(farewell).toHaveText('Goodbye')
  })
})
