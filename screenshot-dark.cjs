const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const outDir = 'C:/Users/User/Desktop/ui-shots-after';
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  // Seed localStorage with dark theme before navigating
  await page.goto('http://localhost:5173/login');
  await page.evaluate(() => localStorage.setItem('packops_theme', 'dark'));

  // Login
  await page.goto('http://localhost:5173/login');
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${outDir}/dark-00-login.png` });

  await page.fill('#email', 'testuser99@packops.dev');
  await page.fill('#password', 'testpass123');
  await page.click('button[type="submit"]');
  await page.waitForSelector('main', { timeout: 25000 });

  const pages = [
    ['/', 'dark-01-dashboard'],
    ['/routine', 'dark-02-routine'],
    ['/training', 'dark-03-training'],
    ['/medical', 'dark-05-medical'],
    ['/settings', 'dark-09-settings'],
  ];

  for (const [path, name] of pages) {
    await page.goto(`http://localhost:5173${path}`);
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: true });
    console.log(`Captured ${name}`);
  }

  await browser.close();
  console.log('Done');
})();
