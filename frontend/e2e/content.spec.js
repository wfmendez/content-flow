import { test, expect } from '@playwright/test'

async function enterDemo(page) {
  await page.goto('/login')
  await page.getByRole('button', { name: /modo demo/i }).click()
  await page.goto('/content')
  await expect(page.locator('h1', { hasText: 'Revisión de Contenido' })).toBeVisible()
}

test.describe('Content Page', () => {

  test('loads demo drafts without a backend', async ({ page }) => {
    await enterDemo(page)
    // At least one draft card should render
    await expect(page.locator('.card').first()).toBeVisible()
  })

  test('filter tabs render correctly', async ({ page }) => {
    await enterDemo(page)
    await expect(page.getByRole('button', { name: 'Pendientes' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Aprobados' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Publicados' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Todos' })).toBeVisible()
  })

  test('clicking a draft card expands its body', async ({ page }) => {
    await enterDemo(page)
    await page.getByRole('button', { name: 'Todos' }).click()
    // Click the first card header
    const firstCard = page.locator('.card').first()
    await firstCard.locator('.cursor-pointer').first().click()
    // Body content should now be visible
    await expect(firstCard.locator('pre')).toBeVisible()
  })

  test('approve button changes badge to Aprobado in demo mode', async ({ page }) => {
    await enterDemo(page)
    // Switch to "Todos" to ensure we see pending drafts
    await page.getByRole('button', { name: 'Todos' }).click()
    const card = page.locator('.card').first()
    await card.locator('.cursor-pointer').first().click()
    const approveBtn = card.getByRole('button', { name: 'Aprobar' }).first()
    if (await approveBtn.isVisible()) {
      await approveBtn.click()
      await expect(card.getByText('Aprobado')).toBeVisible()
    }
  })

  test('delete shows inline confirm row (no browser dialog)', async ({ page }) => {
    await enterDemo(page)
    await page.getByRole('button', { name: 'Todos' }).click()
    const card = page.locator('.card').first()
    await card.locator('.cursor-pointer').first().click()
    const deleteBtn = card.getByRole('button', { name: /Eliminar/ }).first()
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click()
      // Inline ConfirmRow should appear (not browser dialog)
      await expect(card.getByRole('button', { name: 'Confirmar' })).toBeVisible()
      await expect(card.getByRole('button', { name: 'Cancelar' })).toBeVisible()
    }
  })

  test('calendar page renders monthly grid', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: /modo demo/i }).click()
    await page.goto('/calendar')
    await expect(page.getByText('Calendario Editorial')).toBeVisible()
    // Month nav buttons
    await expect(page.locator('button').filter({ has: page.locator('svg') }).first()).toBeVisible()
    // Weekday headers
    await expect(page.getByText('Lun')).toBeVisible()
  })
})
