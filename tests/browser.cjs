// Developer-only smoke test, using the bundled Codex runtime's Playwright.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  for (const condition of ['high_info','high_noinfo','low_info','low_noinfo','gift']) {
    const page = await browser.newPage({ acceptDownloads: true });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    // Override only instructor configuration in memory for test coverage.
    await page.route('**/scripts/setup.js', async route => {
      const fs = require('node:fs');
      await route.fulfill({ contentType:'application/javascript', body: fs.readFileSync(path.join(__dirname,'../scripts/setup.js'),'utf8').replace('condition: "random"', `condition: "${condition}"`) });
    });
    await page.goto(pathToFileURL(path.join(__dirname,'../index.html')).href);
    for (let step = 0; step < 40; step++) {
      if (await page.locator('#download').count()) break;
      const nextButton = page.locator('.jspsych-btn, #jspsych-survey-html-form-next').first();
      await nextButton.waitFor();
      const enlarge = page.locator('[data-product-image]').first();
      if (await enlarge.count()) {
        const before = await page.locator('input[type=range]').evaluateAll(els => els.map(el => el.value));
        await enlarge.click();
        if (!await page.locator('.product-image-dialog').isVisible()) throw Error('Image dialog missing');
        if (!await page.locator('.product-image-dialog img').evaluate(el => el.complete && el.naturalWidth > 0)) throw Error('Large image missing');
        await page.keyboard.press('Escape');
        if (await page.locator('.product-image-dialog').isVisible()) throw Error('Escape did not close dialog');
        await enlarge.click();
        await page.locator('.image-dialog-close').click();
        const after = await page.locator('input[type=range]').evaluateAll(els => els.map(el => el.value));
        if (JSON.stringify(before) !== JSON.stringify(after)) throw Error('Zoom changed ratings');
        if (await page.locator('input[type=radio]:checked').count()) throw Error('Zoom selected an alternative');
      }
      for (const img of await page.locator('.product img').all()) {
        if (!await img.evaluate(el => el.complete && el.naturalWidth > 0 && el.src.endsWith('.jpg'))) throw Error('Product photo missing');
      }
      const revisit = page.locator('.report-revisit');
      if (await revisit.count()) {
        if (await revisit.getAttribute('open') !== null) throw Error('Report must initially be collapsed');
        await revisit.locator('summary').click();
        if (!await revisit.locator('.report').isVisible()) throw Error('Cannot reopen report');
        const correctReport = await page.evaluate(() => product(state.reports[Number(document.querySelector('h1').textContent.match(/(\d+) von 4/)[1]) - 1]).report);
        if (await revisit.locator('.report p').textContent() !== correctReport) throw Error('Wrong report');
        await revisit.locator('summary').click();
      }
      const sliders = page.locator('input[type=range]');
      for (let i = 0; i < await sliders.count(); i++) {
        await sliders.nth(i).fill(String(7 - (i % 7)));
        await sliders.nth(i).dispatchEvent('input');
      }
      if (await page.locator('input[type=radio]').count()) await page.locator('input[type=radio]').first().check();
      for (const area of await page.locator('textarea').all()) await area.fill('Beispielantwort');
      await nextButton.click();
      await page.waitForTimeout(40);
    }
    if (!await page.locator('#download').count()) throw Error(`Not completed: ${condition}`);
    const rows = await page.evaluate(() => jsPsych.data.get().values());
    const final = rows.find(r => r.event === 'debriefing');
    if (!final?.completed || rows.filter(r=>r.event==='repeat_rating').length !== 8) throw Error('Missing data');
    const events = rows.map(r => r.event);
    if (events.filter(e => e === 'product_introduction').length !== 8) throw Error('Missing product introductions');
    if (events.filter(e => e === 'report_reading').length !== 4 || events.lastIndexOf('report_reading') >= events.indexOf('product_report')) throw Error('Reports must all precede questions');
    if (events.lastIndexOf('product_report') >= events.indexOf('repeat_rating')) throw Error('Repeat ratings must follow report questions');
    const actual = final.assigned_condition;
    if (actual !== condition) throw Error(`Condition override failed: ${actual}`);
    if (errors.length) throw Error(errors.join('\n'));
    const downloadPromise = page.waitForEvent('download');
    await page.locator('#download').click();
    const download = await downloadPromise;
    const csv = require('node:fs').readFileSync(await download.path(), 'utf8');
    if (!csv.includes('debriefing') || !csv.includes('spreading') || !download.suggestedFilename().endsWith('__postdecision.csv')) throw Error('Invalid CSV export');
    console.log(`Completed ${condition}: ${rows.length} rows, spreading=${final.spreading}`);
    await page.close();
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
