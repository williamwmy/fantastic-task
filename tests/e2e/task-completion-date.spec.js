import { test } from '@playwright/test';

test.describe('Task Completion Date Bug', () => {
  test('should complete task on yesterday date correctly', async ({ page }) => {
    // Listen for console logs
    const consoleLogs = [];
    page.on('console', msg => {
      consoleLogs.push(`${msg.type()}: ${msg.text()}`);
    });

    // Listen for alerts
    const alerts = [];
    page.on('dialog', async dialog => {
      alerts.push(dialog.message());
      await dialog.accept();
    });

    // Go to the app
    await page.goto('http://localhost:5175');

    // Wait for app to load
    await page.waitForSelector('[data-testid="task-list"], h3', { timeout: 10000 });

    // Get yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    console.log('Yesterday date:', yesterdayStr);

    // Navigate to yesterday
    const prevButton = page.locator('button[aria-label="Forrige dag"]');
    if (await prevButton.isVisible()) {
      await prevButton.click();
      await page.waitForTimeout(500);
    }

    // Take screenshot before completion
    await page.screenshot({ path: 'before-completion.png', fullPage: true });

    // Look for a task to complete
    const quickCompleteButton = page.locator('button[aria-label="quick complete"]').first();
    
    if (await quickCompleteButton.isVisible()) {
      console.log('Found quick complete button, clicking...');
      await quickCompleteButton.click();
      await page.waitForTimeout(1000);
    } else {
      // Try detailed completion
      const detailedCompleteButton = page.locator('button[aria-label="complete"]').first();
      if (await detailedCompleteButton.isVisible()) {
        console.log('Found detailed complete button, clicking...');
        await detailedCompleteButton.click();
        await page.waitForTimeout(500);
        
        // Submit the completion modal
        const submitButton = page.locator('button[type="submit"]');
        if (await submitButton.isVisible()) {
          await submitButton.click();
          await page.waitForTimeout(1000);
        }
      }
    }

    // Take screenshot after completion
    await page.screenshot({ path: 'after-completion.png', fullPage: true });

    // Print all console logs and alerts
    console.log('\n=== CONSOLE LOGS ===');
    consoleLogs.forEach(log => console.log(log));
    
    console.log('\n=== ALERTS ===');
    alerts.forEach(alert => console.log('ALERT:', alert));

    // Check if there were any relevant logs
    const relevantLogs = consoleLogs.filter(log => 
      log.includes('mockData') || 
      log.includes('TaskCompletion') || 
      log.includes('TaskList') ||
      log.includes('DEBUG')
    );
    
    console.log('\n=== RELEVANT LOGS ===');
    relevantLogs.forEach(log => console.log(log));

    // Wait a bit more to capture any delayed logs
    await page.waitForTimeout(2000);
  });
});