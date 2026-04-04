import { test, expect } from '@playwright/test'

test.describe('Incident Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/')
  })

  test('landing page shows hero and pricing', async ({ page }) => {
    await expect(page.getByText('IncidentIQ')).toBeVisible()
    await expect(page.getByText('Post-mortems write themselves')).toBeVisible()
    await expect(page.getByText('Start free trial')).toBeVisible()
    await expect(page.getByText('Starter')).toBeVisible()
    await expect(page.getByText('Pro')).toBeVisible()
    await expect(page.getByText('Enterprise')).toBeVisible()
  })

  test('shows login form', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByLabel('Email address')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
  })

  test('shows signup form with org name field', async ({ page }) => {
    await page.goto('/signup')
    await expect(page.getByLabel('Organization name')).toBeVisible()
    await expect(page.getByLabel('Work email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Create account' })).toBeVisible()
  })

  test('login shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email address').fill('invalid@example.com')
    await page.getByLabel('Password').fill('wrongpassword')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page.locator('.bg-red-50')).toBeVisible({ timeout: 5000 })
  })

  test('redirects unauthenticated users from dashboard', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })

  test('redirects unauthenticated users from incidents', async ({ page }) => {
    await page.goto('/incidents')
    await expect(page).toHaveURL(/\/login/)
  })

  test('reset password page is accessible', async ({ page }) => {
    await page.goto('/reset-password')
    await expect(page.getByText('Reset your password')).toBeVisible()
    await expect(page.getByLabel('Email address')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Send reset link' })).toBeVisible()
  })

  test('navigation links work on landing page', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'Sign in' }).click()
    await expect(page).toHaveURL(/\/login/)
  })
})