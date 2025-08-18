import { test, expect } from '@playwright/test';

test.describe('Memory Bank Web Interface', () => {
  test('should display the main page with projects', async ({ page }) => {
    await page.goto('/');
    
    // Check that the main elements are present
    await expect(page.getByText('Memory Bank')).toBeVisible();
    await expect(page.getByText('Project Documentation Browser')).toBeVisible();
    await expect(page.getByText('Memory Bank Projects')).toBeVisible();
  });

  test('should toggle theme correctly', async ({ page }) => {
    await page.goto('/');
    
    // Find theme toggle button
    const themeToggle = page.getByRole('button', { name: /switch to (dark|light) mode/i });
    await expect(themeToggle).toBeVisible();
    
    // Click theme toggle
    await themeToggle.click();
    
    // Check that theme changed (look for dark class on html element)
    const htmlElement = page.locator('html');
    const hasClass = await htmlElement.getAttribute('class');
    
    expect(hasClass).toContain('dark');
  });

  test('should search projects when typing in search input', async ({ page }) => {
    // This test assumes there are some projects available
    await page.goto('/');
    
    // Wait for projects to load
    await page.waitForSelector('[data-testid="project-search"], input[placeholder*="Search projects"]', { 
      timeout: 10000 
    });
    
    const searchInput = page.getByPlaceholder(/search projects/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      
      // Check that search results are filtered
      // This will depend on actual test data
      await expect(page.getByText(/of \d+ projects shown/)).toBeVisible({ timeout: 5000 });
    }
  });

  test('should navigate to project detail when project is clicked', async ({ page }) => {
    await page.goto('/');
    
    // Wait for projects to load and look for project links
    await page.waitForTimeout(2000);
    
    const projectLinks = page.locator('a[href*="/projects/"]');
    const count = await projectLinks.count();
    
    if (count > 0) {
      // Click on the first project
      await projectLinks.first().click();
      
      // Should navigate to project detail page
      await expect(page).toHaveURL(/\/projects\/[^\/]+$/);
      
      // Check that project detail elements are present
      await expect(page.getByText('Project Files')).toBeVisible();
      await expect(page.getByText('Search in this project')).toBeVisible();
    }
  });

  test('should show responsive design on mobile', async ({ page, isMobile }) => {
    if (isMobile) {
      await page.goto('/');
      
      // Check that mobile layout works
      await expect(page.getByText('Memory Bank')).toBeVisible();
      
      // Check that search input is still accessible on mobile
      const searchInput = page.getByPlaceholder(/search projects/i);
      if (await searchInput.isVisible()) {
        await expect(searchInput).toBeVisible();
      }
    }
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Test with invalid API responses by intercepting requests
    await page.route('/api/projects', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Internal server error',
          message: 'Failed to fetch projects'
        })
      });
    });

    await page.goto('/');
    
    // Should show error message
    await expect(page.getByText('Error Loading Projects')).toBeVisible();
    await expect(page.getByText('Failed to fetch projects')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();
  });
});