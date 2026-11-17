const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    for (const width of [1280, 768, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.goto(pathToFileURL(path.join(__dirname, '../index.html')).href);
      for (let step = 0; step < 10; step++) await page.getByRole('button', { name: 'Weiter', exact: true }).click();
      const sliders = page.locator('input[type=range]');
      for (const slider of await sliders.all()) {
        await slider.scrollIntoViewIfNeeded();
        const visible = await slider.evaluate(el => {
          const r = el.getBoundingClientRect();
          const c = el.closest('.product-rating').getBoundingClientRect();
          return r.top >= c.top && r.bottom <= c.bottom &&
            document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2) === el;
        });
        if (!visible) throw Error(`Slider overlapped at width ${width}`);
        await slider.click();
      }
      if (!await page.getByRole('button', { name: 'Bewertungen abschließen' }).isEnabled()) throw Error('Slider clicks not registered');
      if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw Error('Horizontal overflow');
      await page.evaluate(() => document.querySelector('.jspsych-display-element').scrollTop = 0);
      await page.screenshot({ path: path.join(__dirname, `layout-${width}.png`), fullPage: true });
      console.log(`Layout ${width}px: all eight sliders unobstructed and clickable.`);
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
