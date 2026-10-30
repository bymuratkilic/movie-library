(() => {
  const state = { items: [], filter: 'all', loaded: false, loading: false, lastFocus: null, activeIndex: 0 };
  const $ = id => document.getElementById(id);
  const esc = value => String(value || '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const safeUrl = value => { try { const u = new URL(value); return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : '#'; } catch (_) { return '#'; } };
  const dateLabel = value => { const d = new Date(value); return Number.isNaN(d.getTime()) ? '' : new Intl.DateTimeFormat('tr-TR',{day:'numeric',month:'long',year:'numeric'}).format(d); };
  const categoryLabel = item => item.categoryLabel || ({tr:'YERLİ SİNEMA',trseries:'TÜRK DİZİLERİ',film:'DÜNYA SİNEMASI',world:'DÜNYA',series:'YABANCI DİZİLER',actors:'OYUNCULAR',industry:'SEKTÖR',trailers:'FRAGMAN'}[item.category] || 'SİNEMA');
  const filtered = () => state.items.filter(item => state.filter === 'all' || (state.filter === 'tr' && ['tr','trseries'].includes(item.category)) || (state.filter === 'series' && ['series','trseries'].includes(item.category)) || (state.filter === 'film' && ['film','world'].includes(item.category)) || item.category === state.filter);
  function openArticle(item, index) {
    if (!item) return;
    if (Number.isInteger(index)) state.activeIndex = index;
    const modal = $('perde-news-modal'), content = $('perde-news-modal-content');
    if (!modal || !content) return;
    const image = safeUrl(item.image), url = safeUrl(item.link);
    const originalTitle = item.originalTitle && item.originalTitle !== item.title ? item.originalTitle : '';
    const originalSummary = item.originalSummary && item.originalSummary !== item.summary ? item.originalSummary : '';
    content.innerHTML = (image !== '#' ? '<div class="perde-news-modal-image"><img src="' + image + '" alt="" onerror="this.parentElement.remove()"></div>' : '') +
      '<div class="perde-news-modal-copy"><span class="perde-news-tag">' + esc(categoryLabel(item)) + '</span>' +
      '<h2 id="perde-news-modal-title">' + esc(item.title) + '</h2>' +
      '<div class="perde-news-meta"><span>' + esc(item.source || '') + '</span><span>·</span><time>' + esc(dateLabel(item.published)) + '</time></div>' +
      '<p class="perde-news-modal-summary">' + esc(item.summary || 'Haberin ayrıntıları için orijinal kaynağı ziyaret edebilirsin.') + '</p>' +
      (originalTitle || originalSummary ? '<details class="perde-news-original"><summary>Orijinal yayın metnini gör</summary>' + (originalTitle ? '<h3>' + esc(originalTitle) + '</h3>' : '') + (originalSummary ? '<p>' + esc(originalSummary) + '</p>' : '') + '</details>' : '') +
      (url !== '#' ? '<a class="perde-news-modal-source" href="' + url + '" target="_blank" rel="noopener noreferrer">Orijinal habere git <i class="fa-solid fa-arrow-up-right-from-square"></i></a>' : '') +
      '<div class="perde-news-modal-navigation"><button type="button" data-news-step="-1" ' + (state.activeIndex <= 0 ? 'disabled' : '') + '><i class="fa-solid fa-chevron-left"></i> Önceki haber</button><span>' + (state.activeIndex + 1) + ' / ' + filtered().length + '</span><button type="button" data-news-step="1" ' + (state.activeIndex >= filtered().length - 1 ? 'disabled' : '') + '>Sonraki haber <i class="fa-solid fa-chevron-right"></i></button></div>' +
      '<p class="perde-news-modal-note">Bu pencere haberin kısa özetini gösterir. Haberin tamamı orijinal yayıncıda yer alır.</p></div>';
    state.lastFocus = document.activeElement;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden','false');
    document.body.classList.add('perde-news-modal-open');
    const close = modal.querySelector('.perde-news-modal-close');
    if (close) close.focus();
  }
  function closeArticle() {
    const modal = $('perde-news-modal');
    if (!modal || !modal.classList.contains('is-open')) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden','true');
    document.body.classList.remove('perde-news-modal-open');
    if (state.lastFocus && typeof state.lastFocus.focus === 'function') state.lastFocus.focus();
  }
  function card(item, index) {
    const image = safeUrl(item.image);
    return '<article class="perde-news-card" data-news-open="' + index + '" tabindex="0" role="button" aria-label="' + esc(item.title) + '">' +
      (image !== '#' ? '<div class="perde-news-card-image"><img loading="lazy" src="' + image + '" alt="" onerror="this.parentElement.style.display=\'none\'"></div>' : '<div class="perde-news-card-image"></div>') +
      '<div class="perde-news-card-copy"><span class="perde-news-tag">' + esc(categoryLabel(item)) + '</span><h3>' + esc(item.title) + '</h3><p>' + esc(item.summary || '') + '</p><div class="perde-news-meta"><span>' + esc(item.source || '') + '</span><span>·</span><time>' + esc(dateLabel(item.published)) + '</time></div><span class="perde-news-read">Haberi incele <i class="fa-solid fa-arrow-right"></i></span></div></article>';
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
    const image = safeUrl(featured.image);
    hero.innerHTML = (image !== '#' ? '<div class="perde-news-feature-image"><img src="' + image + '" alt="" onerror="this.parentElement.style.display=\'none\'"></div>' : '<div class="perde-news-feature-image"></div>') +
      '<div class="perde-news-feature-copy"><span class="perde-news-tag">ÖNE ÇIKAN · ' + esc(categoryLabel(featured)) + '</span><h2>' + esc(featured.title) + '</h2><p>' + esc(featured.summary || 'Haberin ayrıntıları için orijinal kaynağı ziyaret et.') + '</p><div class="perde-news-meta"><span>' + esc(featured.source || '') + '</span><span>·</span><time>' + esc(dateLabel(featured.published)) + '</time></div><button type="button" class="perde-news-read" data-news-open="0">Haberi incele <i class="fa-solid fa-arrow-right"></i></button></div>';
    grid.innerHTML = items.slice(1).map((item, index) => card(item, index + 1)).join('');
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
    const close = event.target.closest('[data-news-close]');
    if (close) { closeArticle(); return; }
    const step = event.target.closest('[data-news-step]');
    if (step) { const list = filtered(); const next = state.activeIndex + Number(step.dataset.newsStep); if (next >= 0 && next < list.length) openArticle(list[next], next); return; }
    const opener = event.target.closest('[data-news-open]');
    if (opener) { event.preventDefault(); const index = Number(opener.dataset.newsOpen); const item = filtered()[index]; openArticle(item, index); return; }
    const filter = event.target.closest('[data-news-filter]');
    if (!filter) return;
    state.filter = filter.dataset.newsFilter || 'all';
    document.querySelectorAll('[data-news-filter]').forEach(el => el.classList.toggle('is-active', el === filter));
    render();
  });
  document.addEventListener('keydown', event => {
    const modal = $('perde-news-modal');
    if (!modal || !modal.classList.contains('is-open')) return;
    if (event.key === 'Escape') { closeArticle(); return; }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { const list = filtered(); const next = state.activeIndex + (event.key === 'ArrowRight' ? 1 : -1); if (next >= 0 && next < list.length) { event.preventDefault(); openArticle(list[next], next); } return; }
    if (event.key === 'Tab') {
      const focusable = [...modal.querySelectorAll('button:not([disabled]),a[href],summary')];
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  document.addEventListener('keydown', event => {
    const card = event.target.closest && event.target.closest('.perde-news-card[data-news-open]');
    if (card && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); const index = Number(card.dataset.newsOpen); const item = filtered()[index]; openArticle(item, index); }
  });
  document.addEventListener('DOMContentLoaded', () => {
    const filters = $('perde-news-filters');
    if (filters) filters.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') event.target.click(); });
  });
})();