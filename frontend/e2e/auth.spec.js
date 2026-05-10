import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {

  test('redirects unauthenticated users to /login', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByText('ContentFlow')).toBeVisible()
  })

  test('shows demo credentials prominently on login page', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByText('demo@contentflow.io')).toBeVisible()
    await expect(page.getByText('demo2024')).toBeVisible()
  })

  test('enters demo mode without credentials', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: /modo demo/i }).click()
    await expect(page).toHaveURL('/')
    await expect(page.getByText('Dashboard')).toBeVisible()
  })

  test('auto-fills credentials from demo hint button', async ({ page }) => {
    await page.goto('/login')
    await page.getByText('Cuenta demo').click()
    await expect(page.locator('input[type="email"]')).toHaveValue('demo@contentflow.io')
    await expect(page.locator('input[type="password"]')).toHaveValue('demo2024')
  })

  test('logout button returns to login page', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: /modo demo/i }).click()
    await expect(page).toHaveURL('/')
    await page.getByTitle('Cerrar sesión').click()
    await expect(page).toHaveURL(/\/login/)
  })
})
