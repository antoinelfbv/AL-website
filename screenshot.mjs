import puppeteer from 'puppeteer';
import { mkdirSync, readdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const dir = join(__dirname, 'temporary screenshots');
mkdirSync(dir, { recursive: true });

const url = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] || '';

// Auto-increment screenshot number
const existing = readdirSync(dir).filter(f => f.startsWith('screenshot-'));
const nums = existing.map(f => parseInt(f.match(/screenshot-(\d+)/)?.[1] || 0));
const next = (Math.max(0, ...nums) + 1);
const filename = `screenshot-${next}${label ? '-' + label : ''}.png`;

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

// Wait for loader animation
await new Promise(r => setTimeout(r, 3000));

// Scroll through the entire page to trigger IntersectionObserver and lazy loading
await page.evaluate(async () => {
  const distance = 400;
  const delay = 100;
  const height = document.body.scrollHeight;
  for (let y = 0; y < height; y += distance) {
    window.scrollTo(0, y);
    await new Promise(r => setTimeout(r, delay));
  }
  // Scroll back to top for the screenshot
  window.scrollTo(0, 0);
  await new Promise(r => setTimeout(r, 500));
});

// Wait for images to finish loading
await new Promise(r => setTimeout(r, 1500));

await page.screenshot({ path: join(dir, filename), fullPage: true });
console.log(`Saved: ${join(dir, filename)}`);
await browser.close();
