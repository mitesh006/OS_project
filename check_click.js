const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  page.on('console', msg => {
    console.log(`PAGE LOG [${msg.type()}]: ${msg.text()}`);
  });

  page.on('pageerror', error => {
    console.log(`PAGE EXCEPTION: ${error.message}`);
  });

  await page.goto('http://localhost:3000');
  await page.waitForTimeout(1000);
  
  console.log('Clicking Start Game button...');
  try {
    await page.click('#btn-start-game', { timeout: 2000 });
    console.log('Clicked Start Game.');
  } catch (e) {
    console.log('Failed to click:', e.message);
  }

  await page.waitForTimeout(1000);
  
  const isLevelSelectActive = await page.evaluate(() => {
    const el = document.getElementById('screen-level-select');
    return el ? el.classList.contains('active') : false;
  });
  console.log('Is level select active?', isLevelSelectActive);

  await browser.close();
})();
