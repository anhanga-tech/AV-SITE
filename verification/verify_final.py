from playwright.sync_api import sync_playwright

def verify():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:3000/")
        page.screenshot(path="verification/final_home.png")
        page.goto("http://localhost:3000/orlando")
        page.screenshot(path="verification/final_orlando.png")
        browser.close()

if __name__ == "__main__":
    verify()
