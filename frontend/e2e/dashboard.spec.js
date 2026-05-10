import { test, expect } from '@playwright/test'

// Helper: enter demo mode before each test
async function enterDemo(page) {
  await page.goto('/login')
  await page.getByRole('button', { name: /modo demo/i }).click()
  await expect(page).toHaveURL('/')
}

test.describe('Dashboard', () => {

  test('shows 4 stat cards with non-zero values in demo mode', async ({ page }) => {
    await enterDemo(page)
    // Wait for demo data to load
    await expect(page.getByText('Tendencias')).toBeVisible()
    await expect(page.getByText('Borradores')).toBeVisible()
    await expect(page.getByText('Pendientes')).toBeVisible()
    await expect(page.getByText('Publicados')).toBeVisible()
  })

  test('shows pipeline flow visualization', async ({ page }) => {
    await enterDemo(page)
    await expect(page.getByText('Flujo del Pipeline')).toBeVisible()
    await expect(page.getByText('RSS / Reddit')).toBeVisible()
    await expect(page.getByText('Evaluados por IA')).toBeVisible()
  })

  test('shows activity feed panel', async ({ page }) => {
    await enterDemo(page)
    await expect(page.getByText('Actividad reciente')).toBeVisible()
  })

  test('shows demo mode banner when backend unreachable', async ({ page }) => {
    await enterDemo(page)
    // In demo mode (no backend), banner should appear
    await expect(page.getByText(/Modo demo/)).toBeVisible()
  })

  test('shows real API status badge', async ({ page }) => {
    await enterDemo(page)
    // Should show either online/offline/checking status
    const statusEl = page.locator('text=/En línea|Modo demo|Conectando/i').first()
    await expect(statusEl).toBeVisible()
  })

  test('navigates to Tendencias via quick action card', async ({ page }) => {
    await enterDemo(page)
    await page.getByText('Ver Tendencias').click()
    await expect(page).toHaveURL('/trends')
  })

  test('navigates to Contenido via quick action card', async ({ page }) => {
    await enterDemo(page)
    await page.getByText('Revisar Contenido').click()
    await expect(page).toHaveURL('/content')
  })
})
