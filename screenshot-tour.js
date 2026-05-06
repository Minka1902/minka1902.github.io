const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  // Login
  await page.goto('http://localhost:5173/login');
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'C:/Users/User/Desktop/ui-shots/00-login.png' });

  await page.fill('#email', 'testuser99@packops.dev');
  await page.fill('#password', 'testpass123');
  await page.click('button[type="submit"]');
  await page.waitForSelector('aside', { timeout: 20000 });

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
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `C:/Users/User/Desktop/ui-shots/${name}.png`, fullPage: true });
    console.log(`Captured ${name}`);
  }

  console.log('Done');
  await browser.close();
})();
