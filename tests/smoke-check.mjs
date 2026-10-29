import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync('index.html', 'utf8');
const app = readFileSync('js/app.js', 'utf8');
const css = readFileSync('css/style.css', 'utf8');
const config = readFileSync('js/config.js', 'utf8');

// Parse the application script without executing browser-dependent code.
assert.doesNotThrow(() => new Function(app), 'js/app.js must be valid JavaScript');

const requiredIds = [
  'tab-dashboard',
  'tab-library',
  'tab-detail',
  'detail-page-content',
  'tab-stats',
  'tab-admin',
  'detail-modal',
  'detail-modal-content',
  'actor-modal',
  'add-modal',
  'theme-toggle-btn'
];
const htmlIds = new Set([...html.matchAll(/\bid=["']([^"']+)["']/g)].map((match) => match[1]));
for (const id of requiredIds) {
  assert.ok(htmlIds.has(id), `index.html is missing required element #${id}`);
}

for (const fn of [
  'switchTab',
  'openDetailModal',
  'toggleFavorite',
  'updateMovieStatus',
  'deleteMovie',
  'isValidArchive',
  'handleCatalogSearch',
  'exportArchiveJSON',
  'importArchiveJSON',
  'renderCharts'
]) {
  assert.match(app, new RegExp(`function\\s+${fn}\\s*\\(`), `Missing expected feature function: ${fn}`);
}

assert.match(app, /perde_movies_archive_v1/, 'The existing local archive storage key must remain compatible');
assert.match(app, /item\.title\.trim\(\)\.length > 0/, 'Imported/local archive entries must include a non-empty title');
assert.match(app, /renderLibrary\(\);\s*renderAdminTable\(\);/, 'Import must refresh the library and admin views');
assert.match(app, /my_library_theme/ , 'The new theme preference must be saved');
assert.match(app, /localStorage\.getItem\(['"]perde_theme['"]\)/, 'The old theme preference must still be read');
assert.match(app, /\['dashboard',\s*'library',\s*'detail',\s*'stats',\s*'admin'\]/, 'The detail page must be registered as a tab');
assert.match(html, /id="detail-page-content"/, 'The detail page content container must exist');
assert.match(html, /\.\/js\/config\.js/, 'Tailwind configuration must still be loaded');
assert.match(html, /\.\/js\/app\.js/, 'The main application script must still be loaded');
assert.match(css, /--ml-bg:\s*#f7f7f5/i, 'Light theme tokens must exist');
assert.match(css, /--ml-bg:\s*#171918/i, 'Dark theme tokens must exist');
assert.match(css, /@media\s*\(max-width:\s*767px\)/, 'Mobile layout rules must exist');
assert.ok(config.includes('darkMode'), 'Tailwind dark-mode configuration must remain present');

console.log('My Library static smoke checks passed.');
