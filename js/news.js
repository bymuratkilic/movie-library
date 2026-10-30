(() => {
  const state = { items: [], filter: 'all', loaded: false, loading: false };
  const $ = id => document.getElementById(id);
  const esc = value => String(value || '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const safeUrl = value => { try { const u = new URL(value); return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : '#'; } catch (_) { return '#'; } };
  const dateLabel = value => { const d = new Date(value); return Number.isNaN(d.getTime()) ? '' : new Intl.DateTimeFormat('tr-TR',{day:'numeric',month:'long',year:'numeric'}).format(d); };
  const categoryLabel = item => item.categoryLabel || ({tr:'YERLİ',world:'DÜNYA',series:'DİZİ',trailers:'FRAGMAN'}[item.category] || 'SİNEMA');
  const filtered = () => state.items.filter(item => state.filter === 'all' || item.category === state.filter || (state.filter === 'tr' && item.category === 'tr'));
  function card(item) {
    const url = safeUrl(item.link), image = safeUrl(item.image);
    return '<article class="perde-news-card">' +
      (image !== '#' ? '<a class="perde-news-card-image" href="' + url + '" target="_blank" rel="noopener noreferrer"><img loading="lazy" src="' + image + '" alt="" onerror="this.parentElement.style.display=\'none\'"></a>' : '<a class="perde-news-card-image" href="' + url + '" target="_blank" rel="noopener noreferrer"></a>') +
      '<div class="perde-news-card-copy"><span class="perde-news-tag">' + esc(categoryLabel(item)) + '</span><h3><a href="' + url + '" target="_blank" rel="noopener noreferrer">' + esc(item.title) + '</a></h3><p>' + esc(item.summary || '') + '</p><div class="perde-news-meta"><span>' + esc(item.source || '') + '</span><span>·</span><time>' + esc(dateLabel(item.published)) + '</time></div></div></article>';
  }
  function render() {
    const items = filtered();
    const featured = items[0];
    const hero = $('perde-news-featured'), grid = $('perde-news-grid'), empty = $('perde-news-empty');
    if (!hero || !grid) return;
    if (!featured) {
      hero.innerHTML = '<div class="perde-news-loading">Bu kategoride henüz haber bulunamadı.</div>';
      grid.innerHTML = ''; if (empty) empty.classList.remove('hidden'); return;
    }
    if (empty) empty.classList.add('hidden');
    const image = safeUrl(featured.image), url = safeUrl(featured.link);
    hero.innerHTML = (image !== '#' ? '<a class="perde-news-feature-image" href="' + url + '" target="_blank" rel="noopener noreferrer"><img src="' + image + '" alt="" onerror="this.parentElement.style.display=\'none\'"></a>' : '<div class="perde-news-feature-image"></div>') +
      '<div class="perde-news-feature-copy"><span class="perde-news-tag">ÖNE ÇIKAN · ' + esc(categoryLabel(featured)) + '</span><h2>' + esc(featured.title) + '</h2><p>' + esc(featured.summary || 'Haberin ayrıntıları için orijinal kaynağı ziyaret et.') + '</p><div class="perde-news-meta"><span>' + esc(featured.source || '') + '</span><span>·</span><time>' + esc(dateLabel(featured.published)) + '</time></div><a class="perde-news-read" href="' + url + '" target="_blank" rel="noopener noreferrer">Haberin tamamını oku <i class="fa-solid fa-arrow-up-right-from-square"></i></a></div>';
    grid.innerHTML = items.slice(1).map(card).join('');
  }
  async function load(force) {
    if (state.loading || (state.loaded && !force)) { render(); return; }
    state.loading = true;
    const updated = $('perde-news-updated');
    if (updated) updated.textContent = 'Haber akışı güncelleniyor…';
    try {
      const response = await fetch('./data/news.json' + (force ? '?t=' + Date.now() : ''), { cache: force ? 'no-store' : 'default' });
      if (!response.ok) throw new Error('Haber dosyası henüz oluşturulmadı.');
      const data = await response.json();
      state.items = Array.isArray(data.items) ? data.items : [];
      state.loaded = true;
      if (updated) updated.textContent = data.updatedAt ? 'Son güncelleme: ' + dateLabel(data.updatedAt) : 'Güncel haber akışı';
      render();
    } catch (error) {
      if (updated) updated.textContent = 'Haber akışına şu an ulaşılamıyor';
      if (!state.items.length) {
        const hero = $('perde-news-featured');
        if (hero) hero.innerHTML = '<div class="perde-news-loading"><i class="fa-solid fa-clock"></i><br>İlk haber akışı hazırlanıyor. Birkaç dakika sonra yeniden deneyebilirsin.</div>';
      }
    } finally { state.loading = false; }
  }
  window.loadPerdeNews = load;
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-news-filter]');
    if (!button) return;
    state.filter = button.dataset.newsFilter || 'all';
    document.querySelectorAll('[data-news-filter]').forEach(el => el.classList.toggle('is-active', el === button));
    render();
  });
  document.addEventListener('DOMContentLoaded', () => {
    const filters = $('perde-news-filters');
    if (filters) filters.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') event.target.click(); });
  });
})();
