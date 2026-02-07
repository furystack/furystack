import { expect, test } from '@playwright/test'

test.describe('MFE', () => {
  test('Should be able to use MFE clients', async ({ page }) => {
    const addClient = async (name: string) => {
      await page.getByPlaceholder('MFE Name').fill(name)
      await page.getByRole('button', { name: 'Add MFE' }).click()
      await expect(page.getByRole('heading', { name })).toBeVisible()
    }

    const sendMessage = async ({
      sender,
      recipient,
      message,
    }: {
      sender: string
      recipient: string
      message: string
    }) => {
      await page.getByTitle(sender).getByRole('combobox').selectOption(recipient)
      await page.getByTitle(sender).getByPlaceholder('Message').fill(message)
      await page.getByTitle(sender).getByRole('button').click()
    }

    const expectMessage = async ({
      sender,
      recipient,
      message,
    }: {
      sender: string
      recipient: string
      message: string
    }) => {
      const container = page.getByTitle(recipient).locator('div').nth(1)
      await expect(container).toContainText(`${sender}:${message}`)
    }

    const expectNotHaveMessage = async ({
      sender,
      recipient,
      message,
    }: {
      sender: string
      recipient: string
      message: string
    }) => {
      const container = page.getByTitle(recipient).locator('div').nth(1)
      await expect(container).not.toContainText(`${sender}:${message}`)
    }

    await page.goto('/integrations/mfe')
    await expect(page.getByTestId('page-header-title')).toBeVisible()

    await addClient('Client 1')
    await addClient('Client 2')
    await addClient('Client 3')

    await sendMessage({
      sender: 'Client 1',
      recipient: 'Client 2',
      message: 'Hello from Client 1',
    })

    await expectMessage({
      sender: 'Client 1',
      recipient: 'Client 2',
      message: 'Hello from Client 1',
    })

    await expectNotHaveMessage({
      sender: 'Client 1',
      recipient: 'Client 3',
      message: 'Hello from Client 1',
    })

    await expectNotHaveMessage({
      sender: 'Client 2',
      recipient: 'Client 1',
      message: 'Hello from Client 1',
    })

    await sendMessage({
      sender: 'Client 3',
      recipient: '',
      message: 'Broadcast Hello from Client 3',
    })

    await expectMessage({
      sender: 'Client 3',
      recipient: 'Client 1',
      message: 'Broadcast Hello from Client 3',
    })

    await expectMessage({
      sender: 'Client 3',
      recipient: 'Client 2',
      message: 'Broadcast Hello from Client 3',
    })

    await expectMessage({
      sender: 'Client 3',
      recipient: 'Client 3',
      message: 'Broadcast Hello from Client 3',
    })
  })
})
