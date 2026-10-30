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
  'tab-profile',
  'perde-year-review',
  'perde-achievements',
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
  'renderCharts',
  'renderYearInReview',
  'renderPerdeAchievements'
]) {
  assert.match(app, new RegExp(`function\\s+${fn}\\s*\\(`), `Missing expected feature function: ${fn}`);
}

assert.match(html, /perde-year-panel/, 'Annual cinema recap section must exist');
assert.match(html, /perde-achievement-grid/, 'Personal achievements section must exist');
assert.match(app, /perde-achievement-name/, 'Achievements must use compact icon labels');
assert.match(app, /loadHomeCardMetadata/, 'Homepage cards must complete missing metadata');
assert.match(app, /function\s+handleHomePosterError\s*\(/, 'Homepage poster failures must use a dedicated fallback');
assert.match(app, /ml-home-poster-fallback/, 'Homepage poster fallback markup must be available');
assert.match(app, /image\.tmdb\.org\/t\/p\/w500/, 'Missing homepage posters must be sourced from TMDB when available');
assert.match(app, /String\(movie\.poster\)\.includes\('unsplash\.com'\)/, 'Generic placeholder posters must be eligible for TMDB replacement');
assert.match(css, /\.ml-home-poster-fallback/, 'Cinematic poster fallback styles must exist');
assert.match(app, /homePosterMode \? 'handleHomePosterError\(this\)'/, 'Only homepage poster cards should use the new fallback handler');
assert.match(app, /number_of_seasons/, 'Series cards must expose season metadata');
assert.match(app, /number_of_episodes/, 'Series cards must expose episode metadata');
assert.match(app, /meta\.genres\.slice\(0, 2\)/, 'Homepage cards must refresh missing genre labels');
assert.match(app, /details\.runtime \? details\.runtime \+ ' dk'/, 'Movie cards must complete missing runtime labels');
assert.match(app, /IMDb ' \+ safe\(m\.imdb \|\| '—'\)/, 'Homepage IMDb ratings must continue using the existing archive value');
assert.match(css, /repeat\(5,minmax\(0,1fr\)\)/, 'Achievements must use a compact five-column grid');

assert.match(app, /renderPerdeAchievements\(\);/, 'Profile must refresh achievements when rendered');
assert.match(app, /watch-100/, '100 watched titles achievement must be defined');
assert.match(app, /perde_movies_archive_v1/, 'The existing local archive storage key must remain compatible');
assert.match(app, /item\.title\.trim\(\)\.length > 0/, 'Imported/local archive entries must include a non-empty title');
assert.match(app, /renderLibrary\(\);\s*renderAdminTable\(\);/, 'Import must refresh the library and admin views');
assert.match(app, /my_library_theme/ , 'The new theme preference must be saved');
assert.match(app, /localStorage\.getItem\(['"]perde_theme['"]\)/, 'The old theme preference must still be read');
assert.match(app, /\['dashboard',\s*'library',\s*'trailers',\s*'detail',\s*'stats',\s*'profile',\s*'admin'\]/, 'All application tabs must be registered');
assert.match(html, /id="detail-page-content"/, 'The detail page content container must exist');
assert.match(html, /\.\/js\/config\.js/, 'Tailwind configuration must still be loaded');
assert.match(html, /\.\/js\/app\.js/, 'The main application script must still be loaded');
assert.match(css, /--ml-bg:\s*#f7f7f5/i, 'Light theme tokens must exist');
assert.match(css, /--ml-bg:\s*#171918/i, 'Dark theme tokens must exist');
assert.match(css, /@media\s*\(max-width:\s*767px\)/, 'Mobile layout rules must exist');
assert.ok(config.includes('darkMode'), 'Tailwind dark-mode configuration must remain present');

console.log('My Library static smoke checks passed.');

assert.match(app, /function\\s+toggleHomeCardPreview\\s*\\(/, 'Homepage poster quick preview toggle must exist');
assert.match(app, /ml-home-poster-preview/, 'Homepage cards must render a synopsis preview');
assert.match(app, /aria-expanded=.*toggleHomeCardPreview/, 'Preview toggle must expose its expanded state');
assert.match(css, /\\.ml-home-poster-preview/, 'Homepage synopsis preview styles must exist');
assert.match(css, /\\.ml-home-poster-card\\.is-preview-open/, 'Touch users must be able to open the preview explicitly');

assert.match(app, /Number\(b\.perdeRating\)/, 'Personal recommendations must prioritize the user's Perde ratings');
assert.match(app, /genreMatches \* 3 \* seedWeight/, 'Recommendation ranking must use genre affinity and seed preference');
assert.match(app, /perde-recommendation-reason/, 'Recommendation cards must explain why an item was suggested');
assert.match(html, /onclick="renderPersonalRecommendations\(\)"/, 'Users must be able to refresh personal recommendations');
assert.match(css, /\.ml-recommendation-refresh/, 'Recommendation refresh control must be styled');

assert.match(app, /function\\s+loadRecommendationProviders\\s*\\(/, 'Personal recommendation cards must load Turkish streaming availability');
assert.match(app, /perde-recommendation-providers-/, 'Recommendation cards must include a streaming provider slot');
assert.match(app, /data\.results && data\.results\.TR/, 'Recommendation availability must be scoped to Türkiye');
assert.match(app, /uniqueStreaming\.slice\(0,3\)/, 'Recommendation cards must show a concise provider list');
assert.match(css, /\.perde-recommendation-providers/, 'Recommendation streaming provider badges must be styled');
