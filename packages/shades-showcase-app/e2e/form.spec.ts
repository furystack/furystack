import { expect, test } from '@playwright/test'

test.describe('Form', () => {
  test('should submit form after performing validation', async ({ page }) => {
    await page.goto('/form')

    const form = page.locator('form')

    const fieldset = form.locator('#fieldset')

    const emailField = form.locator('[name=email]')
    const passwordField = form.locator('[name=password]')
    const confirmPasswordField = form.locator('[name=confirmPassword]')

    const rawValue = page.locator('#raw')
    const validatedValue = page.locator('#validated')
    const statusValue = page.locator('#status')
    const fieldErrorsValue = page.locator('#fieldErrors')

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
