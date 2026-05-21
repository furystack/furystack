import { expect, test } from '@playwright/test'

test.describe('Form', () => {
  test('should submit form after performing validation', async ({ page }) => {
    await page.goto('/inputs-and-forms/form')

    const form = page.locator('form').first()

    const fieldset = form.locator('#fieldset')

    const emailField = form.locator('[name=email]')
    const passwordField = form.locator('[name=password]')
    const confirmPasswordField = form.locator('[name=confirmPassword]')

    const rawValue = form.locator('#raw')
    const validatedValue = form.locator('#validated')
    const statusValue = form.locator('#status')
    const fieldErrorsValue = form.locator('#fieldErrors')

    const submitButton = form.locator('text=Submit')

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
    "validity": {}
  },
  "password": {
    "validationResult": {
      "isValid": true
    },
    "validity": {}
  },
  "confirmPassword": {
    "validationResult": {
      "isValid": false,
      "message": "Passwords do not match"
    },
    "validity": {}
  }
}`)

    await expect(fieldset).toHaveScreenshot('fieldset-1.png')

    await submitButton.click()

    await expect(fieldset).toHaveScreenshot('fieldset-2.png')

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
      "isValid": false,
      "message": "Passwords do not match"
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

    await expect(fieldset).toHaveScreenshot('fieldset-3.png')

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
      "isValid": false,
      "message": "Passwords do not match"
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

    await passwordField.fill('123456')
    await submitButton.click()

    await expect(fieldset).toHaveScreenshot('fieldset-4.png')

    await expect(rawValue).toHaveText(`Raw: {
  "email": "asd@gmail.com",
  "password": "123456",
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
  "confirmPassword": {
    "validationResult": {
      "isValid": false,
      "message": "Passwords do not match"
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

    await confirmPasswordField.fill('password2')
    await submitButton.click()

    await expect(fieldset).toHaveScreenshot('fieldset-5.png')

    await expect(rawValue).toHaveText(`Raw: {
  "email": "asd@gmail.com",
  "password": "123456",
  "confirmPassword": "password2"
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
  "confirmPassword": {
    "validationResult": {
      "isValid": false,
      "message": "Passwords do not match"
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
  }
}`)

    await confirmPasswordField.clear()
    await confirmPasswordField.fill('123456')
    await submitButton.click()

    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toBe(`Submitted: {
  "email": "asd@gmail.com",
  "password": "123456",
  "confirmPassword": "123456"
}`)
      await dialog.accept()
    })

    await expect(fieldset).toHaveScreenshot('fieldset-6.png')

    await expect(rawValue).toHaveText(`Raw: {
  "email": "asd@gmail.com",
  "password": "123456",
  "confirmPassword": "123456"
}`)

    await expect(validatedValue).toHaveText(`Validated: {
  "email": "asd@gmail.com",
  "password": "123456",
  "confirmPassword": "123456"
}`)
    await expect(statusValue).toHaveText(`Status: {
  "isValid": true
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
  "confirmPassword": {
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
  }
}`)
  })
})

