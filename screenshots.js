const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  
  const pages = [
    { url: 'http://localhost:3000/auth/signin', name: '01-signin' },
    { url: 'http://localhost:3000/dashboard', name: '02-dashboard' },
    { url: 'http://localhost:3000/papers', name: '03-papers' },
    { url: 'http://localhost:3000/reading-list', name: '04-reading-list' },
    { url: 'http://localhost:3000/graph', name: '05-graph' },
  ];
  
  for (const p of pages) {
    try {
      await page.goto(p.url, { timeout: 15000, waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `/tmp/${p.name}.png`, fullPage: true });
      console.log(`Captured: ${p.name}`);
    } catch (e) {
      console.log(`Error capturing ${p.name}: ${e.message}`);
    }
  }
  
  await browser.close();
  console.log('Done!');
})();
