import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const outDir = 'C:\\Users\\sbpat\\.gemini\\antigravity-ide\\brain\\fdf878e9-1228-44be-8c52-a039a8df2c53';

async function capture() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1. Auth Light
  await page.goto('http://localhost:5173/login');
  await page.screenshot({ path: path.join(outDir, 'auth_light.png') });
  console.log('Saved auth_light.png');

  // 2. Library Light
  await page.goto('http://localhost:5173/library');
  await page.waitForSelector('h1');
  await page.screenshot({ path: path.join(outDir, 'library_light.png') });
  console.log('Saved library_light.png');

  // 3. Builder Light
  await page.goto('http://localhost:5173/builder');
  await page.waitForSelector('h1');
  await page.screenshot({ path: path.join(outDir, 'builder_light.png') });
  console.log('Saved builder_light.png');

  // 4. Compare Light
  await page.goto('http://localhost:5173/builder/compare');
  await page.waitForSelector('h1');
  await page.screenshot({ path: path.join(outDir, 'compare_light.png') });
  console.log('Saved compare_light.png');

  // Toggle Dark Mode
  // Set localStorage theme to dark and reload
  await page.evaluate(() => {
    localStorage.setItem('theme', 'dark');
  });
  await page.goto('http://localhost:5173/builder/compare');
  await page.waitForSelector('h1');
  
  // 5. Compare Dark
  await page.screenshot({ path: path.join(outDir, 'compare_dark.png') });
  console.log('Saved compare_dark.png');

  // 6. Builder Dark
  await page.goto('http://localhost:5173/builder');
  await page.waitForSelector('h1');
  await page.screenshot({ path: path.join(outDir, 'builder_dark.png') });
  console.log('Saved builder_dark.png');

  // 7. Library Dark
  await page.goto('http://localhost:5173/library');
  await page.waitForSelector('h1');
  await page.screenshot({ path: path.join(outDir, 'library_dark.png') });
  console.log('Saved library_dark.png');

  await browser.close();
}

capture().catch(console.error);
