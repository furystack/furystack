import { test, expect } from '@playwright/test'
import { pages } from './pages'
test.describe('Form', () => {
  test('should submit form after performing validation', async ({ page }) => {
    await page.goto(pages.form.url)

    const form = await page.locator('form')

    const emailField = await form.locator('[name=email]')
    const passwordField = await form.locator('[name=password]')
    const confirmPasswordField = await form.locator('[name=confirmPassword]')

    const rawValue = await page.locator('#raw')
    const validatedValue = await page.locator('#validated')
    const statusValue = await page.locator('#status')
    const fieldErrorsValue = await page.locator('#fieldErrors')

    const submitButton = await form.locator('text=Submit')

    await expect(rawValue).toHaveText(`Raw: null`)
    await expect(validatedValue).toHaveText('Validated: null')
    await expect(statusValue).toHaveText(`Status: {
  "isValid": null
}`)
    await expect(fieldErrorsValue).toHaveText('Field errors: {}')

    await submitButton.click()

    await expect(rawValue).toHaveText(`Raw: null`)
    await expect(validatedValue).toHaveText('Validated: null')
    await expect(statusValue).toHaveText(`Status: {
  "isValid": null
}`)
    await expect(fieldErrorsValue).toHaveText(`Field errors: {
  "email": {
    "validationResult": {
      "isValid": true
    },
    "validity": {
      "valid": false,
      "valueMissing": true,
      "typeMismatch": false,
      "patternMismatch": false,
      "tooLong": false,
      "tooShort": false,
      "rangeUnderflow": false,
      "rangeOverflow": false,
      "stepMismatch": false,
      "badInput": false
    }
  },
  "password": {
    "validationResult": {
      "isValid": true
    },
    "validity": {
      "valid": false,
      "valueMissing": true,
      "typeMismatch": false,
      "patternMismatch": false,
      "tooLong": false,
      "tooShort": false,
      "rangeUnderflow": false,
      "rangeOverflow": false,
      "stepMismatch": false,
      "badInput": false
    }
  },
  "confirmPassword": {
    "validationResult": {
      "isValid": true
    },
    "validity": {
      "valid": false,
      "valueMissing": true,
      "typeMismatch": false,
      "patternMismatch": false,
      "tooLong": false,
      "tooShort": false,
      "rangeUnderflow": false,
      "rangeOverflow": false,
      "stepMismatch": false,
      "badInput": false
    }
  }
}`)

    await emailField.fill('asd@gmail.com')
    await submitButton.click()
    await expect(rawValue).toHaveText(`Raw: {
  "email": "asd@gmail.com",
  "password": "",
  "confirmPassword": ""
}`)
    await expect(validatedValue).toHaveText('Validated: null')
    await expect(statusValue).toHaveText(`Status: {
  "isValid": false,
  "reason": "input-validation-failed"
}`)
    await expect(fieldErrorsValue).toHaveText(`Field errors: {
  "email": {
    "validationResult": {
      "isValid": true
    },
    "validity": {
      "valid": true,
      "valueMissing": false,
      "typeMismatch": false,
      "patternMismatch": false,
      "tooLong": false,
      "tooShort": false,
      "rangeUnderflow": false,
      "rangeOverflow": false,
      "stepMismatch": false,
      "badInput": false
    }
  },
  "password": {
    "validationResult": {
      "isValid": true
    },
    "validity": {
      "valid": false,
      "valueMissing": true,
      "typeMismatch": false,
      "patternMismatch": false,
      "tooLong": false,
      "tooShort": false,
      "rangeUnderflow": false,
      "rangeOverflow": false,
      "stepMismatch": false,
      "badInput": false
    }
  },
  "confirmPassword": {
    "validationResult": {
      "isValid": true
    },
    "validity": {
      "valid": false,
      "valueMissing": true,
      "typeMismatch": false,
      "patternMismatch": false,
      "tooLong": false,
      "tooShort": false,
      "rangeUnderflow": false,
      "rangeOverflow": false,
      "stepMismatch": false,
      "badInput": false
    }
  }
}`)
  })
})
