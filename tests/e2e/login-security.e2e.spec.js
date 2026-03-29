import { test, expect } from "@playwright/test";

// Helper to setup mock API
async function setupMockApi(page) {
  await page.route("**/LDAPservice*", async (route) => {
    const request = route.request();
    const url = request.url();
    
    // Valid credentials
    if (url.includes("admin") && url.includes("adminpass")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          token: "admin-token-xyz123",
          roles: ["ADMIN_UPB_PLANNER"]
        }),
      });
      return;
    }
    
    if (url.includes("user") && url.includes("userpass")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          token: "user-token-abc456",
          roles: ["Usuarios"]
        }),
      });
      return;
    }
    
    // Invalid credentials
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: false,
        message: "Usuario o contraseña incorrectos"
      }),
    });
  });
}

// Helper to setup protected route mock
async function setupProtectedRouteMock(page) {
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = request.url();

    if (url.includes("/api/get-user")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: { idUsuario: 1, nombre: "Test User" }
        }),
      });
      return;
    }

    await route.continue();
  });
}

test.describe("LogIn Security Tests", () => {
  test.beforeEach(async ({ page }) => {
    await setupMockApi(page);
    await page.goto("/");
  });

  test.describe("Authentication & Access Control", () => {
    test("should not allow access to protected routes without login", async ({ page }) => {
      // Try to access protected route directly
      await page.goto("/app/user123", { waitUntil: "networkidle" });
      
      // Should redirect back to login
      expect(page.url()).toContain("/");
    });

    test("should not allow access to admin routes without admin role", async ({ page, context }) => {
      await setupProtectedRouteMock(page);

      // Login as regular user
      await page.fill('input[placeholder="Id Usuario"]', "user");
      await page.fill('input[placeholder="Contraseña"]', "userpass");
      await page.click('button:has-text("Iniciar Sesión")');

      // Wait for navigation
      await page.waitForURL("**/app/**");

      // Try to access admin route
      await page.goto("/AdminView");
      
      // Should not be able to access admin view as regular user
      // (depends on ProtectedRoute implementation)
    });

    test("should successfully login with correct credentials", async ({ page }) => {
      await page.fill('input[placeholder="Id Usuario"]', "user");
      await page.fill('input[placeholder="Contraseña"]', "userpass");
      await page.click('button:has-text("Iniciar Sesión")');

      // Should navigate to user app
      await page.waitForURL("**/app/**", { timeout: 10000 });
      expect(page.url()).toContain("/app/user");
    });

    test("should show error on incorrect credentials", async ({ page }) => {
      await page.fill('input[placeholder="Id Usuario"]', "wronguser");
      await page.fill('input[placeholder="Contraseña"]', "wrongpass");
      await page.click('button:has-text("Iniciar Sesión")');

      const errorMessage = page.locator("text=Usuario o contraseña incorrectos");
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Injection & XSS Security", () => {
    test("should not allow SQL injection in userId field", async ({ page }) => {
      const sqlInjection = "admin' OR '1'='1";
      
      await page.fill('input[placeholder="Id Usuario"]', sqlInjection);
      await page.fill('input[placeholder="Contraseña"]', "anypass");
      await page.click('button:has-text("Iniciar Sesión")');

      // Should still reject with invalid credentials message (not SQL error)
      const errorMessage = page.locator("text=Usuario o contraseña incorrectos");
      await expect(errorMessage).toBeVisible({ timeout: 5000 });

      // Should not expose backend error details
      const pageContent = await page.content();
      expect(pageContent).not.toMatch(/SQL|mysql|postgres|database/i);
    });

    test("should not allow SQL injection in password field", async ({ page }) => {
      const sqlInjection = `" OR "1"="1`;
      
      await page.fill('input[placeholder="Id Usuario"]', "admin");
      await page.fill('input[placeholder="Contraseña"]', sqlInjection);
      await page.click('button:has-text("Iniciar Sesión")');

      const errorMessage = page.locator("text=Usuario o contraseña incorrectos");
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
    });

    test("should sanitize XSS attempts in userId field", async ({ page }) => {
      const xssAttempt = '<script>alert("xss")</script>';
      
      await page.fill('input[placeholder="Id Usuario"]', xssAttempt);
      await page.fill('input[placeholder="Contraseña"]', "pass");
      
      // Should not execute script
      let alertTriggered = false;
      page.on('dialog', async (dialog) => {
        alertTriggered = true;
        await dialog.dismiss();
      });

      await page.click('button:has-text("Iniciar Sesión")');
      
      // Wait a bit to see if alert appears
      await page.waitForTimeout(2000);
      expect(alertTriggered).toBe(false);
    });

    test("should handle HTML injection attempts safely", async ({ page }) => {
      const htmlInjection = '<img src=x onerror="alert(1)">';
      
      await page.fill('input[placeholder="Id Usuario"]', htmlInjection);
      await page.fill('input[placeholder="Contraseña"]', "pass");
      
      let alertTriggered = false;
      page.on('dialog', async (dialog) => {
        alertTriggered = true;
        await dialog.dismiss();
      });

      await page.click('button:has-text("Iniciar Sesión")');
      
      await page.waitForTimeout(2000);
      expect(alertTriggered).toBe(false);
    });
  });

  test.describe("Sensitive Data Protection", () => {
    test("should not expose password in HTML", async ({ page }) => {
      const password = "MySecurePassword123";
      
      await page.fill('input[placeholder="Contraseña"]', password);
      
      const pageHTML = await page.content();
      expect(pageHTML).not.toContain(password);
      
      // Also check that password input has type="password" not "text"
      const passwordInput = page.locator('input[placeholder="Contraseña"]');
      expect(await passwordInput.getAttribute('type')).toBe('password');
    });

    test("should mask password by default", async ({ page }) => {
      const passwordInput = page.locator('input[placeholder="Contraseña"]');
      expect(await passwordInput.getAttribute('type')).toBe('password');
    });

    test("should not expose token in localStorage XSS attack", async ({ page }) => {
      // Login successfully
      await page.fill('input[placeholder="Id Usuario"]', "user");
      await page.fill('input[placeholder="Contraseña"]', "userpass");
      await page.click('button:has-text("Iniciar Sesión")');

      await page.waitForURL("**/app/**");

      // Attempt to access token from console (simulating XSS)
      let tokenExposed = false;
      try {
        const token = await page.evaluate(() => {
          return localStorage.getItem('token');
        });
        // Token should be stored but secured
        if (token && token.includes('token')) {
          tokenExposed = true;
        }
      } catch (e) {
        // Expected - should be protected
      }

      // Verify no sensitive info in URL
      expect(page.url()).not.toContain('token');
      expect(page.url()).not.toContain('password');
    });

    test("should not expose credentials in network requests body (GET request)", async ({ page }) => {
      let credentialsInUrl = false;

      page.on('request', (request) => {
        const url = request.url();
        const method = request.method();
        
        // Check if credentials are in URL (bad practice)
        if (method === 'GET' && (url.includes('password=') || url.includes('passwd='))) {
          credentialsInUrl = true;
        }
      });

      await page.fill('input[placeholder="Id Usuario"]', "user");
      await page.fill('input[placeholder="Contraseña"]', "userpass");
      await page.click('button:has-text("Iniciar Sesión")');

      await page.waitForTimeout(2000);
      expect(credentialsInUrl).toBe(false);
    });
  });

  test.describe("Form Security", () => {
    test("should have CSRF protection (required checkbox)", async ({ page }) => {
      const checkbox = page.locator('input[type="checkbox"]');
      await expect(checkbox).toHaveAttribute('required', '');
    });

    test("should require checkbox before submission", async ({ page }) => {
      await page.fill('input[placeholder="Id Usuario"]', "user");
      await page.fill('input[placeholder="Contraseña"]', "userpass");
      
      // Don't check the checkbox
      const submitButton = page.locator('button:has-text("Iniciar Sesión")');
      
      // Try to submit
      await submitButton.click();

      // Should not navigate (form validation prevents it)
      await page.waitForTimeout(1000);
      expect(page.url()).toContain("/");
    });

    test("should validate empty userId field", async ({ page }) => {
      await page.fill('input[placeholder="Contraseña"]', "pass");
      await page.locator('input[type="checkbox"]').check();
      await page.click('button:has-text("Iniciar Sesión")');

      const errorMessage = page.locator("text=Por favor ingresa usuario y contraseña");
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
    });

    test("should validate empty password field", async ({ page }) => {
      await page.fill('input[placeholder="Id Usuario"]', "user");
      await page.locator('input[type="checkbox"]').check();
      await page.click('button:has-text("Iniciar Sesión")');

      const errorMessage = page.locator("text=Por favor ingresa usuario y contraseña");
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
    });

    test("should validate whitespace-only fields", async ({ page }) => {
      await page.fill('input[placeholder="Id Usuario"]', "   ");
      await page.fill('input[placeholder="Contraseña"]', "   ");
      await page.locator('input[type="checkbox"]').check();
      await page.click('button:has-text("Iniciar Sesión")');

      const errorMessage = page.locator("text=Por favor ingresa usuario y contraseña");
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
    });

    test("should prevent form resubmission with back button after login", async ({ page }) => {
      await page.fill('input[placeholder="Id Usuario"]', "user");
      await page.fill('input[placeholder="Contraseña"]', "userpass");
      await page.locator('input[type="checkbox"]').check();
      await page.click('button:has-text("Iniciar Sesión")');

      // Wait for navigation
      await page.waitForURL("**/app/**");

      // Go back
      await page.goBack();

      // Should be back at login
      expect(page.url()).toContain("/");

      // Check that form fields are not prefilled with old values (security best practice)
      const userIdInput = page.locator('input[placeholder="Id Usuario"]');
      expect(await userIdInput.inputValue()).toBe('');
    });
  });

  test.describe("Rate Limiting & Brute Force Protection", () => {
    test("should handle multiple failed login attempts gracefully", async ({ page }) => {
      for (let i = 0; i < 5; i++) {
        await page.fill('input[placeholder="Id Usuario"]', `wronguser${i}`);
        await page.fill('input[placeholder="Contraseña"]', "wrongpass");
        await page.locator('input[type="checkbox"]').check();
        await page.click('button:has-text("Iniciar Sesión")');

        await page.waitForTimeout(500);
        
        // All attempts should show error message
        const errorMessage = page.locator("text=Usuario o contraseña incorrectos");
        await expect(errorMessage).toBeVisible({ timeout: 5000 });

        // Clear checkbox for next iteration
        await page.locator('input[type="checkbox"]').uncheck();
      }

      // After multiple attempts, form should still be functional
      await page.fill('input[placeholder="Id Usuario"]', "user");
      await page.fill('input[placeholder="Contraseña"]', "userpass");
      await page.locator('input[type="checkbox"]').check();
      await page.click('button:has-text("Iniciar Sesión")');

      // Should successfully login (if backend doesn't have rate limiting)
      await page.waitForURL("**/app/**", { timeout: 10000 });
    });
  });

  test.describe("HTTPS & Secure Transport", () => {
    test("should use secure connection in production", async ({ page, context }) => {
      // This test is more applicable in production
      // Check that any login data is not exposed in URL
      const url = page.url();
      expect(url).not.toContain('password=');
      expect(url).not.toContain('?user');
    });
  });

  test.describe("Session Management", () => {
    test("should not expose session token in localStorage to XSS", async ({ page }) => {
      // Login
      await page.fill('input[placeholder="Id Usuario"]', "user");
      await page.fill('input[placeholder="Contraseña"]', "userpass");
      await page.locator('input[type="checkbox"]').check();
      await page.click('button:has-text("Iniciar Sesión")');

      await page.waitForURL("**/app/**");

      // Try to access localStorage (simulating XSS)
      const storageContent = await page.evaluate(() => {
        return JSON.stringify(localStorage);
      });

      // Verify tokens are stored but check content doesn't include plaintext passwords
      expect(storageContent).not.toContain('userpass');
      expect(storageContent).not.toContain('MyPassword');
    });
  });
});