test.describe('Advanced Form', () => {
  test('should complete event registration and reset the form', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)
    await page.goto('/inputs-and-forms/form')

    const content = page.locator('forms-page')
    await content.waitFor({ state: 'visible' })

    // Scope to the second form (the advanced form)
    const advancedForm = page.locator('form').nth(1)

    // Scroll to the advanced form section
    await advancedForm.scrollIntoViewIfNeeded()

    // Select an experience level (Intermediate) - use native click to work around
    // Playwright touch emulation issues with custom-styled radios after form fill
    const intermediateRadio = advancedForm.getByRole('radio', { name: 'Intermediate' })
    await intermediateRadio.evaluate((el: HTMLInputElement) => el.click())
    await expect(intermediateRadio).toBeChecked()

    // Select a Track (Frontend) - custom select component
    const trackTrigger = advancedForm.locator('shade-select').locator('[role="combobox"]')
    await trackTrigger.click()
    await advancedForm.locator('[role="listbox"]').getByRole('option', { name: 'Frontend' }).click()

    // Verify the dropdown closed and value is displayed
    await expect(trackTrigger.locator('.select-value')).toContainText('Frontend')

    // Check optional checkboxes (Workshops) - use native click for cross-browser compatibility
    const workshopsCheckbox = advancedForm.getByRole('checkbox', { name: 'Workshops' })
    await workshopsCheckbox.evaluate((el: HTMLInputElement) => el.click())
    await expect(workshopsCheckbox).toBeChecked()

    // Accept terms and conditions
    const termsCheckbox = advancedForm.getByRole('checkbox', { name: 'I accept the terms and conditions' })
    await termsCheckbox.scrollIntoViewIfNeeded()
    await termsCheckbox.evaluate((el: HTMLInputElement) => el.click())
    await expect(termsCheckbox).toBeChecked()

    // Fill text inputs last to avoid firefox re-render clearing values.
    // Use pressSequentially for cross-browser compatibility with Shades' re-rendering.
    const fullNameInput = advancedForm.getByRole('textbox', { name: 'Full Name' })
    await fullNameInput.scrollIntoViewIfNeeded()
    await fullNameInput.click()
    await fullNameInput.pressSequentially('Jane Doe', { delay: 20 })
    await expect(fullNameInput).toHaveValue('Jane Doe')

    const emailInput = advancedForm.getByRole('textbox', { name: 'Email' })
    await emailInput.click()
    await emailInput.pressSequentially('jane@example.com', { delay: 20 })
    await expect(emailInput).toHaveValue('jane@example.com')

    // Click Register
    const registerButton = advancedForm.getByRole('button', { name: 'Register' })
    await registerButton.scrollIntoViewIfNeeded()
    await registerButton.click()

    // Verify the success alert appears (allow extra time for form processing)
    const successAlert = content.getByText('Registration Successful')
    await expect(successAlert).toBeVisible({ timeout: 10000 })

    // Reset the form: clear field, fill a new value, and verify reset clears it
    await advancedForm.scrollIntoViewIfNeeded()
    const resetNameInput = advancedForm.getByRole('textbox', { name: 'Full Name' })
    await resetNameInput.fill('')
    await resetNameInput.click()
    await resetNameInput.pressSequentially('John Smith', { delay: 20 })
    await expect(resetNameInput).toHaveValue('John Smith')

    const resetButton = advancedForm.getByRole('button', { name: 'Reset' })
    await resetButton.scrollIntoViewIfNeeded()
    await resetButton.click()

    await expect(resetNameInput).toHaveValue('')
  })

  test('should reflect input changes in the form raw data', async ({ page }) => {
    await page.goto('/inputs-and-forms/form')

    const content = page.locator('forms-page')
    await content.waitFor({ state: 'visible' })

    const advancedForm = page.locator('form').nth(1)
    await advancedForm.scrollIntoViewIfNeeded()

    const rawValue = advancedForm.locator('#raw')

    // Returns the parsed object from the FormStatusMonitor's `#raw` block, or
    // `null` if the form has not received any change events yet.
    const readRawData = async (): Promise<Record<string, string> | null> => {
      const text = (await rawValue.textContent()) ?? ''
      const jsonText = text.replace(/^Raw:\s*/, '')
      if (jsonText === 'null') {
        return null
      }
      return JSON.parse(jsonText) as Record<string, string>
    }

    await expect(rawValue).toHaveText('Raw: null')

    // Toggle the Workshops checkbox — change should bubble to the form
    // and populate `rawFormData` with `workshops: "yes"`.
    const workshopsCheckbox = advancedForm.getByRole('checkbox', { name: 'Workshops' })
    await workshopsCheckbox.scrollIntoViewIfNeeded()
    await workshopsCheckbox.evaluate((el: HTMLInputElement) => el.click())
    await expect(workshopsCheckbox).toBeChecked()
    await expect.poll(readRawData).toMatchObject({ workshops: 'yes' })

    // Toggle the Networking checkbox; both keys should now be present.
    const networkingCheckbox = advancedForm.getByRole('checkbox', { name: 'Networking' })
    await networkingCheckbox.evaluate((el: HTMLInputElement) => el.click())
    await expect(networkingCheckbox).toBeChecked()
    await expect.poll(readRawData).toMatchObject({ workshops: 'yes', networking: 'yes' })

    // Toggle the Switch — same propagation contract as Checkbox.
    const notificationsSwitch = advancedForm.getByRole('switch', { name: 'Receive email notifications' })
    await notificationsSwitch.scrollIntoViewIfNeeded()
    await notificationsSwitch.evaluate((el: HTMLInputElement) => el.click())
    await expect(notificationsSwitch).toBeChecked()
    await expect.poll(readRawData).toMatchObject({
      workshops: 'yes',
      networking: 'yes',
      notifications: 'yes',
    })

    // Select the Intermediate radio — RadioGroup forwards `name` to its
    // children, so FormData should report `experienceLevel: "intermediate"`.
    const intermediateRadio = advancedForm.getByRole('radio', { name: 'Intermediate' })
    await intermediateRadio.scrollIntoViewIfNeeded()
    await intermediateRadio.evaluate((el: HTMLInputElement) => el.click())
    await expect(intermediateRadio).toBeChecked()
    await expect.poll(readRawData).toMatchObject({
      workshops: 'yes',
      networking: 'yes',
      notifications: 'yes',
      experienceLevel: 'intermediate',
    })

    // Pick a Track from the custom Select component. Even though Select is
    // not a native input, it must dispatch a change event so the form
    // observes the new value.
    const trackTrigger = advancedForm.locator('shade-select').locator('[role="combobox"]')
    await trackTrigger.scrollIntoViewIfNeeded()
    await trackTrigger.click()
    await advancedForm.locator('[role="listbox"]').getByRole('option', { name: 'Frontend' }).click()
    await expect(trackTrigger.locator('.select-value')).toContainText('Frontend')
    await expect.poll(readRawData).toMatchObject({
      workshops: 'yes',
      networking: 'yes',
      notifications: 'yes',
      experienceLevel: 'intermediate',
      track: 'frontend',
    })

    // Untick Workshops — the key should disappear from raw data.
    await workshopsCheckbox.evaluate((el: HTMLInputElement) => el.click())
    await expect(workshopsCheckbox).not.toBeChecked()
    await expect.poll(async () => Object.keys((await readRawData()) ?? {})).not.toContain('workshops')
    await expect.poll(readRawData).toMatchObject({
      networking: 'yes',
      notifications: 'yes',
      experienceLevel: 'intermediate',
      track: 'frontend',
    })
  })

  test('should clear raw form data on reset', async ({ page }) => {
    await page.goto('/inputs-and-forms/form')

    const content = page.locator('forms-page')
    await content.waitFor({ state: 'visible' })

    const advancedForm = page.locator('form').nth(1)
    await advancedForm.scrollIntoViewIfNeeded()

    const rawValue = advancedForm.locator('#raw')

    // Populate at least one field so `rawFormData` becomes a real object.
    const networkingCheckbox = advancedForm.getByRole('checkbox', { name: 'Networking' })
    await networkingCheckbox.scrollIntoViewIfNeeded()
    await networkingCheckbox.evaluate((el: HTMLInputElement) => el.click())
    await expect(networkingCheckbox).toBeChecked()
    await expect(rawValue).not.toHaveText('Raw: null')

    // Click Reset. The native reset event fires before the form's onreset
    // handler, so this also exercises real-browser ordering that the JSDOM
    // unit tests cannot replicate.
    const resetButton = advancedForm.getByRole('button', { name: 'Reset' })
    await resetButton.scrollIntoViewIfNeeded()
    await resetButton.click()

    await expect(rawValue).toHaveText('Raw: null')
    await expect(networkingCheckbox).not.toBeChecked()
  })
})
