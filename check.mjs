import { chromium } from 'playwright';

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
p.on('pageerror', (e) => errs.push(String(e)));
await p.goto('http://localhost:4321/archives/', { waitUntil: 'networkidle' });

console.log('open panels on load:', await p.locator('.accordion-collapse.show').count());
console.log(
  'header justify:',
  await p.locator('.accordion-button').first().evaluate((e) => getComputedStyle(e).justifyContent)
);

await p.locator('.accordion-button').first().click();
await p.waitForTimeout(800);

const info = p.locator('#collapse2026 .view-profile').first();
console.log(
  'info button text:',
  JSON.stringify(await info.textContent()),
  'box:',
  await info.evaluate((e) => {
    const r = e.getBoundingClientRect();
    return Math.round(r.width) + 'x' + Math.round(r.height);
  })
);

await info.click();
await p.waitForTimeout(400);
const shown = p.locator('.modal.show');
console.log(
  'modal open:',
  await shown.count(),
  '| title:',
  (await shown.first().locator('.modal-title').textContent())?.trim()
);
await p.keyboard.press('Escape');
await p.waitForTimeout(300);
console.log('modal after Esc:', await p.locator('.modal.show').count());

console.log('carousels in 2026:', await p.locator('#collapse2026 .gallery-carousel').count());
const car = p.locator('#collapse2026 .gallery-carousel').first();
const before = await car.locator('.tile-grid').evaluate((e) => e.scrollLeft);
await car.locator('.gallery-nav.next').click();
await p.waitForTimeout(900);
const after = await car.locator('.tile-grid').evaluate((e) => e.scrollLeft);
console.log('carousel scroll', before, '->', Math.round(after));

const visible = () =>
  p.locator('#showAllOne_nominee2 > [class*="col-"]:not(.hidden)').count();
const sel = p.locator('#collapse2026 select').first();
const all = await visible();
await sel.selectOption({ label: 'Health & Wellness' });
await p.waitForTimeout(300);
const health = await visible();
await sel.selectOption({ label: 'All Categories' });
await p.waitForTimeout(300);
console.log('filter: all =', all, '-> health =', health, '-> back to all =', await visible());

console.log('page errors:', errs.length ? errs : 'none');
await b.close();
