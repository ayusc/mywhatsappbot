import { download } from '@puppeteer/browsers';

const browser = await download({
  browser: 'chrome',
  buildId: '1200648', // Stable version
  cacheDir: './.chromium'
});

console.log(`✅ Chromium downloaded to ${browser.executablePath}`);
