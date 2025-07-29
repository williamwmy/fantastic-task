import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display login page with all authentication options', async ({ page }) => {
    // Check that the login page loads
    await expect(page.locator('h1')).toContainText('Fantastic Task')
    
    // Check that all mode tabs are present - use first() for tab buttons
    await expect(page.getByText('Logg inn').first()).toBeVisible()
    await expect(page.getByText('Registrer').first()).toBeVisible()
    await expect(page.getByText('Glemt passord?')).toBeVisible()
    await expect(page.getByText('Opprett familie')).toBeVisible()
    await expect(page.getByText('Bli med i familie')).toBeVisible()
    
    // Check branding elements
    await expect(page.getByText('En familie-oppgaveapp som gjør hverdagen enklere')).toBeVisible()
    
    // Features are hidden on mobile viewports, so check viewport size first
    const viewport = page.viewportSize()
    if (viewport && viewport.width >= 768) {
      await expect(page.getByText('Hele familien')).toBeVisible()
      await expect(page.getByText('Poeng & belønninger')).toBeVisible()
      await expect(page.getByText('Fleksible oppgaver')).toBeVisible()
    }
  })

  test('should switch between authentication modes', async ({ page }) => {
    // Start with signin mode - check for submit button in form
    await expect(page.locator('form button[type="submit"]')).toContainText('Logg inn')
    await expect(page.getByPlaceholder('din@email.com')).toBeVisible()
    await expect(page.getByPlaceholder('Ditt passord')).toBeVisible()
    
    // Switch to signup mode - click the tab button (first one)
    await page.getByText('Registrer').first().click()
    await expect(page.locator('form button[type="submit"]')).toContainText('Registrer deg')
    await expect(page.getByPlaceholder('Bekreft passord')).toBeVisible()
    await expect(page.getByPlaceholder('Skriv inn familiekode (valgfritt)')).toBeVisible()
    
    // Switch to reset password mode
    await page.getByText('Glemt passord?').click()
    await expect(page.locator('form button[type="submit"]')).toContainText('Send reset-link')
    await expect(page.getByPlaceholder('din@email.com')).toBeVisible()
    await expect(page.getByPlaceholder('Ditt passord')).not.toBeVisible()
    
    // Switch to create family mode
    await page.getByText('Opprett familie').click()
    await expect(page.locator('form button[type="submit"]')).toContainText('Opprett familie')
    await expect(page.getByPlaceholder('F.eks. Familie Hansen')).toBeVisible()
    await expect(page.getByPlaceholder('F.eks. Mamma, Pappa, Ole')).toBeVisible()
    await expect(page.getByPlaceholder('din@email.com')).not.toBeVisible()
    
    // Switch to join family mode
    await page.getByText('Bli med i familie').click()
    await expect(page.locator('form button[type="submit"]')).toContainText('Bli med i familie')
    await expect(page.getByPlaceholder('Skriv inn familiekoden')).toBeVisible()
    await expect(page.getByPlaceholder('din@email.com')).not.toBeVisible()
  })

  test('should handle form validation', async ({ page }) => {
    // Test empty form submission
    await page.locator('form button[type="submit"]').click()
    
    // Check for HTML5 validation or custom error messages
    const emailInput = page.getByPlaceholder('din@email.com')
    const passwordInput = page.getByPlaceholder('Ditt passord')
    
    await expect(emailInput).toHaveAttribute('required')
    await expect(passwordInput).toHaveAttribute('required')
  })

  test('should handle signup password confirmation', async ({ page }) => {
    await page.getByText('Registrer').first().click()
    
    // Fill in form with mismatched passwords
    await page.getByPlaceholder('din@email.com').fill('test@example.com')
    await page.getByPlaceholder('Ditt passord').fill('password123')
    await page.getByPlaceholder('Bekreft passord').fill('password456')
    
    await page.locator('form button[type="submit"]').click()
    
    // Should show error message
    await expect(page.getByText('Passordene stemmer ikke overens')).toBeVisible()
  })

  test('should toggle password visibility', async ({ page }) => {
    // First make sure we're in signin mode and can see the password field
    await expect(page.getByPlaceholder('din@email.com')).toBeVisible()
    
    const passwordInput = page.getByPlaceholder('Ditt passord')
    // Find the eye toggle button next to the password field
    const passwordContainer = page.locator('div').filter({ has: passwordInput })
    const toggleButton = passwordContainer.locator('button[type="button"]')
    
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
    await page.locator('form button[type="submit"]').click()
    
    // Wait for form submission to process
    await page.waitForTimeout(1000)
  })

  test('should handle join family form', async ({ page }) => {
    await page.getByText('Bli med i familie').click()
    
    // Fill in family code
    await page.getByPlaceholder('Skriv inn familiekoden').fill('TEST123')
    
    // Submit form
    await page.locator('form button[type="submit"]').click()
    
    // Wait for form submission to process
    await page.waitForTimeout(1000)
  })

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Check that the page is still functional
    await expect(page.locator('h1')).toContainText('Fantastic Task')
    
    // Check that tabs wrap properly
    await expect(page.getByText('Logg inn').first()).toBeVisible()
    await expect(page.getByText('Registrer').first()).toBeVisible()
    
    // Test form interactions on mobile
    await page.getByText('Registrer').first().click()
    await expect(page.locator('form button[type="submit"]')).toContainText('Registrer deg')
  })

  test('should clear errors when switching modes', async ({ page }) => {
    // First, trigger an error in signin mode
    await page.getByPlaceholder('din@email.com').fill('invalid-email')
    await page.locator('form button[type="submit"]').click()
    
    // Switch to another mode - use first() for tab
    await page.getByText('Registrer').first().click()
    
    // Any error messages should be cleared
    await expect(page.getByText('Invalid')).not.toBeVisible()
  })

  test('should maintain form state when switching modes', async ({ page }) => {
    // Fill in email in signin mode
    await page.getByPlaceholder('din@email.com').fill('test@example.com')
    
    // Switch to reset password mode
    await page.getByText('Glemt passord?').click()
    
    // Switch back to signin mode - use first() for tab
    await page.getByText('Logg inn').first().click()
    
    // Email should still be filled (depending on implementation)
    const emailValue = await page.getByPlaceholder('din@email.com').inputValue()
    expect(emailValue).toBe('test@example.com')
  })
})