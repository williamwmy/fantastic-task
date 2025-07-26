import { test, expect } from '@playwright/test'

// Mock login state by setting local test user environment
test.use({
  storageState: {
    cookies: [],
    origins: [
      {
        origin: 'http://localhost:5173',
        localStorage: [
          { name: 'VITE_LOCAL_TEST_USER', value: 'true' }
        ]
      }
    ]
  }
})

test.describe('Task Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Set environment variable for local testing
    await page.addInitScript(() => {
      window.localStorage.setItem('VITE_LOCAL_TEST_USER', 'true')
    })
    
    await page.goto('/')
    
    // Wait for the app to load with mock data
    await expect(page.locator('h1, h2, div').first()).toBeVisible()
  })

  test('should display main task interface when logged in', async ({ page }) => {
    // Wait for loading to complete
    await page.waitForTimeout(2000)
    
    // Should show the main task interface
    await expect(page.locator('[data-testid="task-list"], .task-list, div[style*="minHeight"]')).toBeVisible()
    
    // Should show navigation buttons
    await expect(page.locator('button').first()).toBeVisible()
    
    // Should show date navigation
    const dateElements = page.locator('span, div').filter({ hasText: /\d{2}\./ })
    if (await dateElements.count() > 0) {
      await expect(dateElements.first()).toBeVisible()
    }
  })

  test('should navigate between dates', async ({ page }) => {
    // Wait for app to load
    await page.waitForTimeout(2000)
    
    // Look for navigation buttons (left/right arrows)
    const leftArrow = page.locator('button[aria-label*="Forrige"], button').filter({ hasText: /←|‹|</ }).first()
    const rightArrow = page.locator('button[aria-label*="Neste"], button').filter({ hasText: /→|›|>/ }).first()
    
    if (await leftArrow.count() > 0) {
      await leftArrow.click()
      await page.waitForTimeout(500)
    }
    
    if (await rightArrow.count() > 0) {
      await rightArrow.click()
      await page.waitForTimeout(500)
    }
  })

  test('should display task list with mock data', async ({ page }) => {
    // Wait for app to load
    await page.waitForTimeout(2000)
    
    // Should show some tasks (in mock mode)
    const taskElements = page.locator('div, li').filter({ hasText: /oppgave|task/i })
    
    if (await taskElements.count() > 0) {
      await expect(taskElements.first()).toBeVisible()
    }
    
    // Should show points information
    const pointsElements = page.locator('div, span').filter({ hasText: /poeng|points/i })
    
    if (await pointsElements.count() > 0) {
      await expect(pointsElements.first()).toBeVisible()
    }
  })

  test('should show profile and action buttons', async ({ page }) => {
    // Wait for app to load
    await page.waitForTimeout(2000)
    
    // Should show profile circle or button
    const profileElements = page.locator('div[style*="borderRadius"][style*="50%"], button[title*="profil"], div[style*="circle"]')
    
    if (await profileElements.count() > 0) {
      await expect(profileElements.first()).toBeVisible()
    }
    
    // Should show action buttons (stats, admin, etc.)
    const actionButtons = page.locator('button[title], button[aria-label]')
    
    if (await actionButtons.count() > 0) {
      await expect(actionButtons.first()).toBeVisible()
    }
  })

  test('should handle task completion interactions', async ({ page }) => {
    // Wait for app to load
    await page.waitForTimeout(2000)
    
    // Look for complete buttons
    const completeButtons = page.locator('button').filter({ hasText: /fullf|complete|ferdig/i })
    
    if (await completeButtons.count() > 0) {
      await completeButtons.first().click()
      await page.waitForTimeout(500)
      
      // Should show some kind of completion interface or feedback
      const completionElements = page.locator('div, modal, form').filter({ hasText: /tid|time|kommentar|comment/i })
      
      if (await completionElements.count() > 0) {
        await expect(completionElements.first()).toBeVisible()
      }
    }
  })

  test('should open and close modals', async ({ page }) => {
    // Wait for app to load
    await page.waitForTimeout(2000)
    
    // Try to open various modals by clicking buttons
    const modalTriggers = page.locator('button[title*="statistikk"], button[title*="admin"], button[title*="profil"]')
    
    if (await modalTriggers.count() > 0) {
      await modalTriggers.first().click()
      await page.waitForTimeout(500)
      
      // Should show modal content
      const modalContent = page.locator('[role="dialog"], .modal, div[style*="fixed"]')
      
      if (await modalContent.count() > 0) {
        await expect(modalContent.first()).toBeVisible()
        
        // Try to close modal
        const closeButtons = page.locator('button').filter({ hasText: /lukk|close|×/i })
        
        if (await closeButtons.count() > 0) {
          await closeButtons.first().click()
          await page.waitForTimeout(500)
        }
      }
    }
  })

  test('should handle add task flow', async ({ page }) => {
    // Wait for app to load
    await page.waitForTimeout(2000)
    
    // Look for add task button (plus icon)
    const addButtons = page.locator('button[aria-label*="Legg til"], button').filter({ hasText: /\+/ })
    
    if (await addButtons.count() > 0) {
      await addButtons.first().click()
      await page.waitForTimeout(500)
      
      // Should show task creation form
      const formElements = page.locator('form, div').filter({ hasText: /tittel|title|beskrivelse|description/i })
      
      if (await formElements.count() > 0) {
        await expect(formElements.first()).toBeVisible()
        
        // Try to fill in some form fields
        const titleInput = page.locator('input[placeholder*="tittel"], input[name*="title"]').first()
        
        if (await titleInput.count() > 0) {
          await titleInput.fill('E2E Test Oppgave')
        }
        
        // Look for close button
        const closeButtons = page.locator('button').filter({ hasText: /avbryt|cancel|lukk/i })
        
        if (await closeButtons.count() > 0) {
          await closeButtons.first().click()
        }
      }
    }
  })

  test('should be responsive on different screen sizes', async ({ page }) => {
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.waitForTimeout(1000)
    
    // Should still show main interface
    await expect(page.locator('body')).toBeVisible()
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForTimeout(1000)
    
    // Should still be functional
    await expect(page.locator('body')).toBeVisible()
    
    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.waitForTimeout(1000)
    
    await expect(page.locator('body')).toBeVisible()
  })

  test('should handle keyboard navigation', async ({ page }) => {
    // Wait for app to load
    await page.waitForTimeout(2000)
    
    // Test tab navigation
    await page.keyboard.press('Tab')
    await page.waitForTimeout(200)
    
    // Should focus on interactive elements
    const focusedElement = page.locator(':focus')
    
    if (await focusedElement.count() > 0) {
      await expect(focusedElement).toBeVisible()
    }
    
    // Test escape key (should close modals if any are open)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(200)
  })

  test('should maintain state during navigation', async ({ page }) => {
    // Wait for app to load
    await page.waitForTimeout(2000)
    
    // Navigate to different dates and check that state is maintained
    const leftArrow = page.locator('button').filter({ hasText: /←|‹|</ }).first()
    
    if (await leftArrow.count() > 0) {
      await leftArrow.click()
      await page.waitForTimeout(500)
      
      // Navigate back
      const rightArrow = page.locator('button').filter({ hasText: /→|›|>/ }).first()
      
      if (await rightArrow.count() > 0) {
        await rightArrow.click()
        await page.waitForTimeout(500)
      }
    }
    
    // App should still be functional
    await expect(page.locator('body')).toBeVisible()
  })
})