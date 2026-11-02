const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium } = require('playwright');

const pluginPath = path.join(__dirname, 'SceneTagSearch', 'SceneTagSearch.js');

function nativeTagHref(id, label) {
  const criterion =
    '("type":"tags","modifier":"INCLUDES_ALL","value":(' +
    '"items":[("id":"' + id + '","label":"' + label + '")],' +
    '"excluded":[],"depth":0))';
  return '/scenes?c=' + encodeURIComponent(criterion) + '&sortby=date';
}

function sceneHtml() {
  const chips = [
    ['73', 'Big Tits'],
    ['26', 'Blond Hair'],
    ['27', 'Cowgirl']
  ].map(([id, label]) =>
    '<span data-sort-name="' + label + '" class="tag-item tag-link badge badge-secondary">' +
      '<a href="' + nativeTagHref(id, label) + '"><div>' + label + '</div></a>' +
    '</span>'
  ).join('');
  return '<!doctype html><html><head></head><body>' +
    '<main><div class="col-12"><h6>Tags</h6>' + chips +
    '<h6>Performers</h6><div>Example Performer</div></div></main>' +
    '</body></html>';
}

async function waitForControls(page) {
  await page.waitForSelector('#scene-tag-search-controls');
  await page.waitForFunction(() =>
    document.querySelectorAll('.scene-tag-search-chip').length === 3
  );
}

async function runMode(browser, mode) {
  const page = await browser.newPage();
  await page.route('http://stash.test/**', async route => {
    const url = new URL(route.request().url());
    if (url.pathname === '/scenes/93741') {
      await route.fulfill({ status: 200, contentType: 'text/html', body: sceneHtml() });
    } else {
      await route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>Results</title>' });
    }
  });

  await page.goto('http://stash.test/scenes/93741');
  await page.addScriptTag({ path: pluginPath });
  await waitForControls(page);

  assert.equal(await page.locator('.scene-tag-search-search').isDisabled(), true);
  assert.equal(await page.locator('.scene-tag-search-mode[data-mode="ALL"]').getAttribute('aria-pressed'), 'true');

  const originalUrl = page.url();
  await page.getByText('Big Tits', { exact: true }).click();
  await page.getByText('Blond Hair', { exact: true }).click();
  assert.equal(page.url(), originalUrl, 'tag chip clicks must not navigate');
  assert.equal(await page.locator('.scene-tag-search-selected').count(), 2);

  if (mode === 'ANY') {
    await page.getByRole('button', { name: 'Match ANY' }).click();
  }

  await Promise.all([
    page.waitForURL(url => url.pathname === '/scenes' && url.searchParams.has('c')),
    page.getByRole('button', { name: new RegExp('Search ' + mode) }).click()
  ]);

  const resultUrl = new URL(page.url());
  const criterion = resultUrl.searchParams.get('c');
  assert.ok(criterion.includes('"id":"73"'));
  assert.ok(criterion.includes('"id":"26"'));
  assert.ok(!criterion.includes('"id":"27"'));
  assert.ok(criterion.includes(mode === 'ANY' ? '"modifier":"INCLUDES"' : '"modifier":"INCLUDES_ALL"'));
  if (mode === 'ANY') assert.ok(!criterion.includes('INCLUDES_ALL'));

  await page.close();
  return resultUrl.pathname + resultUrl.search;
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });
  try {
    const allUrl = await runMode(browser, 'ALL');
    const anyUrl = await runMode(browser, 'ANY');
    console.log(JSON.stringify({ ok: true, allUrl, anyUrl }, null, 2));
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

