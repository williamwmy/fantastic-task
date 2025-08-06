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
    // Should show task list header with date (more specific - exact text match)
    await expect(page.getByText(/Oppgaver for \d{1,2}\.\d{1,2}\.\d{4}$/)).toBeVisible()
    
    // Should show task filter checkbox
    await expect(page.locator('label').filter({ hasText: /Vis kun mine oppgaver/ })).toBeVisible()
    
    // Should show individual tasks with titles (use first match to avoid strict mode issues)
    await expect(page.locator('div').filter({ hasText: /Rydde rommet|Ta ut søppel|Vaske opp/ }).first()).toBeVisible()
    
    // Should show task completion buttons
    await expect(page.locator('button').filter({ hasText: /Fullfør/ }).first()).toBeVisible()
    
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
    // Look for task completion buttons (green "Fullfør" buttons)
    const completeButtons = page.locator('button').filter({ hasText: /Fullfør/ })
    
    if (await completeButtons.count() > 0) {
      // Click first complete button
      await completeButtons.first().click()
      await page.waitForTimeout(500)
      
      // After completion, the task should change state - either show modal or complete immediately
      // Check if a modal appeared or if task was completed (shows different buttons)
      const modalVisible = await page.locator('div').filter({ hasText: /Hvor lenge tok|minutter/ }).count() > 0
      const taskCompleted = await page.locator('button').filter({ hasText: /Angre/ }).count() > 0
      
      if (modalVisible) {
        // Modal workflow
        await expect(page.locator('div').filter({ hasText: /Hvor lenge tok|minutter/ })).toBeVisible()
        await expect(page.locator('textarea, input').filter({ hasAttribute: 'placeholder' })).toBeVisible()
        await expect(page.locator('button').filter({ hasText: /Lagre|Ferdig/ })).toBeVisible()
        await expect(page.locator('button').filter({ hasText: /Avbryt|Lukk/ })).toBeVisible()
        // Close the modal
        await page.locator('button').filter({ hasText: /Avbryt|Lukk/ }).first().click()
      } else if (taskCompleted) {
        // Immediate completion workflow - task should show "Angre" button and completion status
        await expect(page.locator('button').filter({ hasText: /Angre/ })).toBeVisible()
        await expect(page.locator('div').filter({ hasText: /Godkjent|Fullført/ }).first()).toBeVisible()
      } else {
        // Fallback - at least verify tasks are still visible
        await expect(page.locator('div').filter({ hasText: /Rydde rommet|Ta ut søppel|Vaske opp/ })).toBeVisible()
      }
    } else {
      // If no completion buttons, at least verify tasks are visible
      await expect(page.locator('div').filter({ hasText: /Rydde rommet|Ta ut søppel|Vaske opp/ })).toBeVisible()
    }
  })

  test('should open and close statistics modal', async ({ page }) => {
    // Click statistics button
    await page.locator('button[title="Statistikk"]').click()
    await page.waitForTimeout(500)
    
    // Should show statistics modal with proper title
    await expect(page.locator('h2').filter({ hasText: /Familiestatistikk/ })).toBeVisible()
    
    // Should show leaderboard content with family members
    await expect(page.locator('div').filter({ hasText: /Leaderboard/ }).first()).toBeVisible()
    await expect(page.locator('div').filter({ hasText: /Test Forelder|Test Barn|Test Admin/ }).first()).toBeVisible()
    
    // Should show scores and statistics
    await expect(page.locator('div').filter({ hasText: /\d+ poeng/ }).first()).toBeVisible()
    
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
    await expect(page.locator('h2').filter({ hasText: /Familiestatistikk/ })).not.toBeVisible()
  })

  test('should handle add task flow (if permissions allow)', async ({ page }) => {
    // Look for add task button
    const addButton = page.locator('button[aria-label="Legg til oppgave"]')
    
    if (await addButton.count() > 0) {
      // User has edit permissions
      await addButton.click()
      await page.waitForTimeout(500)
      
      // Should show create task form with proper title
      await expect(page.locator('h2').filter({ hasText: /Opprett ny oppgave/ })).toBeVisible()
      
      // Should show task creation options
      await expect(page.locator('div').filter({ hasText: /Vanlige oppgaver/ }).first()).toBeVisible()
      await expect(page.locator('div').filter({ hasText: /Kjøkken|Rengjøring/ }).first()).toBeVisible()
      
      // Should have pre-made task options
      await expect(page.locator('div').filter({ hasText: /Tømme oppvaskmaskin|Støvsuge hele/ }).first()).toBeVisible()
      
      // Close form
      await page.locator('button').filter({ hasText: /Lukk/ }).first().click()
      await page.waitForTimeout(300)
      
      // Form should be closed
      await expect(page.locator('h2').filter({ hasText: /Opprett ny oppgave/ })).not.toBeVisible()
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
    // Get viewport size to detect mobile
    const viewport = page.viewportSize()
    const isMobile = viewport && viewport.width <= 768
    
    if (isMobile) {
      // On mobile, test touch interactions instead of keyboard navigation
      // Touch the statistics button directly
      await page.locator('button[title="Statistikk"]').click()
      await page.waitForTimeout(300)
      
      // Should open statistics modal
      await expect(page.locator('h2').filter({ hasText: /Familiestatistikk/ })).toBeVisible()
      
      // Close modal using the actual close button (more reliable on mobile)
      await page.locator('button').filter({ hasText: /Lukk/ }).click()
      await page.waitForTimeout(300)
      
      // Modal should be closed
      await expect(page.locator('h2').filter({ hasText: /Familiestatistikk/ })).not.toBeVisible()
    } else {
      // Desktop keyboard navigation
      // Focus on the first interactive element (profile button)
      await page.locator('button[title="Åpne profil og innstillinger"]').focus()
      
      // Verify the profile button is focused and can be activated with Enter
      await page.keyboard.press('Enter')
      await page.waitForTimeout(300)
      
      // Should open profile menu or modal - check if any modal/menu appeared
      const modalOrMenuVisible = await page.locator('div[role="dialog"], div[role="menu"], h2').count() > 0
      
      // Test escape key to close any opened modal/menu
      if (modalOrMenuVisible) {
        await page.keyboard.press('Escape')
        await page.waitForTimeout(300)
      }
      
      // Test keyboard navigation to statistics button
      await page.locator('button[title="Statistikk"]').focus()
      await page.keyboard.press('Enter')
      await page.waitForTimeout(300)
      
      // Should open statistics modal
      await expect(page.locator('h2').filter({ hasText: /Familiestatistikk/ })).toBeVisible()
      
      // Close modal by clicking outside
      await page.mouse.click(50, 50)
      await page.waitForTimeout(300)
      
      // Modal should be closed
      await expect(page.locator('h2').filter({ hasText: /Familiestatistikk/ })).not.toBeVisible()
    }
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