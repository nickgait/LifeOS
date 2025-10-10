/**
 * E2E Tests for Main Navigation
 */

import { test, expect } from '@playwright/test';

test.describe('Main Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display main page with title', async ({ page }) => {
    await expect(page).toHaveTitle(/LifeOS/i);
    await expect(page.locator('h1')).toContainText('LifeOS');
  });

  test('should display all module navigation items', async ({ page }) => {
    const modules = [
      'Fitness',
      'To-Do List',
      'Finance',
      'Investments',
      'Habits',
      'Goals',
      'Journal',
      'Poetry',
    ];

    for (const moduleName of modules) {
      await expect(page.getByRole('heading', { name: moduleName, level: 3 })).toBeVisible();
    }
  });

  test('should navigate to ToDo List module', async ({ page }) => {
    await page.click('[data-module="todo"]');
    await expect(page.locator('#module-content')).toContainText('To-Do List Manager');

    // Click the button to open the app
    await page.click('button:has-text("Open To-Do App")');
    await expect(page).toHaveURL(/ToDoList/);
  });

  test('should navigate to Fitness module', async ({ page }) => {
    await page.click('[data-module="fitness"]');
    await expect(page.locator('#module-content')).toContainText('Fitness Tracker');

    await page.click('button:has-text("Open Fitness App")');
    await expect(page).toHaveURL(/Fitness/);
  });

  test('should navigate to Investments module', async ({ page }) => {
    await page.click('[data-module="investments"]');
    await expect(page.locator('#module-content')).toContainText('Investment Dashboard');

    await page.click('button:has-text("Open Investment Dashboard")');
    await expect(page).toHaveURL(/Investments/);
  });

  test('should show active state on selected module', async ({ page }) => {
    const todoNav = page.locator('[data-module="todo"]');

    await todoNav.click();
    await expect(todoNav).toHaveClass(/active/);
  });

  test('should display dashboard widgets', async ({ page }) => {
    const widgets = page.locator('.widget');
    await expect(widgets).not.toHaveCount(0);
  });

  test('should display settings button', async ({ page }) => {
    const settingsBtn = page.locator('.settings-btn');
    await expect(settingsBtn).toBeVisible();
  });
});

test.describe('Module Navigation Performance', () => {
  test('should load modules quickly', async ({ page }) => {
    await page.goto('/');

    const startTime = Date.now();
    await page.click('[data-module="goals"]');
    await page.waitForSelector('#module-content');
    const loadTime = Date.now() - startTime;

    // Should load in less than 500ms (we removed the artificial delay)
    expect(loadTime).toBeLessThan(500);
  });

  test('should switch between modules quickly', async ({ page }) => {
    await page.goto('/');

    // Click first module
    await page.click('[data-module="fitness"]');
    await page.waitForSelector('#module-content');

    // Switch to another module
    const startTime = Date.now();
    await page.click('[data-module="habits"]');
    await page.waitForSelector('#module-content');
    const switchTime = Date.now() - startTime;

    // Should switch instantly (no 300ms delay anymore)
    expect(switchTime).toBeLessThan(200);
  });
});

test.describe('Responsive Design', () => {
  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.main-nav')).toBeVisible();
  });

  test('should work on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.main-nav')).toBeVisible();
  });
});
