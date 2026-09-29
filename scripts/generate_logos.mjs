import { chromium } from 'playwright-core';
import fs from 'node:fs';

const browser = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});

const page = await browser.newPage({ viewport: { width: 1200, height: 300 } });
await page.setContent(`
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body {
        margin: 0;
        background: transparent;
        display: flex;
        align-items: center;
        justify-content: flex-start;
        height: 100vh;
        overflow: hidden;
        font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
      }
      .logo-container {
        display: inline-flex;
        align-items: center;
        gap: 16px;
        padding: 10px 20px;
      }
      .logo-badge {
        background: linear-gradient(135deg, #e53935 0%, #b71c1c 100%);
        color: #ffffff;
        font-weight: 900;
        font-size: 88px;
        padding: 10px 28px;
        border-radius: 18px;
        letter-spacing: 3px;
        box-shadow: 0 6px 24px rgba(229, 57, 53, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .logo-plus {
        color: #ff5252;
        font-weight: 800;
        font-size: 88px;
      }
      .logo-f4 {
        color: #ffffff;
        font-weight: 900;
        font-size: 104px;
        letter-spacing: 4px;
        text-shadow: 0 2px 12px rgba(0,0,0,0.6);
      }
    </style>
  </head>
  <body>
    <div class="logo-container" id="logo">
      <span class="logo-badge">ALT</span>
      <span class="logo-plus">+</span>
      <span class="logo-f4">F4</span>
    </div>
  </body>
  </html>
`);

const el = await page.$('#logo');
const buffer = await el.screenshot({ omitBackground: true });
fs.writeFileSync('public/img/logo.png', buffer);
fs.writeFileSync('public/img/logo-light.png', buffer);
fs.writeFileSync('public/img/logo-primary.png', buffer);
fs.writeFileSync('public/img/kts-orange-name.png', buffer);
fs.writeFileSync('dist/img/logo.png', buffer);
fs.writeFileSync('dist/img/logo-light.png', buffer);
fs.writeFileSync('dist/img/logo-primary.png', buffer);
fs.writeFileSync('dist/img/kts-orange-name.png', buffer);

// Square icon for kts-orange-logo.png
await page.setContent(`
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body {
        margin: 0;
        background: transparent;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100vh;
        overflow: hidden;
        font-family: 'Segoe UI', sans-serif;
      }
      .square-badge {
        width: 200px;
        height: 200px;
        background: linear-gradient(135deg, #e53935 0%, #b71c1c 100%);
        border-radius: 40px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 900;
        box-shadow: 0 6px 24px rgba(229, 57, 53, 0.4);
      }
      .sq-alt { font-size: 56px; line-height: 1; letter-spacing: 1px; }
      .sq-f4 { font-size: 64px; line-height: 1; color: #ffcdd2; }
    </style>
  </head>
  <body>
    <div class="square-badge" id="sqlogo">
      <div class="sq-alt">ALT</div>
      <div class="sq-f4">F4</div>
    </div>
  </body>
  </html>
`);

const sqEl = await page.$('#sqlogo');
const sqBuffer = await sqEl.screenshot({ omitBackground: true });
fs.writeFileSync('public/img/kts-orange-logo.png', sqBuffer);
fs.writeFileSync('dist/img/kts-orange-logo.png', sqBuffer);

console.log('LOGOS_SUCCESSFULLY_GENERATED');
await browser.close();
