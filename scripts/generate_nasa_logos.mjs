import { chromium } from 'playwright-core';
import fs from 'node:fs';

const browser = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});

// NASA Meatball SVG snippet
const nasaMeatballSvg = `
<svg viewBox="0 0 120 120" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.4"/>
    </filter>
  </defs>
  <!-- NASA Blue Sphere -->
  <circle cx="60" cy="60" r="56" fill="#0b3d91" filter="url(#glow)"/>
  
  <!-- Stars -->
  <g fill="#ffffff" opacity="0.95">
    <circle cx="28" cy="35" r="1.2"/>
    <circle cx="36" cy="22" r="1.5"/>
    <circle cx="48" cy="38" r="1.0"/>
    <circle cx="78" cy="25" r="1.3"/>
    <circle cx="92" cy="36" r="1.1"/>
    <circle cx="86" cy="48" r="1.4"/>
    <circle cx="24" cy="75" r="1.3"/>
    <circle cx="38" cy="85" r="1.1"/>
    <circle cx="72" cy="88" r="1.4"/>
    <circle cx="88" cy="78" r="1.2"/>
    <circle cx="98" cy="62" r="1.0"/>
    <circle cx="45" cy="55" r="0.8"/>
    <circle cx="76" cy="68" r="0.9"/>
    <!-- Starburst 1 -->
    <path d="M35 48 L37 49 L35 50 L33 49 Z" fill="#fff"/>
    <path d="M35 47 L35 51" stroke="#fff" stroke-width="0.6"/>
    <!-- Starburst 2 -->
    <path d="M82 32 L84 33 L82 34 L80 33 Z" fill="#fff"/>
    <path d="M82 31 L82 35" stroke="#fff" stroke-width="0.6"/>
  </g>
  
  <!-- Orbit Path (back half / full ellipse) -->
  <ellipse cx="60" cy="60" rx="55" ry="18" fill="none" stroke="#ffffff" stroke-width="2.6" transform="rotate(-32 60 60)"/>
  
  <!-- Red Hypersonic Chevron / Vector -->
  <path d="M12 76 Q 48 52, 98 14 L 88 56 Q 52 42, 38 88 Z" fill="#fc3d21" filter="url(#glow)"/>
  <path d="M12 76 L 38 88 Q 50 68, 70 60 Q 45 62, 12 76 Z" fill="#cf2a12"/>

  <!-- NASA Lettering -->
  <g fill="#ffffff" font-family="'Times New Roman', 'Georgia', serif" font-weight="900" font-size="28" letter-spacing="1">
    <text x="60" y="69" text-anchor="middle">NASA</text>
  </g>
</svg>
`;

// 1. Generate primary desktop navbar logo: NASA Meatball + "ALT + F4"
const pageDesktop = await browser.newPage({ viewport: { width: 800, height: 160 } });
await pageDesktop.setContent(`
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body {
        margin: 0;
        background: transparent;
        display: flex;
        align-items: center;
        height: 100vh;
        overflow: hidden;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      }
      .brand-box {
        display: inline-flex;
        align-items: center;
        gap: 16px;
        padding: 8px 16px;
      }
      .meatball-wrapper {
        width: 104px;
        height: 104px;
        flex-shrink: 0;
      }
      .text-wrapper {
        display: flex;
        flex-direction: column;
        justify-content: center;
      }
      .agency-title {
        color: #00b4d8;
        font-size: 14px;
        font-weight: 700;
        letter-spacing: 2.5px;
        text-transform: uppercase;
        margin-bottom: 2px;
      }
      .alt-f4-title {
        color: #ffffff;
        font-size: 42px;
        font-weight: 900;
        letter-spacing: 2px;
        line-height: 1;
        display: flex;
        align-items: center;
        gap: 8px;
        text-shadow: 0 2px 8px rgba(0,0,0,0.7);
      }
      .alt-f4-title span.plus {
        color: #fc3d21;
        font-weight: 800;
      }
    </style>
  </head>
  <body>
    <div class="brand-box" id="desktop-logo">
      <div class="meatball-wrapper">
        ${nasaMeatballSvg}
      </div>
      <div class="text-wrapper">
        <div class="agency-title">Mission Operations</div>
        <div class="alt-f4-title">ALT <span class="plus">+</span> F4</div>
      </div>
    </div>
  </body>
  </html>
`);

const desktopEl = await pageDesktop.$('#desktop-logo');
const desktopPng = await desktopEl.screenshot({ omitBackground: true });

// 2. Generate compact circular meatball for mobile (kts-orange-logo.png)
const pageMobile = await browser.newPage({ viewport: { width: 200, height: 200 } });
await pageMobile.setContent(`
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
      }
      .meatball-icon {
        width: 160px;
        height: 160px;
      }
    </style>
  </head>
  <body>
    <div class="meatball-icon" id="mobile-logo">
      ${nasaMeatballSvg}
    </div>
  </body>
  </html>
`);

const mobileEl = await pageMobile.$('#mobile-logo');
const mobilePng = await mobileEl.screenshot({ omitBackground: true });

// Write all target logo files
const desktopTargets = [
  'e:/ALT + F4/public/img/logo.png',
  'e:/ALT + F4/dist/img/logo.png',
  'e:/ALT + F4/public/img/logo-primary.png',
  'e:/ALT + F4/dist/img/logo-primary.png',
  'e:/ALT + F4/public/img/logo-light.png',
  'e:/ALT + F4/dist/img/logo-light.png',
  'e:/ALT + F4/public/img/kts-orange-name.png',
  'e:/ALT + F4/dist/img/kts-orange-name.png',
  'e:/ALT + F4/public/img/logo-secondary.png'
];

for (const target of desktopTargets) {
  fs.writeFileSync(target, desktopPng);
  console.log('Saved:', target);
}

const mobileTargets = [
  'e:/ALT + F4/public/img/kts-orange-logo.png',
  'e:/ALT + F4/dist/img/kts-orange-logo.png',
  'e:/ALT + F4/public/img/favicons/favicon.ico',
  'e:/ALT + F4/public/img/favicons/apple-touch-icon.png',
  'e:/ALT + F4/public/img/favicons/web-app-manifest-192x192.png',
  'e:/ALT + F4/dist/img/favicons/favicon.ico',
  'e:/ALT + F4/dist/img/favicons/apple-touch-icon.png'
];

for (const target of mobileTargets) {
  try {
    fs.writeFileSync(target, mobilePng);
    console.log('Saved:', target);
  } catch(e) {
    console.error('Error saving', target, e.message);
  }
}

await browser.close();
console.log('ALL NASA LOGOS GENERATED SUCCESSFULLY');
