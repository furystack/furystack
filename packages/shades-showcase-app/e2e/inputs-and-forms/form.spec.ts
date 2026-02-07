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
    await expect(fieldErrorsValue).toHaveText('Field errors: {}')

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

    await emailField.type('asd@gmail.com')
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

    await passwordField.type('123456')
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

    await confirmPasswordField.type('password2')
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
    await confirmPasswordField.type('123456')
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
  test('should complete event registration successfully (happy path)', async ({ page }) => {
    await page.goto('/inputs-and-forms/form')

    const content = page.locator('forms-page')
    await content.waitFor({ state: 'visible' })

    // Scope to the second form (the advanced form)
    const advancedForm = page.locator('form').nth(1)

    // Scroll to the advanced form section
    await advancedForm.scrollIntoViewIfNeeded()

    // Fill in Full Name
    const fullNameInput = advancedForm.getByRole('textbox', { name: 'Full Name' })
    await fullNameInput.fill('Jane Doe')

    // Fill in Email
    const emailInput = advancedForm.getByRole('textbox', { name: 'Email' })
    await emailInput.fill('jane@example.com')

    // Select an experience level (Intermediate)
    const intermediateRadio = advancedForm.getByRole('radio', { name: 'Intermediate' })
    await intermediateRadio.check()

    // Select a Track (Frontend) - custom select component
    const trackTrigger = advancedForm.locator('shade-select').locator('[role="combobox"]')
    await trackTrigger.click()
    await advancedForm.locator('[role="listbox"]').getByRole('option', { name: 'Frontend' }).click()

    // Check optional checkboxes (Workshops)
    const workshopsCheckbox = advancedForm.getByRole('checkbox', { name: 'Workshops' })
    await workshopsCheckbox.check({ force: true })

    // Accept terms and conditions
    const termsCheckbox = advancedForm.getByRole('checkbox', { name: 'I accept the terms and conditions' })
    await termsCheckbox.scrollIntoViewIfNeeded()
    await termsCheckbox.check({ force: true })

    // Click Register
    const registerButton = advancedForm.getByRole('button', { name: 'Register' })
    await registerButton.click()

    // Verify the success alert appears
    const successAlert = content.getByText('Registration Successful')
    await expect(successAlert).toBeVisible()
  })

  test('should reset the form', async ({ page }) => {
    await page.goto('/inputs-and-forms/form')

    const content = page.locator('forms-page')
    await content.waitFor({ state: 'visible' })

    // Scope to the advanced form
    const advancedForm = page.locator('form').nth(1)
    await advancedForm.scrollIntoViewIfNeeded()

    // Fill in some fields
    const fullNameInput = advancedForm.getByRole('textbox', { name: 'Full Name' })
    await fullNameInput.fill('John Smith')
    await expect(fullNameInput).toHaveValue('John Smith')

    // Click Reset
    const resetButton = advancedForm.getByRole('button', { name: 'Reset' })
    await resetButton.scrollIntoViewIfNeeded()
    await resetButton.click()

    // Verify fields are cleared
    await expect(fullNameInput).toHaveValue('')
  })
})
