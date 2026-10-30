const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const at = (...parts) => fs.readFileSync(path.join(__dirname, '..', ...parts), 'utf8');

test('identidade visual é servida depois do estilo legado', () => {
  const html = at('public', 'index.html');
  const oldCss = html.indexOf('/style-reference.css');
  const newCss = html.indexOf('/te-birthdex.css');
  assert.ok(oldCss > 0 && newCss > oldCss);
  assert.match(html, /<meta name="theme-color" content="#e26436">/);
});

test('marca Tekoha com iconografia SVG não altera as rotas financeiras', () => {
  const html = at('public', 'index.html');
  assert.ok((html.match(/src="\/icons\/te-logo.svg"/g) || []).length >= 2);
  for (const route of ['quick','receipt','resale','withdrawals','courtesies','staff','costinsights','closing','dashboard','transactions','installments','subscriptions','reform','insights','data']) {
    assert.ok(html.includes('data-page="'+route+'"'), 'Aba removida: '+route);
  }
  assert.match(html, /id="login-form"/);
  assert.match(html, /id="tx-form"/);
});

test('PWA inclui arquivos da identidade no cache e manifesto', () => {
  const manifest = JSON.parse(at('public','manifest.webmanifest'));
  const worker = at('public','sw.js');
  const theme = at('public','te-birthdex.css');
  const icon = at('public','icons','te-logo.svg');
  assert.equal(manifest.theme_color, '#e26436');
  assert.equal(manifest.background_color, '#f6eddf');
  assert.ok(manifest.icons.some(x => x.src === '/icons/te-logo.svg'));
  assert.match(worker, /te-birthdex\.css/);
  assert.match(worker, /te-logo\.svg/);
  assert.match(theme, /brand-purple/);
  assert.match(theme, /mobile-dock/);
  assert.match(icon, /Tekoha Hub/);
});
