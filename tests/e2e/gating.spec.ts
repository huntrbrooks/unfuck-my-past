import { test, expect } from '@playwright/test'

const lockTo = async (page: any, state: 'onboarding' | 'diagnostic' | 'unlocked') => {
  await page.route('**/api/me/status', async (route: any) => {
    const body =
      state === 'onboarding'
        ? { onboardingCompleted: false, diagnosticCompleted: false, nextStep: 'onboarding' }
        : state === 'diagnostic'
          ? { onboardingCompleted: true, diagnosticCompleted: false, nextStep: 'diagnostic' }
          : { onboardingCompleted: true, diagnosticCompleted: true, nextStep: 'unlocked' }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
  })
}

test.describe('Route gating', () => {
  const protectedPaths = ['/dashboard', '/preferences', '/diagnostic/results', '/report', '/program']

  test('redirects to onboarding when onboarding incomplete', async ({ page }) => {
    await lockTo(page, 'onboarding')
    for (const path of protectedPaths) {
      await page.goto(path)
      await page.waitForTimeout(200) // allow client-side push
      await expect(page).toHaveURL(/\/onboarding$/)
    }
  })

  test('redirects to diagnostic when onboarding done but diagnostic incomplete', async ({ page }) => {
    await lockTo(page, 'diagnostic')
    for (const path of protectedPaths) {
      await page.goto(path)
      await page.waitForTimeout(200)
      await expect(page).toHaveURL(/\/diagnostic$/)
    }
  })

  test('stays on page when both onboarding and diagnostic complete', async ({ page }) => {
    await lockTo(page, 'unlocked')
    for (const path of protectedPaths) {
      await page.goto(path)
      await page.waitForTimeout(200)
      await expect(page).toHaveURL(new RegExp(`${path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`))
    }
  })
})

test.describe('Navigation lock behavior', () => {
  test('locked nav routes send to next step', async ({ page }) => {
    await lockTo(page, 'onboarding')
    await page.goto('/')
    await page.click('text=Dashboard')
    await page.waitForTimeout(150)
    await expect(page).toHaveURL(/\/onboarding$/)
  })

  test('unlocked nav allows navigation', async ({ page }) => {
    await lockTo(page, 'unlocked')
    await page.goto('/')
    await page.click('text=Dashboard')
    await page.waitForTimeout(150)
    await expect(page).toHaveURL(/\/dashboard$/)
  })
})


