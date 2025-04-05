const puppeteerBrowsers = require('@puppeteer/browsers');

(async () => {
  const browser = await puppeteerBrowsers.download({
    browser: 'chrome',
    buildId: '1200648',
    cacheDir: './.chromium',
  });

  console.log(`✅ Chromium downloaded to ${browser.executablePath}`);
})();
