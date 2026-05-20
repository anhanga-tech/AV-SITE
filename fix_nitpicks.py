import os

# 1. Wrap submitWaitlist in useCallback in hooks/useWaitlistCapture.ts
filepath = 'hooks/useWaitlistCapture.ts'
with open(filepath, 'r') as f:
    content = f.read()

# Add useCallback to imports
if 'useCallback' not in content:
    content = content.replace('useEffect, useState, useRef', 'useEffect, useState, useRef, useCallback')

# Wrap submitWaitlist
# Find the start of the function
search_str = "const submitWaitlist = async ("
replace_str = "const submitWaitlist = useCallback(async ("
content = content.replace(search_str, replace_str)

# Find the end of the function to add the dependency array
# This is tricky with simple replace. Let's look for the return statement and back up.
# Actually, I can just append it before the return { ... }
old_return = "    return {"
new_end = "    }, [refreshTrackingState]);\n\n"
content = content.replace(old_return, new_end + old_return)

with open(filepath, 'w') as f:
    f.write(content)

# 2. Add expect for XSS payload in tests/e2e/destructive-lolla.spec.ts
test_filepath = 'tests/e2e/destructive-lolla.spec.ts'
with open(test_filepath, 'r') as f:
    test_content = f.read()

xss_test_old = """  test('should handle XSS payloads gracefully', async () => {
    await lollaPage.fillForm({
      name: '<script>alert("xss")</script>Felipe',
      email: 'felipe@qa.com'
    });

    // We mock the API to see what it receives or just ensure it doesn't crash the UI
    await lollaPage.submit();

    // UI should not execute the script (Playwright won't trigger alert by default,
    // but we check if the text is rendered safely if applicable)
    // The main thing is the request payload should be sanitized if we were to intercept it.
  });"""

xss_test_new = """  test('should handle XSS payloads gracefully', async ({ page }) => {
    await lollaPage.fillForm({
      name: '<script>alert("xss")</script>Felipe',
      email: 'felipe@qa.com'
    });

    await page.route('**/api/submit-waitlist', route => {
      const payload = route.request().postDataJSON();
      expect(payload.name).not.toContain('<script>');
      return route.fulfill({ status: 200, body: JSON.stringify({ ok: true }) });
    });

    await lollaPage.submit();
  });"""

test_content = test_content.replace(xss_test_old, xss_test_new)

with open(test_filepath, 'w') as f:
    f.write(test_content)
