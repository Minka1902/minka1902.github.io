const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const outDir = 'C:/Users/User/Desktop/ui-shots-after';
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });

  async function shootPages(viewport, suffix) {
    const page = await browser.newPage();
    await page.setViewportSize(viewport);

    // Login page
    await page.goto('http://localhost:5173/login');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${outDir}/00-login-${suffix}.png` });
    console.log(`Captured 00-login-${suffix}`);

    // Authenticate
    await page.fill('#email', 'testuser99@packops.dev');
    await page.fill('#password', 'testpass123');
    await page.click('button[type="submit"]');
    await page.waitForSelector('main', { timeout: 25000 });

    const pages = [
      ['/', '01-dashboard'],
      ['/routine', '02-routine'],
      ['/training', '03-training'],
      ['/training/new', '04-training-new'],
      ['/medical', '05-medical'],
      ['/humans', '06-humans'],
      ['/devices', '07-devices'],
      ['/qr', '08-qr'],
      ['/settings', '09-settings'],
      ['/dogs/new', '10-dog-new'],
    ];

    for (const [path, name] of pages) {
      await page.goto(`http://localhost:5173${path}`);
      await page.waitForTimeout(1500);
      await page.screenshot({ path: `${outDir}/${name}-${suffix}.png`, fullPage: true });
      console.log(`Captured ${name}-${suffix}`);
    }
    await page.close();
  }

  // Desktop
  await shootPages({ width: 1440, height: 900 }, 'desktop');
  // Tablet
  await shootPages({ width: 768, height: 1024 }, 'tablet');
  // Mobile
  await shootPages({ width: 390, height: 844 }, 'mobile');

  await browser.close();
  console.log('Done');
})();
