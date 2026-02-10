const { chromium } = require('playwright');
const url = process.argv[2];
const name = process.argv[3];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  try {
    await page.goto(url, { timeout: 30000, waitUntil: 'networkidle' });
    await page.screenshot({ path: `/tmp/${name}.png`, fullPage: true });
    console.log(`Captured: ${name}`);
  } catch (e) {
    console.log(`Error: ${e.message}`);
  }
  await browser.close();
})();
