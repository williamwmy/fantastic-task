import { test, expect } from '@playwright/test'

test.describe('Task Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    
    // Wait for the mock user to be loaded - the app should automatically load with test user
    // When VITE_LOCAL_TEST_USER=true, the app bypasses login and shows the main interface
    await page.waitForTimeout(2000) // Give time for the app to initialize with mock data
    
    // Verify we're in the main app (not on login page) by looking for the profile button specifically
    await expect(page.locator('button[title="Åpne profil og innstillinger"]')).toBeVisible({ timeout: 10000 })
  })

  test('should display main task interface when logged in', async ({ page }) => {
    // Should show profile circle with user initial - use specific title selector
    await expect(page.locator('button[title="Åpne profil og innstillinger"]')).toBeVisible()
    
    // Should show points balance - use the exact text selector
    await expect(page.getByText('100 poeng')).toBeVisible()
    
    // Should show current date in Norwegian format
    await expect(page.locator('span').filter({ hasText: /\w+dag \d{2}\.\d{2}/ })).toBeVisible()
    
    // Should show date navigation arrows
    await expect(page.locator('button[aria-label="Forrige dag"]')).toBeVisible()
    await expect(page.locator('button[aria-label="Neste dag"]')).toBeVisible()
  })

  test('should navigate between dates and update display', async ({ page }) => {
    // Get current date text
    const currentDateText = await page.locator('span').filter({ hasText: /\w+dag \d{2}\.\d{2}/ }).textContent()
    
    // Click previous day
    await page.locator('button[aria-label="Forrige dag"]').click()
    await page.waitForTimeout(500)
    
    // Date should have changed
    const previousDateText = await page.locator('span').filter({ hasText: /\w+dag \d{2}\.\d{2}/ }).textContent()
    expect(previousDateText).not.toBe(currentDateText)
    
    // Click next day twice to go one day forward from original
    await page.locator('button[aria-label="Neste dag"]').click()
    await page.waitForTimeout(500)
    await page.locator('button[aria-label="Neste dag"]').click()
    await page.waitForTimeout(500)
    
    // Date should be different from both previous states
    const nextDateText = await page.locator('span').filter({ hasText: /\w+dag \d{2}\.\d{2}/ }).textContent()
    expect(nextDateText).not.toBe(currentDateText)
    expect(nextDateText).not.toBe(previousDateText)
  })

  test('should display task interface elements', async ({ page }) => {
    // Should show task list area (might be empty but container should exist)
    await expect(page.locator('div').filter({ hasText: /Ingen oppgaver|oppgaver for/ }).or(
      page.locator('div[style*="padding"]').filter({ hasText: /Fullført|Ikke startet/ })
    )).toBeVisible()
    
    // Should have add task button (for users with edit permissions)
    const addButton = page.locator('button[aria-label="Legg til oppgave"]')
    if (await addButton.count() > 0) {
      await expect(addButton).toBeVisible()
    }
    
    // Points balance should be visible and numeric
    const pointsText = await page.getByText('100 poeng').textContent()
    expect(pointsText).toMatch(/\d+\s+poeng/)
  })

  test('should show profile and action buttons', async ({ page }) => {
    // Should show profile button with user initial and can be clicked
    const profileButton = page.locator('button[title="Åpne profil og innstillinger"]')
    await expect(profileButton).toBeVisible()
    
    // Should show statistics button
    await expect(page.locator('button[title="Statistikk"]')).toBeVisible()
    
    // Should show points history button
    await expect(page.locator('button[title="Poenghistorikk"]')).toBeVisible()
    
    // May show admin button (role-dependent)
    const adminButton = page.locator('button[title="Admin-panel"]')
    if (await adminButton.count() > 0) {
      await expect(adminButton).toBeVisible()
    }
    
    // May show verification button for parents
    const verifyButton = page.locator('button[title*="Verifiser"]')
    if (await verifyButton.count() > 0) {
      await expect(verifyButton).toBeVisible()
    }
  })

  test('should handle task completion interactions', async ({ page }) => {
    // Look for task completion buttons
    const completeButtons = page.locator('button').filter({ hasText: /Fullf\u00f8r oppgave|Fullf\u00f8r/ })
    
    if (await completeButtons.count() > 0) {
      // Click first complete button
      await completeButtons.first().click()
      await page.waitForTimeout(500)
      
      // Should show completion modal with time and comment fields
      await expect(page.locator('div').filter({ hasText: /Hvor lenge tok/ })).toBeVisible()
      await expect(page.locator('textarea, input').filter({ hasAttribute: 'placeholder' })).toBeVisible()
      
      // Should have save and cancel buttons
      await expect(page.locator('button').filter({ hasText: /Lagre|Ferdig/ })).toBeVisible()
      await expect(page.locator('button').filter({ hasText: /Avbryt|Lukk/ })).toBeVisible()
      
      // Close the modal
      await page.locator('button').filter({ hasText: /Avbryt|Lukk/ }).first().click()
    } else {
      // If no tasks to complete, verify we see appropriate message
      await expect(page.locator('div').filter({ hasText: /Ingen oppgaver|oppgaver for/ })).toBeVisible()
    }
  })

  test('should open and close statistics modal', async ({ page }) => {
    // Click statistics button
    await page.locator('button[title="Statistikk"]').click()
    await page.waitForTimeout(500)
    
    // Should show statistics modal with proper title
    await expect(page.locator('h2').filter({ hasText: /Statistikk/ })).toBeVisible()
    
    // Should show chart or statistics content
    await expect(page.locator('div').filter({
      hasText: /Oppgaver fullf\u00f8rt|Poeng tjent|Denne uke/
    }).or(page.locator('canvas'))).toBeVisible()
    
    // Close modal by clicking outside or close button
    const closeButton = page.locator('button').filter({ hasText: /\u00d7|Lukk/ })
    if (await closeButton.count() > 0) {
      await closeButton.first().click()
    } else {
      // Click outside modal
      await page.mouse.click(50, 50)
    }
    await page.waitForTimeout(300)
    
    // Modal should be closed
    await expect(page.locator('h2').filter({ hasText: /Statistikk/ })).not.toBeVisible()
  })

  test('should handle add task flow (if permissions allow)', async ({ page }) => {
    // Look for add task button
    const addButton = page.locator('button[aria-label="Legg til oppgave"]')
    
    if (await addButton.count() > 0) {
      // User has edit permissions
      await addButton.click()
      await page.waitForTimeout(500)
      
      // Should show create task form with proper fields
      await expect(page.locator('h2').filter({ hasText: /Ny oppgave|Legg til/ })).toBeVisible()
      
      // Should have title input
      const titleInput = page.locator('input[placeholder*="tittel"], input[name="title"]')
      await expect(titleInput).toBeVisible()
      
      // Test form interaction
      await titleInput.fill('E2E Test Oppgave')
      
      // Should have assignment options
      await expect(page.locator('select, div').filter({ hasText: /Tildel til|Hvem skal/ })).toBeVisible()
      
      // Close form
      await page.locator('button').filter({ hasText: /Avbryt|Lukk/ }).first().click()
      await page.waitForTimeout(300)
      
      // Form should be closed
      await expect(page.locator('h2').filter({ hasText: /Ny oppgave|Legg til/ })).not.toBeVisible()
    } else {
      // User doesn't have edit permissions - this is also valid
      console.log('User does not have task creation permissions')
    }
  })

  test('should be responsive on different screen sizes', async ({ page }) => {
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForTimeout(500)
    
    // Core elements should still be visible on mobile
    await expect(page.locator('button[title="Åpne profil og innstillinger"]')).toBeVisible()
    await expect(page.getByText('100 poeng')).toBeVisible()
    await expect(page.locator('button[aria-label="Forrige dag"]')).toBeVisible()
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.waitForTimeout(500)
    
    // Same elements should be visible
    await expect(page.locator('button[title="Åpne profil og innstillinger"]')).toBeVisible()
    await expect(page.getByText('100 poeng')).toBeVisible()
    
    // Test desktop view  
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.waitForTimeout(500)
    
    // All buttons should be visible and properly spaced
    await expect(page.locator('button[title="Statistikk"]')).toBeVisible()
    await expect(page.locator('button[title="Poenghistorikk"]')).toBeVisible()
  })

  test('should handle keyboard navigation', async ({ page }) => {
    // Test tab navigation through interactive elements
    await page.keyboard.press('Tab')
    await page.waitForTimeout(200)
    
    // Should focus on the profile button first
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()
    
    // Continue tabbing to reach other buttons
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    
    // Should be able to activate buttons with Enter
    await page.keyboard.press('Enter')
    await page.waitForTimeout(300)
    
    // Test escape key to close any opened modal
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
  })

  test('should maintain profile state during date navigation', async ({ page }) => {
    // Get initial points value
    const initialPoints = await page.getByText('100 poeng').textContent()
    
    // Get initial profile letter
    const initialProfile = await page.locator('button[title="Åpne profil og innstillinger"]').textContent()
    
    // Navigate to different dates
    await page.locator('button[aria-label="Forrige dag"]').click()
    await page.waitForTimeout(500)
    
    // Profile and points should remain the same
    const profileAfterNav = await page.locator('button[title="Åpne profil og innstillinger"]').textContent()
    const pointsAfterNav = await page.getByText('100 poeng').textContent()
    
    expect(profileAfterNav).toBe(initialProfile)
    expect(pointsAfterNav).toBe(initialPoints)
    
    // Navigate back to original date
    await page.locator('button[aria-label="Neste dag"]').click()
    await page.waitForTimeout(500)
    
    // State should still be maintained
    const finalProfile = await page.locator('button[title="Åpne profil og innstillinger"]').textContent()
    const finalPoints = await page.getByText('100 poeng').textContent()
    
    expect(finalProfile).toBe(initialProfile)
    expect(finalPoints).toBe(initialPoints)
  })
})