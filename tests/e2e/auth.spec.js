import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display login page with all authentication options', async ({ page }) => {
    // Check that the login page loads
    await expect(page.locator('h1')).toContainText('Fantastic Task')
    
    // Check that all mode tabs are present
    await expect(page.getByText('Logg inn')).toBeVisible()
    await expect(page.getByText('Registrer')).toBeVisible()
    await expect(page.getByText('Glemt passord?')).toBeVisible()
    await expect(page.getByText('Opprett familie')).toBeVisible()
    await expect(page.getByText('Bli med i familie')).toBeVisible()
    
    // Check branding elements
    await expect(page.getByText('En familie-oppgaveapp som gjør hverdagen enklere')).toBeVisible()
    await expect(page.getByText('Hele familien')).toBeVisible()
    await expect(page.getByText('Poeng & belønninger')).toBeVisible()
    await expect(page.getByText('Fleksible oppgaver')).toBeVisible()
  })

  test('should switch between authentication modes', async ({ page }) => {
    // Start with signin mode
    await expect(page.getByRole('button', { name: 'Logg inn' })).toBeVisible()
    await expect(page.getByPlaceholder('din@email.com')).toBeVisible()
    await expect(page.getByPlaceholder('Ditt passord')).toBeVisible()
    
    // Switch to signup mode
    await page.getByText('Registrer').click()
    await expect(page.getByRole('button', { name: 'Registrer deg' })).toBeVisible()
    await expect(page.getByPlaceholder('Bekreft passord')).toBeVisible()
    await expect(page.getByPlaceholder('Skriv inn familiekode (valgfritt)')).toBeVisible()
    
    // Switch to reset password mode
    await page.getByText('Glemt passord?').click()
    await expect(page.getByRole('button', { name: 'Send reset-link' })).toBeVisible()
    await expect(page.getByPlaceholder('din@email.com')).toBeVisible()
    await expect(page.getByPlaceholder('Ditt passord')).not.toBeVisible()
    
    // Switch to create family mode
    await page.getByText('Opprett familie').click()
    await expect(page.getByRole('button', { name: 'Opprett familie' })).toBeVisible()
    await expect(page.getByPlaceholder('F.eks. Familie Hansen')).toBeVisible()
    await expect(page.getByPlaceholder('F.eks. Mamma, Pappa, Ole')).toBeVisible()
    await expect(page.getByPlaceholder('din@email.com')).not.toBeVisible()
    
    // Switch to join family mode
    await page.getByText('Bli med i familie').click()
    await expect(page.getByRole('button', { name: 'Bli med i familie' })).toBeVisible()
    await expect(page.getByPlaceholder('Skriv inn familiekoden')).toBeVisible()
    await expect(page.getByPlaceholder('din@email.com')).not.toBeVisible()
  })

  test('should handle form validation', async ({ page }) => {
    // Test empty form submission
    await page.getByRole('button', { name: 'Logg inn' }).click()
    
    // Check for HTML5 validation or custom error messages
    const emailInput = page.getByPlaceholder('din@email.com')
    const passwordInput = page.getByPlaceholder('Ditt passord')
    
    await expect(emailInput).toHaveAttribute('required')
    await expect(passwordInput).toHaveAttribute('required')
  })

  test('should handle signup password confirmation', async ({ page }) => {
    await page.getByText('Registrer').click()
    
    // Fill in form with mismatched passwords
    await page.getByPlaceholder('din@email.com').fill('test@example.com')
    await page.getByPlaceholder('Ditt passord').fill('password123')
    await page.getByPlaceholder('Bekreft passord').fill('password456')
    
    await page.getByRole('button', { name: 'Registrer deg' }).click()
    
    // Should show error message
    await expect(page.getByText('Passordene stemmer ikke overens')).toBeVisible()
  })

  test('should toggle password visibility', async ({ page }) => {
    const passwordInput = page.getByPlaceholder('Ditt passord')
    const toggleButton = page.locator('button[type="button"]').last() // Eye icon button
    
    // Password should be hidden initially
    await expect(passwordInput).toHaveAttribute('type', 'password')
    
    // Click toggle to show password
    await toggleButton.click()
    await expect(passwordInput).toHaveAttribute('type', 'text')
    
    // Click toggle to hide password again
    await toggleButton.click()
    await expect(passwordInput).toHaveAttribute('type', 'password')
  })

  test('should handle create family form', async ({ page }) => {
    await page.getByText('Opprett familie').click()
    
    // Fill in family creation form
    await page.getByPlaceholder('F.eks. Familie Hansen').fill('E2E Test Familie')
    await page.getByPlaceholder('F.eks. Mamma, Pappa, Ole').fill('Test Admin')
    
    // Submit form (in test environment, this should work with mocked responses)
    await page.getByRole('button', { name: 'Opprett familie' }).click()
    
    // Should show loading state
    await expect(page.getByText('Behandler...')).toBeVisible()
    
    // Wait for the loading state to complete
    await page.waitForTimeout(1000)
  })

  test('should handle join family form', async ({ page }) => {
    await page.getByText('Bli med i familie').click()
    
    // Fill in family code
    await page.getByPlaceholder('Skriv inn familiekoden').fill('TEST123')
    
    // Submit form
    await page.getByRole('button', { name: 'Bli med i familie' }).click()
    
    // Should show loading state
    await expect(page.getByText('Behandler...')).toBeVisible()
    
    // Wait for the loading state to complete
    await page.waitForTimeout(1000)
  })

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Check that the page is still functional
    await expect(page.locator('h1')).toContainText('Fantastic Task')
    
    // Check that tabs wrap properly
    await expect(page.getByText('Logg inn')).toBeVisible()
    await expect(page.getByText('Registrer')).toBeVisible()
    
    // Test form interactions on mobile
    await page.getByText('Registrer').click()
    await expect(page.getByRole('button', { name: 'Registrer deg' })).toBeVisible()
  })

  test('should clear errors when switching modes', async ({ page }) => {
    // First, trigger an error in signin mode
    await page.getByPlaceholder('din@email.com').fill('invalid-email')
    await page.getByRole('button', { name: 'Logg inn' }).click()
    
    // Switch to another mode
    await page.getByText('Registrer').click()
    
    // Any error messages should be cleared
    await expect(page.getByText('Invalid')).not.toBeVisible()
  })

  test('should maintain form state when switching modes', async ({ page }) => {
    // Fill in email in signin mode
    await page.getByPlaceholder('din@email.com').fill('test@example.com')
    
    // Switch to reset password mode
    await page.getByText('Glemt passord?').click()
    
    // Switch back to signin mode
    await page.getByText('Logg inn').click()
    
    // Email should still be filled (depending on implementation)
    const emailValue = await page.getByPlaceholder('din@email.com').inputValue()
    expect(emailValue).toBe('test@example.com')
  })
})