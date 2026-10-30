// Global State & Persistent Storage Key
        const STORAGE_KEY = 'perde_movies_archive_v1'; // Eski anahtar korunur: mevcut arşiv verileri kaybolmaz.
        const ADMIN_PASS_KEY = 'perde_admin_password_v1';
        let isAdminLoggedIn = false;
        let searchDebounceTimer = null;
        let fetchedOnlineResults = [];
        let genreChartInstance = null;
        let statusChartInstance = null;

        const actorPhotoCache = {};

        // Varsayılan Başlangıç Kataloğu
        const onlineCatalog = [
            {
                id: "tmdb-batman-1",
                title: "The Dark Knight (Kara Şövalye)",
                type: "movie",
                year: 2008,
                director: "Christopher Nolan",
                country: "ABD / İngiltere",
                runtime: "152 dk",
                imdb: 9.0,
                status: "watched",
                favorite: true,
                genres: ["Aksiyon", "Suç", "Dram"],
                trailerUrl: "EXeTwQWrcwY",
                poster: "https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_FMjpg_UX1000_.jpg",
                overview: "Gotham Şehri'ni kaosa sürükleyen Joker adlı suç dehasına karşı Batman, Teğmen Gordon ve Bölge Savcısı Harvey Dent amansız bir mücadeleye girişir.",
                cast: [
                    { name: "Christian Bale", role: "Bruce Wayne / Batman" },
                    { name: "Heath Ledger", role: "Joker" },
                    { name: "Aaron Eckhart", role: "Harvey Dent" },
                    { name: "Michael Caine", role: "Alfred Pennyworth" }
                ]
            },
            {
                id: "tmdb-planet-earth",
                title: "Planet Earth II (Yeryüzü II)",
                type: "doc",
                year: 2016,
                director: "David Attenborough",
                country: "İngiltere",
                runtime: "6 Bölüm",
                imdb: 9.5,
                status: "watched",
                favorite: true,
                genres: ["Belgesel", "Doğa"],
                trailerUrl: "c8aFcHFu8QM",
                poster: "https://m.media-amazon.com/images/M/MV5BZWYxODViMGYtMGE2ZC00ZGQ3LThhMWUtYTVkNGE3OWU4NWRkXkEyXkFqcGdeQXVyMTEyMjM2NDc2._V1_FMjpg_UX1000_.jpg",
                overview: "Vahşi yaşamın ve büyüleyici doğanın adalar, dağlar, ormanlar ve çöller üzerinden efsanevi anlatımı.",
                cast: [
                    { name: "David Attenborough", role: "Sunucu / Anlatıcı" }
                ]
            },
            {
                id: "tmdb-batman-2",
                title: "The Batman",
                type: "movie",
                year: 2022,
                director: "Matt Reeves",
                country: "ABD",
                runtime: "176 dk",
                imdb: 7.8,
                status: "watch_later",
                favorite: false,
                genres: ["Aksiyon", "Gizem", "Suç"],
                trailerUrl: "mqqft2x_Aa4",
                poster: "https://m.media-amazon.com/images/M/MV5BMDdmMTBiNTYtMDIzNi00NGVlLWIzMDYtZTk3MTQ3NGQxU2E2XkEyXkFqcGdeQXVyMTEyMjM2NDc2._V1_FMjpg_UX1000_.jpg",
                overview: "Batman, Gotham'ın üst düzey yetkililerini hedef alan sadist bir katil olan Riddler'ın bıraktığı ipuçlarını takip ederken şehrin karanlık geçmişiyle yüzleşir.",
                cast: [
                    { name: "Robert Pattinson", role: "Bruce Wayne / Batman" },
                    { name: "Zoë Kravitz", role: "Selina Kyle / Catwoman" },
                    { name: "Paul Dano", role: "Edward Nashton / Riddler" }
                ]
            },
            {
                id: "tmdb-101",
                title: "Oppenheimer",
                type: "movie",
                year: 2023,
                director: "Christopher Nolan",
                country: "ABD / İngiltere",
                runtime: "180 dk",
                imdb: 8.9,
                status: "watched",
                favorite: true,
                genres: ["Biyografi", "Dram", "Tarih"],
                trailerUrl: "uYPbbksJxIg",
                poster: "https://m.media-amazon.com/images/M/MV5BMDBmYTZjNjUtN2M1MS00MTQ5LTk4OWEtX3FlYWU2M2IzOTU3XkEyXkFqcGdeQXVyMTUzMTg2ODkz._V1_FMjpg_UX1000_.jpg",
                overview: "Amerikalı bilim insanı J. Robert Oppenheimer'ın atom bombasını geliştirme sürecindeki rolü ve ardından yaşadığı vicdani hesaplaşmalar.",
                cast: [
                    { name: "Cillian Murphy", role: "J. Robert Oppenheimer" },
                    { name: "Emily Blunt", role: "Katherine Oppenheimer" },
                    { name: "Matt Damon", role: "Leslie Groves" }
                ]
            },
            {
                id: "tmdb-102",
                title: "Inception (Başlangıç)",
                type: "movie",
                year: 2010,
                director: "Christopher Nolan",
                country: "ABD",
                runtime: "148 dk",
                imdb: 8.8,
                status: "watched",
                favorite: true,
                genres: ["Bilim Kurgu", "Aksiyon"],
                trailerUrl: "YoHD9XEinc0",
                poster: "https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_FMjpg_UX1000_.jpg",
                overview: "Hırsızlık sanatında uzmanlaşmış Dom Cobb, insanların rüyalarından en değerli sırları çalmaktadır.",
                cast: [
                    { name: "Leonardo DiCaprio", role: "Dom Cobb" },
                    { name: "Joseph Gordon-Levitt", role: "Arthur" },
                    { name: "Elliot Page", role: "Ariadne" }
                ]
            }
        ];

        // Sanatçı Bilgi Veritabanı
        const actorDatabase = {
            "Christian Bale": {
                bio: "Christian Bale, İngiliz sinema oyuncusudur. Metot oyunculuğuyla ve rollerine uyum sağlamak için geçirdiği aşırı fiziksel değişimlerle tanınır. Academy Award ve Altın Küre ödülü sahibidir.",
                filmography: [
                    { title: "The Dark Knight", year: 2008, role: "Bruce Wayne / Batman" },
                    { title: "American Psycho", year: 2000, role: "Patrick Bateman" },
                    { title: "The Prestige", year: 2006, role: "Alfred Borden" },
                    { title: "Ford v Ferrari", year: 2019, role: "Ken Miles" }
                ]
            },
            "Heath Ledger": {
                bio: "Heath Ledger, Avustralyalı oyuncudur. The Dark Knight filmindeki efsanevi Joker rolüyle En İyi Yardımcı Erkek Oyuncu dalında Akademi Ödülü kazanmıştır.",
                filmography: [
                    { title: "The Dark Knight", year: 2008, role: "Joker" },
                    { title: "Brokeback Mountain", year: 2005, role: "Ennis Del Mar" },
                    { title: "10 Things I Hate About You", year: 1999, role: "Patrick Verona" }
                ]
            },
            "Robert Pattinson": {
                bio: "Robert Pattinson, İngiliz oyuncudur. Twilight serisi, Tenet, The Lighthouse ve The Batman filmlerindeki performansıyla geniş bir hayran kitlesi edinmiştir.",
                filmography: [
                    { title: "The Batman", year: 2022, role: "Bruce Wayne / Batman" },
                    { title: "Tenet", year: 2020, role: "Neil" },
                    { title: "The Lighthouse", year: 2019, role: "Ephraim Winslow" }
                ]
            },
            "Cillian Murphy": {
                bio: "Cillian Murphy, İrlandalı tiyatro ve sinema oyuncusu. Peaky Blinders dizisindeki Thomas Shelby ve Christopher Nolan'ın Oppenheimer filmindeki performansıyla Akademi Ödülü kazanmıştır.",
                filmography: [
                    { title: "Oppenheimer", year: 2023, role: "J. Robert Oppenheimer" },
                    { title: "Inception", year: 2010, role: "Robert Fischer" },
                    { title: "Peaky Blinders", year: 2013, role: "Thomas Shelby" }
                ]
            },
            "Leonardo DiCaprio": {
                bio: "Leonardo DiCaprio, Amerikalı oyuncu ve yapımcı. Titanic, Inception, Wolf of Wall Street ve The Revenant gibi sinema tarihinin en popüler yapımlarında yer almış Oscar ödüllü aktör.",
                filmography: [
                    { title: "Inception", year: 2010, role: "Cobb" },
                    { title: "Titanic", year: 1997, role: "Jack Dawson" },
                    { title: "The Revenant", year: 2015, role: "Hugh Glass" }
                ]
            }
        };

        // Kütüphaneyi LocalStorage'dan Yükle / Başlat
        let movies = [];

        // Eski yedeklerle uyumlu, ancak bozuk/yanlış biçimli veriyi reddeden temel şema kontrolü.
        function isValidArchive(value) {
            return Array.isArray(value) && value.every(item =>
                item &&
                typeof item === 'object' &&
                !Array.isArray(item) &&
                (typeof item.id === 'string' || typeof item.id === 'number') &&
                typeof item.title === 'string' &&
                item.title.trim().length > 0
            );
        }

        function loadFromLocalStorage() {
            try {
                const data = localStorage.getItem(STORAGE_KEY);
                if (data) {
                    const parsed = JSON.parse(data);
                    if (isValidArchive(parsed)) {
                        movies = parsed;
                    } else {
                        // Hatalı kayıt varsa otomatik üzerine yazma; kullanıcı verisini koru.
                        console.error("Arşiv biçimi geçersiz. Mevcut LocalStorage kaydı korunuyor.");
                        movies = [];
                    }
                } else {
                    movies = [...onlineCatalog];
                    saveToLocalStorage();
                }
            } catch (e) {
                console.error("LocalStorage arşivi okunamadı; kayıt otomatik olarak silinmedi:", e);
                movies = [];
            }
        }

        function saveToLocalStorage() {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(movies));
            } catch (e) {
                console.error("LocalStorage kaydetme hatası:", e);
            }
        }

        // Oyuncu Görseli ve Profil Yardımcı Fonksiyonları
        function getAvatarUrl(name) {
            return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Oyuncu')}&background=1E293B&color=3B82F6&bold=true&size=128`;
        }

        async function fetchActorImage(actorName, imgElementId) {
            if (!actorName) return;
            if (actorPhotoCache[actorName]) {
                const img = document.getElementById(imgElementId);
                if (img) img.src = actorPhotoCache[actorName];
                return actorPhotoCache[actorName];
            }

            try {
                const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(actorName)}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.thumbnail && data.thumbnail.source) {
                        const imgUrl = data.thumbnail.source;
                        actorPhotoCache[actorName] = imgUrl;
                        const img = document.getElementById(imgElementId);
                        if (img) img.src = imgUrl;
                        return imgUrl;
                    }
                }
            } catch (err) {
                console.warn("Wikipedia görsel çekme hatası:", actorName);
            }

            const fallbackUrl = getAvatarUrl(actorName);
            const img = document.getElementById(imgElementId);
            if (img) img.src = fallbackUrl;
            return fallbackUrl;
        }

        // Tema ve Navigasyon
        function toggleTheme() {
            const html = document.documentElement;
            if (html.classList.contains('dark')) {
                html.classList.remove('dark');
                html.classList.add('light');
                localStorage.setItem('my_library_theme', 'light');
            } else {
                html.classList.remove('light');
                html.classList.add('dark');
                localStorage.setItem('my_library_theme', 'dark');
            }
            if (!document.getElementById('tab-stats').classList.contains('hidden')) {
                renderCharts();
            }
        }

        function initTheme() {
            let savedTheme = 'dark';
            try {
                savedTheme = localStorage.getItem('my_library_theme') || localStorage.getItem('perde_theme') || 'dark';
            } catch (error) {
                console.warn('Tema tercihi okunamadı; koyu tema kullanılacak.', error);
            }
            const root = document.documentElement;
            root.classList.remove('light', 'dark');
            root.classList.add(savedTheme === 'light' ? 'light' : 'dark');
        }

        let activeCategoryFilter = 'all';
        let activeGenreFilter = '';

        function setCategoryFilter(category) {
            activeCategoryFilter = category;
            activeGenreFilter = '';
            const genreSearch = document.getElementById('search-input');
            if (genreSearch) genreSearch.value = '';
            ['all', 'movie', 'tv', 'doc'].forEach(c => {
                const btn = document.getElementById(`cat-${c}`);
                if (btn) {
                    if (c === category) {
                        btn.className = "cat-btn px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 text-white shadow-md transition-all";
                    } else {
                        btn.className = "cat-btn px-3.5 py-1.5 rounded-xl text-xs font-semibold dark:bg-clean-card bg-white dark:text-clean-muted text-light-muted border dark:border-clean-border border-light-border hover:border-blue-500 transition-all";
                    }
                }
            });

            const libraryTypeSelect = document.getElementById('filter-type');
            if (libraryTypeSelect) libraryTypeSelect.value = category;

            switchTab('library');
            applyFilters();
        }

        function filterByMenu(status) {
            switchTab('library');
            const statusSelect = document.getElementById('filter-status');
            if (statusSelect) statusSelect.value = status;
            applyFilters();
        }

        function filterTopRated() {
            switchTab('library');
            const sortSelect = document.getElementById('filter-sort');
            if (sortSelect) sortSelect.value = 'imdb_desc';
            applyFilters();
            showToast('Tüm liste IMDb puanına göre sıralandı!');
        }

        function switchTab(tabId) {
            if (tabId === 'admin' && !isAdminLoggedIn) {
                openAdminAuthModal();
                return;
            }

            ['dashboard', 'library', 'trailers', 'detail', 'stats', 'admin'].forEach(t => {
                const el = document.getElementById(`tab-${t}`);
                if (el) el.classList.toggle('hidden', t !== tabId);
                const navBtn = document.getElementById(`nav-${t}`);
                if (navBtn) {
                    if (t === tabId) {
                        navBtn.className = "nav-btn px-3 py-1.5 rounded-lg text-xs font-semibold dark:text-white text-slate-900 dark:bg-clean-hover bg-white shadow-sm";
                    } else {
                        navBtn.className = "nav-btn px-3 py-1.5 rounded-lg text-xs font-medium dark:text-clean-muted text-light-muted hover:text-blue-500 transition-colors";
                    }
                }
            });
            const categoryNav = document.getElementById('category-navigation');
            if (categoryNav) categoryNav.classList.toggle('hidden', tabId === 'detail');
            if (tabId === 'stats') renderCharts();
            if (tabId === 'library') renderGenreMenu();
            if (tabId === 'trailers') renderTrailerLibrary();
            if (tabId === 'admin') renderAdminTable();
        }

        // Admin Panel Logic & Security
        function getAdminPassword() {
            return localStorage.getItem(ADMIN_PASS_KEY) || 'admin123';
        }

        function openAdminAuthModal() {
            if (isAdminLoggedIn) {
                switchTab('admin');
            } else {
                document.getElementById('admin-auth-modal').classList.remove('hidden');
                document.getElementById('admin-password-input').focus();
            }
        }

        function handleAdminLogin(e) {
            e.preventDefault();
            const inputPass = document.getElementById('admin-password-input').value;
            if (inputPass === getAdminPassword()) {
                isAdminLoggedIn = true;
                closeModal('admin-auth-modal');
                document.getElementById('admin-password-input').value = '';
                showToast('Yönetici girişi başarılı!');
                switchTab('admin');
            } else {
                showToast('Hatalı yönetim şifresi!');
            }
        }

        function lockAdminSession() {
            isAdminLoggedIn = false;
            switchTab('dashboard');
            showToast('Yönetici oturumu kapatıldı.');
        }

        function changeAdminPassword() {
            const curr = document.getElementById('admin-curr-pass').value;
            const newPass = document.getElementById('admin-new-pass').value;

            if (curr !== getAdminPassword()) {
                showToast('Mevcut şifre hatalı!');
                return;
            }
            if (!newPass || newPass.length < 4) {
                showToast('Yeni şifre en az 4 karakter olmalıdır.');
                return;
            }

            localStorage.setItem(ADMIN_PASS_KEY, newPass);
            document.getElementById('admin-curr-pass').value = '';
            document.getElementById('admin-new-pass').value = '';
            showToast('Yönetici şifresi güncellendi.');
        }

        function renderAdminTable() {
            const tbody = document.getElementById('admin-table-body');
            if (!tbody) return;

            tbody.innerHTML = movies.map(m => `
                <tr class="hover:dark:bg-clean-hover hover:bg-slate-50 transition-colors">
                    <td class="py-2.5 px-3 font-bold dark:text-white text-slate-900">${m.title}</td>
                    <td class="py-2.5 px-3 uppercase text-[10px] text-blue-500 font-semibold">${m.type}</td>
                    <td class="py-2.5 px-3 text-slate-400">${m.year}</td>
                    <td class="py-2.5 px-3 text-amber-500 font-bold">${m.imdb}</td>
                    <td class="py-2.5 px-3">
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${m.status === 'watched' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}">
                            ${m.status === 'watched' ? 'İzlendi' : 'İzlenecek'}
                        </span>
                    </td>
                    <td class="py-2.5 px-3 text-right">
                        <button onclick="deleteMovie('${m.id}')" class="text-rose-500 hover:text-rose-700 px-2 py-1">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        }

        function exportArchiveJSON() {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(movies, null, 2));
            const dlAnchorElem = document.createElement('a');
            dlAnchorElem.setAttribute("href", dataStr);
            dlAnchorElem.setAttribute("download", `my-library-backup-${new Date().toISOString().slice(0,10)}.json`);
            dlAnchorElem.click();
            showToast('Arşiv JSON yedek olarak indirildi.');
        }

        function importArchiveJSON(event) {
            const fileReader = new FileReader();
            fileReader.onload = function (e) {
                try {
                    const importedMovies = JSON.parse(e.target.result);
                    if (isValidArchive(importedMovies)) {
                        movies = importedMovies;
                        saveToLocalStorage();
                        renderDashboard();
                        renderLibrary();
                        renderAdminTable();
                        showToast('Arşiv yedekten başarıyla yüklendi!');
                    } else {
                        showToast('Geçersiz yedek dosyası. Her yapımda geçerli bir ID ve başlık bulunmalı.');
                    }
                } catch (err) {
                    showToast('JSON yükleme hatası!');
                }
            };
            if (event.target.files[0]) {
                fileReader.readAsText(event.target.files[0]);
            }
        }

        function resetToDefaultArchive() {
            if (confirm('Tüm yapımlarınız silinecek ve varsayılan listeye dönülecektir. Emin misiniz?')) {
                movies = [...onlineCatalog];
                saveToLocalStorage();
                renderDashboard();
                renderAdminTable();
                showToast('Arşiv varsayılan ayarlara döndürüldü.');
            }
        }

        // Ana sayfa bölüm bağlantıları: ilgili listenin tamamını kütüphanede aç.
        function openHomeCollection(collection) {
            const search = document.getElementById('search-input');
            const type = document.getElementById('filter-type');
            const status = document.getElementById('filter-status');
            const sort = document.getElementById('filter-sort');
            if (search) search.value = '';
            if (type) type.value = 'all';
            if (status) status.value = collection === 'watchlist' ? 'watch_later' : 'all';
            if (sort) sort.value = collection === 'editor' ? 'imdb_desc' : 'newest';
            switchTab('library');
            applyFilters();
        }

        // Dashboard & Liste Görünümleri Render
        function renderDashboard() {
            renderFeaturedHero();
            document.getElementById('stat-total-count').textContent = movies.length;
            document.getElementById('stat-watched-count').textContent = movies.filter(m => m.status === 'watched').length;
            const watchLaterCount = movies.filter(m => m.status === 'watch_later').length;
            document.getElementById('stat-watchlist-count').textContent = watchLaterCount;
            document.getElementById('watchlist-badge').textContent = watchLaterCount + ' yapım';
            document.getElementById('stat-favorite-count').textContent = movies.filter(m => m.favorite).length;
            const picks = [...movies].sort((a,b) => (Number(b.imdb)||0)-(Number(a.imdb)||0) || Number(Boolean(b.favorite))-Number(Boolean(a.favorite))).slice(0,12);
            renderRow('editor-picks-grid', picks.slice(0, 6));
            renderRow('watchlist-row', movies.filter(m => m.status === 'watch_later').slice(0, 6));
            renderRow('recent-row', movies.slice(0, 6));
            renderGenreMenu();
        }

        let featuredHeroIndex = 0;
        let featuredHeroTimer = null;


        function syncHeaderSearch(value) {
            const librarySearch = document.getElementById('search-input');
            if (librarySearch) librarySearch.value = value;
        }

        function openHeaderSearch() {
            const headerSearch = document.getElementById('header-search-input');
            const value = headerSearch ? headerSearch.value : '';
            syncHeaderSearch(value);
            switchTab('library');
            applyFilters();
        }

        function renderFeaturedHero() {
            const container = document.getElementById('ml-featured-hero');
            if (!container) return;
            const safe = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
            const rankedArchive = [...movies].sort((a,b) => (Number(b.imdb)||0)-(Number(a.imdb)||0) || Number(Boolean(b.favorite))-Number(Boolean(a.favorite)));
            const slides = rankedArchive.slice(0, 5);
            if (slides.length < 3) {
                for (const item of [...onlineCatalog].sort((a,b) => (Number(b.imdb)||0)-(Number(a.imdb)||0))) {
                    if (slides.length >= 5) break;
                    if (!slides.some(existing => String(existing.id) === String(item.id))) slides.push(item);
                }
            }
            if (featuredHeroIndex >= slides.length) featuredHeroIndex = 0;
            if (featuredHeroTimer) { clearInterval(featuredHeroTimer); featuredHeroTimer = null; }
            if (!slides.length) {
                container.innerHTML = '<div class="ml-featured-empty"><span>MY LIBRARY</span><h2>Bir sonraki favorin burada.</h2><p>Arşivine yapım eklediğinde manşet alanı otomatik olarak güncellenir.</p><button type="button" onclick="openAddMovieModal()">İlk yapımını ekle <i class="fa-solid fa-arrow-right"></i></button></div>';
                return;
            }
            const slideMarkup = slides.map((item, index) => {
                const id = safe(item.id);
                const title = safe(item.title || 'Öne çıkan yapım');
                const overview = safe(item.overview || 'Koleksiyonundan öne çıkan yapım. Detayları açarak oyuncu kadrosunu, puanını ve diğer bilgileri incele.');
                const image = safe(item.backdrop || item.poster || '');
                const type = item.type === 'tv' ? 'DİZİ' : item.type === 'doc' ? 'BELGESEL' : 'FİLM';
                const genres = Array.isArray(item.genres) ? item.genres.slice(0, 3).join(' · ') : '';
                return '<article class="ml-featured-slide' + (index === featuredHeroIndex ? ' is-active' : '') + '" data-slide="' + index + '" aria-hidden="' + (index === featuredHeroIndex ? 'false' : 'true') + '">' +
                    '<div class="ml-featured-backdrop"><img src="' + image + '" alt="" loading="' + (index === featuredHeroIndex ? 'eager' : 'lazy') + '" onerror="this.onerror=null;this.src=\'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1600&q=85\'"></div><div class="ml-featured-shade"></div>' +
                    '<div class="ml-featured-artwork"><img src="' + safe(item.poster || image) + '" alt="' + title + ' afişi" loading="' + (index === featuredHeroIndex ? 'eager' : 'lazy') + '" onerror="this.onerror=null;this.src=\'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=700&q=85\'"></div>' +
                    '<div class="ml-featured-copy"><span class="ml-featured-eyebrow"><i class="fa-solid fa-clapperboard"></i> MY LIBRARY SEÇKİSİ <span>·</span> ' + type + '</span>' +
                    '<h2>' + title + '</h2><div class="ml-featured-meta">' + (item.year ? '<span>' + safe(item.year) + '</span>' : '') + (item.imdb ? '<span class="ml-featured-imdb"><i class="fa-solid fa-star"></i> ' + safe(item.imdb) + ' IMDb</span>' : '') + (genres ? '<span>' + safe(genres) + '</span>' : '') + '</div>' +
                    '<p>' + overview + '</p><div class="ml-featured-actions"><button type="button" onclick="openDetailModal(\'' + id + '\')"><i class="fa-solid fa-circle-info"></i> Detayları Gör</button><button type="button" class="ml-featured-secondary" onclick="switchTab(\'library\')"><i class="fa-solid fa-film"></i> Arşive Git</button></div></div></article>';
            }).join('');
            const dots = slides.map((item,index) => '<button type="button" class="ml-featured-dot' + (index === featuredHeroIndex ? ' is-active' : '') + '" onclick="changeFeaturedHero(' + index + ')" aria-label="' + (index+1) + '. manşeti göster" aria-current="' + (index === featuredHeroIndex ? 'true' : 'false') + '"></button>').join('');
            container.innerHTML = '<div class="ml-featured-track">' + slideMarkup + '</div><div class="ml-featured-controls"><button type="button" class="ml-featured-arrow" onclick="changeFeaturedHero(featuredHeroIndex - 1)" aria-label="Önceki manşet"><i class="fa-solid fa-chevron-left"></i></button><div class="ml-featured-dots">' + dots + '</div><button type="button" class="ml-featured-arrow" onclick="changeFeaturedHero(featuredHeroIndex + 1)" aria-label="Sonraki manşet"><i class="fa-solid fa-chevron-right"></i></button><span class="ml-featured-counter">' + String(featuredHeroIndex+1).padStart(2,'0') + ' / ' + String(slides.length).padStart(2,'0') + '</span></div>';
            if (slides.length > 1) featuredHeroTimer = setInterval(() => changeFeaturedHero(featuredHeroIndex + 1, false), 6000);
        }

        function changeFeaturedHero(nextIndex, restartTimer = true) {
            const container = document.getElementById('ml-featured-hero');
            if (!container) return;
            const slides = container.querySelectorAll('.ml-featured-slide');
            if (!slides.length) return;
            featuredHeroIndex = (nextIndex + slides.length) % slides.length;
            slides.forEach((slide,index) => {
                const active = index === featuredHeroIndex;
                slide.classList.toggle('is-active', active);
                slide.setAttribute('aria-hidden', active ? 'false' : 'true');
            });
            container.querySelectorAll('.ml-featured-dot').forEach((dot,index) => {
                const active = index === featuredHeroIndex;
                dot.classList.toggle('is-active', active);
                dot.setAttribute('aria-current', active ? 'true' : 'false');
            });
            const counter = container.querySelector('.ml-featured-counter');
            if (counter) counter.textContent = String(featuredHeroIndex+1).padStart(2,'0') + ' / ' + String(slides.length).padStart(2,'0');
            if (restartTimer && featuredHeroTimer) {
                clearInterval(featuredHeroTimer);
                featuredHeroTimer = setInterval(() => changeFeaturedHero(featuredHeroIndex + 1, false), 6000);
            }
        }

        function renderRow(containerId, list) {
            const container = document.getElementById(containerId);
            if (!container) return;
            if (!list.length) {
                container.innerHTML = '<div class="col-span-full ml-empty-state"><i class="fa-solid fa-film"></i><span>Henüz burada bir yapım yok. Arşivine yapım ekleyerek başlayabilirsin.</span></div>';
                return;
            }
            const safe = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
            container.innerHTML = list.map(m => {
                const type = m.type === 'tv' ? 'DİZİ' : m.type === 'doc' ? 'BELGESEL' : 'FİLM';
                const watched = m.status === 'watched';
                const genres = Array.isArray(m.genres) ? m.genres.slice(0,2).join(' · ') : '';
                const title = safe(m.title), id = safe(m.id);
                return '<article class="ml-catalog-card" role="button" tabindex="0" aria-label="' + title + ' detaylarını aç" onclick="openDetailModal(\'' + id + '\')" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();openDetailModal(\'' + id + '\')}">' +
                    '<div class="ml-catalog-poster"><img src="' + safe(m.poster || '') + '" alt="' + title + ' afişi" loading="lazy" onerror="this.onerror=null;this.src=\'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80\'">' +
                    '<span class="ml-catalog-type">' + type + '</span><span class="ml-catalog-rating"><i class="fa-solid fa-star"></i> ' + safe(m.imdb || '—') + '</span>' +
                    (m.favorite ? '<span class="ml-catalog-favorite"><i class="fa-solid fa-heart"></i></span>' : '') +
                    '<span class="ml-catalog-overlay"><i class="fa-solid fa-arrow-up-right-from-square"></i> DETAYLAR</span></div>' +
                    '<div class="ml-catalog-meta"><h3 title="' + title + '">' + title + '</h3><div class="ml-catalog-sub"><span>' + safe(m.year || '—') + '</span>' +
                    (genres ? '<span class="ml-catalog-separator">•</span><span class="ml-catalog-genre">' + safe(genres) + '</span>' : '') +
                    '</div><div class="ml-catalog-status"><span class="ml-catalog-status-dot ' + (watched ? 'watched' : 'planned') + '"></span>' + (watched ? 'İzlendi' : 'İzleme listesinde') + '</div></div></article>';
            }).join('');
        }

        function renderLibrary() {
            applyFilters();
        }

        function toggleGenreMenu() {
            const panel = document.getElementById('genre-menu-panel');
            const button = document.querySelector('.ml-genre-toggle');
            if (!panel || !button) return;
            const opening = panel.classList.contains('hidden');
            panel.classList.toggle('hidden', !opening);
            button.setAttribute('aria-expanded', String(opening));
            const chevron = document.getElementById('genre-menu-chevron');
            if (chevron) chevron.className = opening ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down';
            if (opening) renderGenreMenu();
        }

        function renderGenreMenu() {
            const container = document.getElementById('genre-menu-list');
            const total = document.getElementById('genre-total-count');
            if (!container) return;
            const counts = new Map();
            movies.forEach(movie => {
                const genres = Array.isArray(movie.genres) ? movie.genres : [];
                [...new Set(genres.map(g => String(g || '').trim()).filter(Boolean))].forEach(genre => {
                    counts.set(genre, (counts.get(genre) || 0) + 1);
                });
            });
            const entries = [...counts.entries()].sort((a,b) => a[0].localeCompare(b[0], 'tr'));
            if (total) total.textContent = entries.length + ' tür';
            if (!entries.length) {
                container.innerHTML = '<p class="ml-genre-empty">Arşivinde henüz kategorilendirilmiş yapım bulunmuyor.</p>';
                return;
            }
            const safe = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
            container.innerHTML = entries.map(([genre,count]) => '<button type="button" class="ml-genre-item' + (activeGenreFilter === genre ? ' active' : '') + '" onclick="filterByGenre(decodeURIComponent(\'' + encodeURIComponent(genre) + '\'))"><span>' + safe(genre) + '</span><b>' + count + '</b></button>').join('');
        }

        function filterByGenre(genre) {
            activeGenreFilter = genre;
            switchTab('library');
            const typeSelect = document.getElementById('filter-type');
            const statusSelect = document.getElementById('filter-status');
            const search = document.getElementById('search-input');
            if (typeSelect) typeSelect.value = 'all';
            if (statusSelect) statusSelect.value = 'all';
            if (search) search.value = '';
            renderGenreMenu();
            applyFilters();
            const panel = document.getElementById('genre-menu-panel');
            const button = document.querySelector('.ml-genre-toggle');
            if (panel) panel.classList.add('hidden');
            if (button) button.setAttribute('aria-expanded', 'false');
            const chevron = document.getElementById('genre-menu-chevron');
            if (chevron) chevron.className = 'fa-solid fa-chevron-down';
        }

        function applyFilters() {
            const query = (document.getElementById('search-input')?.value || '').toLowerCase();
            const typeFilter = document.getElementById('filter-type')?.value || 'all';
            const statusFilter = document.getElementById('filter-status')?.value || 'all';
            const sortFilter = document.getElementById('filter-sort')?.value || 'newest';

            let filtered = movies.filter(m => {
                const matchesQuery = (m.title && m.title.toLowerCase().includes(query)) ||
                                     (m.director && m.director.toLowerCase().includes(query)) ||
                                     (m.cast && m.cast.some(c => c.name && c.name.toLowerCase().includes(query)));
                const matchesType = typeFilter === 'all' || m.type === typeFilter;
                const matchesGenre = !activeGenreFilter || (Array.isArray(m.genres) && m.genres.some(g => String(g).trim() === activeGenreFilter));
                const matchesStatus = statusFilter === 'all' || 
                                     (statusFilter === 'favorite' ? m.favorite : m.status === statusFilter);

                return matchesQuery && matchesType && matchesStatus && matchesGenre;
            });

            if (sortFilter === 'imdb_desc') filtered.sort((a, b) => b.imdb - a.imdb);
            else if (sortFilter === 'year_desc') filtered.sort((a, b) => b.year - a.year);
            else if (sortFilter === 'title_asc') filtered.sort((a, b) => a.title.localeCompare(b.title));

            renderRow('library-grid', filtered);
        }

        function renderTrailerLibrary() {
            const trailerItems = movies.filter(movie => getYouTubeVideoId(movie.trailerUrl || ''));
            const count = document.getElementById('trailer-count');
            if (count) count.textContent = trailerItems.length + ' yapım';
            renderRow('trailers-grid', trailerItems);
        }

        // Oyuncu Biyografisi Açma Modal Fonksiyonu
        async function openActorBio(actorName) {
            if (!actorName) return;

            const actor = actorDatabase[actorName] || {
                bio: `${actorName}, sinema ve televizyon dünyasında tanınmış bir sanatçıdır. Biyografisi veritabanımızda güncellenmektedir.`,
                filmography: movies.filter(m => m.cast && m.cast.some(c => c.name && c.name.toLowerCase() === actorName.toLowerCase())).map(m => ({
                    title: m.title,
                    year: m.year,
                    role: m.cast.find(c => c.name && c.name.toLowerCase() === actorName.toLowerCase())?.role || 'Oyuncu'
                }))
            };

            const modalId = 'actor-modal-img-' + Math.random().toString(36).substring(2, 7);

            const content = document.getElementById('actor-modal-content');
            content.innerHTML = `
                <div class="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
                    <img id="${modalId}" src="${getAvatarUrl(actorName)}" class="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover shadow-xl border border-white/10 shrink-0 bg-slate-800" onerror="this.src='${getAvatarUrl(actorName)}'">
                    <div class="space-y-2 text-center sm:text-left">
                        <span class="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20 uppercase tracking-wider">Sanatçı Profili</span>
                        <h3 class="text-xl font-bold dark:text-white text-slate-900">${actorName}</h3>
                        <p class="text-xs dark:text-slate-300 text-slate-600 leading-relaxed">${actor.bio}</p>
                    </div>
                </div>

                <div class="mt-6 pt-4 border-t dark:border-clean-border border-light-border space-y-3">
                    <h4 class="text-xs font-bold uppercase tracking-wider dark:text-clean-muted text-light-muted flex items-center gap-2">
                        <i class="fa-solid fa-clapperboard text-blue-500"></i> Oynadığı Diğer Yapımlar
                    </h4>
                    <div class="space-y-2 max-h-48 overflow-y-auto pr-1">
                        ${(actor.filmography && actor.filmography.length > 0) ? actor.filmography.map(f => `
                            <div class="flex items-center justify-between p-2.5 rounded-xl dark:bg-clean-bg bg-slate-50 border dark:border-clean-border border-light-border text-xs">
                                <div>
                                    <h5 class="font-bold dark:text-white text-slate-900">${f.title}</h5>
                                    <p class="text-[10px] dark:text-clean-muted text-light-muted">${f.role}</p>
                                </div>
                                <span class="font-semibold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded">${f.year}</span>
                            </div>
                        `).join('') : '<p class="text-xs text-slate-400">Kayıtlı başka bir yapım bulunamadı.</p>'}
                    </div>
                </div>
            `;

            document.getElementById('actor-modal').classList.remove('hidden');

            fetchActorImage(actorName, modalId);
        }

        // YouTube bağlantısından video kimliğini çıkarır; API anahtarı gerektirmez.
        function getYouTubeVideoId(value) {
            if (!value) return '';
            const raw = String(value).trim();
            if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw;
            try {
                const url = new URL(raw.startsWith('http') ? raw : 'https://' + raw);
                const host = url.hostname.replace(/^www\./, '').toLowerCase();
                if (host === 'youtu.be') return (url.pathname.split('/').filter(Boolean)[0] || '').match(/^[a-zA-Z0-9_-]{11}$/)?.[0] || '';
                if (host.endsWith('youtube.com') || host === 'youtube-nocookie.com') {
                    const fromQuery = url.searchParams.get('v');
                    if (fromQuery && /^[a-zA-Z0-9_-]{11}$/.test(fromQuery)) return fromQuery;
                    const parts = url.pathname.split('/').filter(Boolean);
                    const marker = parts.findIndex(part => ['embed', 'shorts', 'live', 'v'].includes(part));
                    if (marker >= 0 && parts[marker + 1] && /^[a-zA-Z0-9_-]{11}$/.test(parts[marker + 1])) return parts[marker + 1];
                }
            } catch (e) {}
            return '';
        }

        function escapeTrailerField(value) {
            return String(value || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        }

        // Ülke adlarını normalize eder; bayrakları emoji yerine gerçek görsel olarak gösterir.
        function renderCountryCredits(value) {
            const countryMap = {
                'united states of america':['us','Amerika Birleşik Devletleri'],'united states':['us','Amerika Birleşik Devletleri'],'usa':['us','Amerika Birleşik Devletleri'],'abd':['us','Amerika Birleşik Devletleri'],'amerika birleşik devletleri':['us','Amerika Birleşik Devletleri'],'us':['us','Amerika Birleşik Devletleri'],
                'united kingdom':['gb','Birleşik Krallık'],'uk':['gb','Birleşik Krallık'],'great britain':['gb','Birleşik Krallık'],'birleşik krallık':['gb','Birleşik Krallık'],'england':['gb','İngiltere'],'ingiltere':['gb','İngiltere'],
                'turkey':['tr','Türkiye'],'türkiye':['tr','Türkiye'],'turkiye':['tr','Türkiye'],'south korea':['kr','Güney Kore'],'korea':['kr','Güney Kore'],'north korea':['kp','Kuzey Kore'],
                'russia':['ru','Rusya'],'russian federation':['ru','Rusya'],'china':['cn','Çin'],'japan':['jp','Japonya'],'france':['fr','Fransa'],'germany':['de','Almanya'],'italy':['it','İtalya'],'spain':['es','İspanya'],'canada':['ca','Kanada'],'australia':['au','Avustralya'],'india':['in','Hindistan'],'brazil':['br','Brezilya'],'mexico':['mx','Meksika'],'ireland':['ie','İrlanda'],'scotland':['gb-sct','İskoçya'],'wales':['gb-wls','Galler'],'sweden':['se','İsveç'],'norway':['no','Norveç'],'denmark':['dk','Danimarka'],'finland':['fi','Finlandiya'],'netherlands':['nl','Hollanda'],'belgium':['be','Belçika'],'switzerland':['ch','İsviçre'],'austria':['at','Avusturya'],'poland':['pl','Polonya'],'ukraine':['ua','Ukrayna'],'greece':['gr','Yunanistan'],'portugal':['pt','Portekiz'],'new zealand':['nz','Yeni Zelanda'],'south africa':['za','Güney Afrika'],'iran':['ir','İran'],'iraq':['iq','Irak'],'israel':['il','İsrail'],'egypt':['eg','Mısır'],'argentina':['ar','Arjantin'],'chile':['cl','Şili'],'colombia':['co','Kolombiya'],'thailand':['th','Tayland'],'indonesia':['id','Endonezya'],'hong kong':['hk','Hong Kong'],'taiwan':['tw','Tayvan'],'czech republic':['cz','Çekya'],'czechia':['cz','Çekya'],'romania':['ro','Romanya'],'hungary':['hu','Macaristan'],'bulgaria':['bg','Bulgaristan'],'croatia':['hr','Hırvatistan'],'serbia':['rs','Sırbistan'],'iceland':['is','İzlanda'],'malta':['mt','Malta'],'luxembourg':['lu','Lüksemburg'],'uae':['ae','Birleşik Arap Emirlikleri'],'united arab emirates':['ae','Birleşik Arap Emirlikleri']
            };
            const entries = String(value || '').split(/ *\/ *|, */).map(part => part.trim()).filter(Boolean);
            if (!entries.length || entries.some(part => ['bilinmiyor','unknown','n/a'].includes(part.toLocaleLowerCase('tr-TR')))) {
                return '<span class="perde-country-empty">Ülke bilgisi bulunmuyor</span>';
            }
            const countries = entries.map(entry => {
                const prefixed = entry.match(/^([a-z]{2})[ \t]+(.+)$/i);
                const candidates = prefixed ? [prefixed[2].trim(), entry] : [entry];
                for (const candidate of candidates) {
                    const key = candidate.toLocaleLowerCase('tr-TR');
                    const match = countryMap[key] || countryMap[candidate.toLowerCase()];
                    if (match) return { code: match[0], name: match[1] };
                }
                if (prefixed) return { code: prefixed[1].toLowerCase(), name: prefixed[2].trim() };
                if (/^[a-z]{2}$/i.test(entry)) {
                    const code = entry.toLowerCase();
                    const known = Object.values(countryMap).find(item => item[0] === code);
                    return known ? { code, name: known[1] } : null;
                }
                return { code: '', name: entry };
            }).filter(Boolean);
            if (!countries.length) return '<span class="perde-country-empty">Ülke bilgisi bulunmuyor</span>';
            return countries.map(country => {
                const flag = country.code
                    ? '<img class="perde-country-flag" src="https://flagcdn.com/w40/' + country.code + '.png" srcset="https://flagcdn.com/w80/' + country.code + '.png 2x" alt="" loading="lazy" onerror="this.style.display=\'none\'">'
                    : '<span class="perde-country-flag-fallback" aria-hidden="true"><i class="fa-solid fa-globe"></i></span>';
                return '<span class="perde-country-item">' + flag + '<span class="perde-country-name">' + escapeTrailerField(country.name) + '</span></span>';
            }).join('');
        }

        function saveTrailerUrl(id) {
            const input = document.getElementById('trailer-url-input');
            const entered = (input?.value || '').trim();
            const videoId = getYouTubeVideoId(entered);
            if (!videoId) {
                showToast('Geçerli bir YouTube video bağlantısı veya 11 karakterli video kimliği girin.');
                return;
            }
            const movie = movies.find(item => String(item.id) === String(id));
            if (!movie) {
                showToast('Fragman bağlantısı yalnızca arşive eklenmiş yapımlara kaydedilebilir.');
                return;
            }
            movie.trailerUrl = 'https://www.youtube.com/watch?v=' + videoId;
            saveToLocalStorage();
            showToast('Fragman bağlantısı kaydedildi.');
            openDetailModal(id, 'tr_sub');
        }

        function openDetailModal(id, trailerMode = null) {
            const m = movies.find(x => x.id === id) || onlineCatalog.find(x => x.id === id) || fetchedOnlineResults.find(x => x.id === id);
            if (!m) return;

            const modalContent = document.getElementById(trailerMode ? 'detail-modal-content' : 'detail-page-content');

            if (trailerMode) {
                let searchQuery = m.title + ' fragman';
                if (trailerMode === 'tr_dub') searchQuery += ' türkçe dublaj';
                if (trailerMode === 'tr_sub') searchQuery += ' türkçe altyazılı';

                const videoId = getYouTubeVideoId(m.trailerUrl || '');
                const searchUrl = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(searchQuery);
                // Fragman bağlantısı kayıtlı değilse tıklama doğrudan YouTube arama sonuçlarını açar.
                if (!videoId) window.open(searchUrl, '_blank', 'noopener,noreferrer');
                const safeTitle = escapeTrailerField(m.title);
                const playerMarkup = videoId
                    ? '<div class="aspect-video w-full bg-black"><iframe title="' + safeTitle + ' fragman" class="w-full h-full" src="https://www.youtube-nocookie.com/embed/' + videoId + '?autoplay=1&rel=0&playsinline=1" frameborder="0" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>'
                    : '<div class="aspect-video w-full bg-black flex flex-col items-center justify-center text-center text-white p-6 gap-3"><i class="fa-brands fa-youtube text-4xl text-red-500"></i><h3 class="font-bold text-lg">' + safeTitle + ' için kayıtlı fragman bağlantısı yok</h3><p class="text-sm text-slate-300 max-w-lg">YouTube araması yeni sekmede açılır. İsterseniz aşağıya doğru fragman videosunun bağlantısını ekleyip kaydedebilirsiniz.</p><a href="' + searchUrl + '" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-xl text-sm"><i class="fa-brands fa-youtube"></i>YouTube’da fragman ara</a></div>';

                modalContent.innerHTML =
                    playerMarkup +
                    '<div class="p-4 space-y-4 border-t dark:border-clean-border border-light-border dark:bg-slate-900 bg-white dark:text-white text-slate-900">' +
                      '<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><h3 class="font-bold text-sm">' + safeTitle + ' — Fragman</h3><p class="text-[11px] dark:text-slate-400 text-slate-500">' + (videoId ? 'Kayıtlı YouTube videosu oynatılıyor.' : 'Video otomatik bulunamadı; arama bağlantısını kullanabilirsiniz.') + '</p></div>' +
                      '<div class="flex flex-wrap items-center gap-2"><button onclick="openDetailModal(&#39;' + m.id + '&#39;, &#39;tr_sub&#39;)" class="text-xs dark:bg-white/10 bg-slate-100 hover:bg-slate-200 dark:hover:bg-white/20 px-2.5 py-1.5 rounded-lg">Altyazılı ara</button><button onclick="openDetailModal(&#39;' + m.id + '&#39;, &#39;tr_dub&#39;)" class="text-xs dark:bg-white/10 bg-slate-100 hover:bg-slate-200 dark:hover:bg-white/20 px-2.5 py-1.5 rounded-lg">Dublajlı ara</button><a href="' + searchUrl + '" target="_blank" rel="noopener noreferrer" class="text-xs text-red-500 font-semibold hover:underline">YouTube’da aç ↗</a><button onclick="openDetailModal(&#39;' + m.id + '&#39;)" class="text-xs text-blue-500 font-semibold hover:underline">← Detaylara dön</button></div></div>' +
                      '<div class="pt-3 border-t dark:border-white/10 border-slate-200"><label for="trailer-url-input" class="block text-xs font-semibold mb-2">Bu yapımın fragman bağlantısı</label><div class="flex flex-col sm:flex-row gap-2"><input id="trailer-url-input" type="url" value="' + escapeTrailerField(m.trailerUrl || '') + '" placeholder="YouTube bağlantısını buraya yapıştırın" class="input-field flex-1 px-3 py-2 text-xs rounded-xl"><button onclick="saveTrailerUrl(&#39;' + m.id + '&#39;)" class="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-xl">Bağlantıyı kaydet</button></div><p class="text-[10px] dark:text-slate-400 text-slate-500 mt-2">Bağlantı bu film kaydına ve yerel arşivinize kaydedilir. Altyazı/dublaj bulunması videoya bağlıdır.</p></div>' +
                    '</div>';

            } else {
                modalContent.innerHTML = `
                    <div class="perde-imdb-detail">
                        <section class="perde-imdb-hero" style="--perde-hero-image:url('${m.backdrop || m.poster || ''}')">
                            <img class="perde-imdb-backdrop" src="${m.backdrop || m.poster || ''}" alt="" onerror="this.src='${m.poster || ''}'">
                            <div class="perde-imdb-hero-shade"></div>
                            <div class="perde-imdb-hero-top"><span class="perde-imdb-brand">My Library<span>ARŞİV</span></span><span class="perde-imdb-type">${m.type === 'tv' ? 'DİZİ' : m.type === 'doc' ? 'BELGESEL' : 'FİLM'}</span></div>
                            <div class="perde-imdb-feature-art"><img src="${m.poster || m.backdrop || ''}" alt="${m.title} afişi" onerror="this.src='${m.backdrop || ''}'"><button onclick="openDetailModal('${m.id}', 'tr_sub')" class="perde-imdb-play" aria-label="${m.title} fragmanını oynat"><i class="fa-solid fa-play"></i><span>FRAGMANI İZLE</span></button></div>
                            <div class="perde-imdb-hero-copy"><div class="perde-imdb-kicker">${m.year || 'Yıl bilinmiyor'} <span>•</span> ${m.runtime || 'Süre bilgisi yok'}</div><h2>${m.title}</h2><div class="perde-imdb-genres">${m.genres && m.genres.length ? m.genres.map(g => `<span>${g}</span>`).join('') : '<span>Sinema</span>'}</div></div>
                        </section>
                        <section class="perde-imdb-content">
                            <aside class="perde-imdb-poster-wrap">
                                <img class="perde-imdb-poster" src="${m.poster || ''}" alt="${m.title} afişi" onerror="this.src='https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80'">
                                <section class="perde-film-credits" aria-label="Film künyesi">
                                    <h3><i class="fa-solid fa-ticket"></i> Film Künyesi</h3>
                                    <dl>
                                        <div><dt>Yönetmen</dt><dd>${m.director || 'Bilinmiyor'}</dd></div>
                                        <div><dt>Yapım yılı</dt><dd>${m.year || 'Bilinmiyor'}</dd></div>
                                        <div><dt>Süre</dt><dd>${m.runtime || 'Bilinmiyor'}</dd></div>
                                        <div class="perde-film-country-row"><dt>Ülke</dt><dd class="perde-film-country-list">${renderCountryCredits(m.country)}</dd></div>
                                        <div><dt>Tür</dt><dd>${m.genres && m.genres.length ? m.genres.join(', ') : 'Bilinmiyor'}</dd></div>
                                    </dl>
                                </section>
                            </aside>
                            <div class="perde-imdb-main">
                                <div class="perde-imdb-rating-row"><div class="perde-imdb-score"><strong>${m.imdb || '—'}</strong><span>IMDb</span></div><button onclick="toggleFavorite('${m.id}')" class="perde-imdb-fav ${m.favorite ? 'is-favorite' : ''}"><i class="fa-solid fa-heart"></i> ${m.favorite ? 'Favorilerde' : 'Favorilere Ekle'}</button></div>
                                <p class="perde-imdb-overview">${m.overview || 'Bu yapım için henüz bir konu özeti eklenmemiş.'}</p>
                                
                                <div class="perde-imdb-actions"><label class="perde-imdb-watch-label">İZLEME LİSTEM<select onchange="updateMovieStatus('${m.id}', this.value)" class="input-field"><option value="watched" ${m.status === 'watched' ? 'selected' : ''}>İzledim</option><option value="watch_later" ${m.status === 'watch_later' ? 'selected' : ''}>İzleyeceğim</option></select></label><button onclick="openDetailModal('${m.id}', 'tr_sub')" class="perde-imdb-action-btn"><i class="fa-solid fa-closed-captioning"></i> Altyazılı fragman</button><button onclick="openDetailModal('${m.id}', 'tr_dub')" class="perde-imdb-action-btn"><i class="fa-solid fa-microphone"></i> Dublajlı fragman</button><button onclick="deleteMovie('${m.id}')" class="perde-imdb-delete"><i class="fa-solid fa-trash"></i> Arşivden sil</button></div>
                                <div class="perde-imdb-cast"><h3>Oyuncular ve ekip</h3><div class="perde-imdb-cast-grid">${(m.cast && m.cast.length > 0) ? m.cast.map((c, idx) => { const imgId = `actor-img-${m.id}-${idx}`; const safeActorName = (c.name || 'Oyuncu').replace(/'/g, "\\'"); return `<button onclick="openActorBio('${safeActorName}')" class="perde-imdb-cast-card"><img id="${imgId}" src="${getAvatarUrl(c.name)}" alt="${c.name || 'Oyuncu'}"><span><b>${c.name || 'Bilinmiyor'}</b><small>${c.role || 'Karakter bilgisi yok'}</small></span></button>`; }).join('') : '<p class="perde-imdb-no-cast">Oyuncu bilgisi bulunmuyor.</p>'}</div></div>
                            </div>
                        </section>
                        <section class="perde-similar" aria-label="Benzer yapımlar">
                            <h3>Benzer Yapımlar</h3>
                            <div id="perde-similar-grid" class="perde-similar-grid"><p class="perde-similar-loading">Benzer yapımlar yükleniyor…</p></div>
                        </section>
                    </div>
                `;

                loadSimilarProductions(m);

                if (m.cast && m.cast.length > 0) {
                    m.cast.forEach((c, idx) => {
                        const imgId = `actor-img-${m.id}-${idx}`;
                        fetchActorImage(c.name, imgId);
                    });
                }
            }

            if (trailerMode) {
                document.getElementById('detail-modal').classList.remove('hidden');
            } else {
                closeModal('detail-modal');
                switchTab('detail');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }

        async function loadSimilarProductions(movie) {
            const container = document.getElementById('perde-similar-grid');
            if (!container) return;
            const apiKey = 'feec99b21abf1323730ff9fdc6e4e912';
            const mediaType = movie.type === 'tv' ? 'tv' : 'movie';
            const apiBase = 'https://api.themoviedb.org/3/';
            // "Listemde" yalnızca kullanıcının kalıcı arşivindeki kayıtları ifade eder.
            const findInList = item => movies.find(existing =>
                (existing.tmdbId && String(existing.tmdbId) === String(item.tmdbId)) ||
                (existing.id && existing.id === item.id) ||
                ((existing.title || '').trim().toLocaleLowerCase('tr') === (item.title || '').trim().toLocaleLowerCase('tr') &&
                 String(existing.year || '') === String(item.year || ''))
            );
            const esc = value => String(value || '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
            try {
                let tmdbId = movie.tmdbId || (String(movie.id || '').startsWith('tmdb-') ? String(movie.id).split('-').pop() : '');
                if (!tmdbId) {
                    const searchResponse = await fetch(apiBase + 'search/' + mediaType + '?api_key=' + encodeURIComponent(apiKey) + '&language=tr-TR&query=' + encodeURIComponent(movie.title || ''));
                    const searchData = await searchResponse.json();
                    const match = (searchData.results || [])[0];
                    tmdbId = match && match.id;
                }
                if (!tmdbId) throw new Error('TMDb eşleşmesi bulunamadı');
                const response = await fetch(apiBase + mediaType + '/' + tmdbId + '/recommendations?api_key=' + encodeURIComponent(apiKey) + '&language=tr-TR&page=1');
                const data = await response.json();
                if (!response.ok || !Array.isArray(data.results)) throw new Error('Benzer yapımlar alınamadı');
                const recommendations = data.results.filter(item => (item.title || item.name) && String(item.id) !== String(tmdbId)).slice(0, 6).map(item => {
                    const title = item.title || item.name || 'İsimsiz yapım';
                    const date = item.release_date || item.first_air_date || '';
                    const normalized = {
                        id: 'tmdb-' + mediaType + '-' + item.id,
                        source: 'tmdb',
                        tmdbId: item.id,
                        title,
                        type: mediaType === 'tv' ? 'tv' : 'movie',
                        year: parseInt(date.slice(0, 4), 10) || '',
                        director: 'Bilinmiyor',
                        country: 'Bilinmiyor',
                        runtime: 'Bilinmiyor',
                        imdb: Number(item.vote_average) > 0 ? Number(item.vote_average).toFixed(1) : '—',
                        status: 'watched',
                        favorite: false,
                        genres: [],
                        trailerUrl: '',
                        poster: item.poster_path ? 'https://image.tmdb.org/t/p/w500' + item.poster_path : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80',
                        overview: item.overview || title + ' yapımı.',
                        cast: []
                    };
                    return { ...normalized, inList: !!findInList(normalized) };
                });
                if (!recommendations.length) {
                    container.innerHTML = '<p class="perde-similar-empty">Bu yapım için benzer öneri bulunamadı.</p>';
                    return;
                }
                recommendations.forEach(item => {
                    if (!fetchedOnlineResults.some(existing => existing.id === item.id)) fetchedOnlineResults.push(item);
                });
                container.innerHTML = recommendations.map(item => `
                    <article class="perde-similar-card">
                        <button class="perde-similar-poster" onclick="openDetailModal('${item.id}')" aria-label="${esc(item.title)} detaylarını aç">
                            <img src="${item.poster}" alt="${esc(item.title)}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80'">
                        </button>
                        <div class="perde-similar-info">
                            <button class="perde-similar-title" onclick="openDetailModal('${item.id}')">${esc(item.title)}</button>
                            <small>${item.year || 'Yıl bilinmiyor'}</small>
                            <div class="perde-similar-status ${item.inList ? 'is-added' : 'is-missing'}">${item.inList ? '<i class="fa-solid fa-check"></i> Listemde' : '<i class="fa-solid fa-circle-info"></i> Listemde Yok'}</div>
                            ${item.inList ? '' : `<button class="perde-similar-add" onclick="addSimilarProduction('${item.id}', this)"><i class="fa-solid fa-plus"></i> Listeme Ekle</button>`}
                        </div>
                    </article>
                `).join('');
            } catch (error) {
                container.innerHTML = '<p class="perde-similar-empty">Benzer yapımlar şu anda yüklenemedi.</p>';
            }
        }

        function addSimilarProduction(id, button) {
            const item = fetchedOnlineResults.find(existing => existing.id === id);
            if (!item) return;
            const alreadyAdded = movies.some(existing =>
                (existing.tmdbId && String(existing.tmdbId) === String(item.tmdbId)) ||
                ((existing.title || '').trim().toLocaleLowerCase('tr') === (item.title || '').trim().toLocaleLowerCase('tr') &&
                 String(existing.year || '') === String(item.year || ''))
            );
            if (alreadyAdded) {
                button.outerHTML = '<span class="perde-similar-status is-added"><i class="fa-solid fa-check"></i> Listemde</span>';
                return;
            }

            // Arşivde en yeni kayıt olarak en başa ekle.
            const saved = { ...item, id: 'movie-' + Date.now(), source: 'local', status: 'watch_later', favorite: false };
            delete saved.inList;
            movies.unshift(saved);
            saveToLocalStorage();

            // Dashboard ve kütüphane, uygulamanın gerçek render fonksiyonlarıyla yenilenir.
            renderDashboard();
            renderLibrary();
            showToast('Yapım izleme listene eklendi.');
            button.outerHTML = '<span class="perde-similar-status is-added"><i class="fa-solid fa-check"></i> Listeye Eklendi</span>';
        }


        function toggleFavorite(id) {
            let m = movies.find(x => x.id === id);
            if (!m) {
                const catalogItem = onlineCatalog.find(x => x.id === id) || fetchedOnlineResults.find(x => x.id === id);
                if (catalogItem) {
                    m = { ...catalogItem, id: Date.now().toString() };
                    movies.unshift(m);
                }
            }
            if (m) {
                m.favorite = !m.favorite;
                saveToLocalStorage();
                openDetailModal(m.id);
                renderDashboard();
                showToast(m.favorite ? 'Favorilere eklendi.' : 'Favorilerden çıkarıldı.');
            }
        }

        function updateMovieStatus(id, newStatus) {
            let m = movies.find(x => x.id === id);
            if (!m) {
                const catalogItem = onlineCatalog.find(x => x.id === id) || fetchedOnlineResults.find(x => x.id === id);
                if (catalogItem) {
                    m = { ...catalogItem, id: Date.now().toString() };
                    movies.unshift(m);
                }
            }
            if (m) {
                m.status = newStatus;
                saveToLocalStorage();

                // Detay sayfasındaki seçili izleme durumunu da hemen güncelle.
                const detailPage = document.getElementById('tab-detail');
                if (detailPage && !detailPage.classList.contains('hidden')) {
                    openDetailModal(id);
                }

                renderDashboard();
                renderLibrary();
                showToast('İzleme durumu güncellendi.');
            }
        }

        function deleteMovie(id) {
            movies = movies.filter(x => x.id !== id);
            saveToLocalStorage();
            closeModal('detail-modal');

            // Detay sayfasından silme yapıldıysa artık silinmiş kaydı göstermemek için kütüphaneye dön.
            const detailPage = document.getElementById('tab-detail');
            if (detailPage && !detailPage.classList.contains('hidden')) {
                switchTab('library');
            }

            renderDashboard();
            renderLibrary();
            showToast('Yapım arşivden silindi.');
        }

        // OMDb Araması ve Oyuncu Kadrosu Parsing Mantığı
        function handleCatalogSearch(query) {
            const container = document.getElementById('add-search-results');
            if (!container) return;
            const q = String(query || '').trim();
            if (!q) {
                container.innerHTML = '<p class="text-xs text-center py-6 dark:text-clean-muted text-light-muted">Türkçe veya orijinal yapım adını yazın.</p>';
                return;
            }
            container.innerHTML = '<div class="text-center py-6"><i class="fa-solid fa-spinner fa-spin text-blue-500"></i><p class="text-xs mt-2">Katalogda aranıyor…</p></div>';
            if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
            searchDebounceTimer = setTimeout(async () => {
                const normalize = value => String(value || '').trim().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/[ıİ]/g, 'i').toLowerCase();
                const terms = [...new Set([q, normalize(q)].filter(Boolean))];
                let results = [];
                let apiError = '';
                // TMDb Türkçe katalog araması (test aşaması; anahtar bu dosyada görünür durumdadır).
                const TMDB_API_KEY = 'feec99b21abf1323730ff9fdc6e4e912';
                for (const mediaType of ['movie', 'tv']) {
                    try {
                        const url = 'https://api.themoviedb.org/3/search/' + mediaType
                            + '?api_key=' + encodeURIComponent(TMDB_API_KEY)
                            + '&query=' + encodeURIComponent(q)
                            + '&language=tr-TR&include_adult=false&page=1';
                        const response = await fetch(url);
                        const data = await response.json();
                        if (!response.ok) {
                            apiError = data.status_message || 'TMDb API hatası';
                            continue;
                        }
                        const entries = Array.isArray(data.results) ? data.results.slice(0, 8) : [];
                        results.push(...entries.map(item => {
                            const title = item.title || item.name || q;
                            const date = item.release_date || item.first_air_date || '';
                            return {
                                id: 'tmdb-' + mediaType + '-' + item.id,
                                source: 'tmdb',
                                tmdbId: item.id,
                                title,
                                type: mediaType === 'tv' ? 'tv' : 'movie',
                                year: parseInt(date.slice(0, 4), 10) || '',
                                director: 'Bilinmiyor',
                                country: 'Bilinmiyor',
                                runtime: 'Bilinmiyor',
                                imdb: Number.isFinite(Number(item.vote_average)) && Number(item.vote_average) > 0 ? Number(item.vote_average).toFixed(1) : '—',
                                status: 'watched',
                                favorite: false,
                                genres: [],
                                trailerUrl: '',
                                poster: item.poster_path ? 'https://image.tmdb.org/t/p/w500' + item.poster_path : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80',
                                overview: item.overview || title + ' yapımı.',
                                cast: []
                            };
                        }));
                    } catch (error) {
                        apiError = 'network';
                    }
                }
                // TMDb detaylarını da al: yönetmen, ülke, süre, tür ve ilk 6 oyuncu.
                if (results.length) {
                    const seenTmdb = new Set();
                    results = results.filter(item => {
                        const key = normalize(item.title);
                        if (!key || seenTmdb.has(key)) return false;
                        seenTmdb.add(key);
                        return true;
                    });
                    results = await Promise.all(results.map(async item => {
                        try {
                            const detailUrl = 'https://api.themoviedb.org/3/' + (item.type === 'tv' ? 'tv/' : 'movie/') + item.tmdbId
                                + '?api_key=' + encodeURIComponent(TMDB_API_KEY) + '&language=tr-TR&append_to_response=credits';
                            const detailResponse = await fetch(detailUrl);
                            const d = await detailResponse.json();
                            if (!detailResponse.ok) return item;
                            const credits = d.credits || {};
                            const cast = (credits.cast || []).slice(0, 6).map(person => ({
                                name: person.name || 'Bilinmiyor',
                                role: person.character || 'Oyuncu',
                                photo: person.profile_path ? 'https://image.tmdb.org/t/p/w185' + person.profile_path : ''
                            }));
                            const crew = credits.crew || [];
                            const director = item.type === 'tv'
                                ? ((d.created_by || []).map(person => person.name).filter(Boolean).join(', ') || crew.filter(person => person.job === 'Director').map(person => person.name).filter(Boolean).slice(0, 2).join(', '))
                                : (crew.filter(person => person.job === 'Director').map(person => person.name).filter(Boolean).join(', '));
                            const countryList = item.type === 'tv' ? (d.origin_country || []) : (d.production_countries || []).map(country => country.name);
                            const genreList = (d.genres || []).map(genre => genre.name).filter(Boolean);
                            const runtimeValue = item.type === 'tv'
                                ? ((d.episode_run_time || []).find(value => Number(value) > 0) || 0)
                                : Number(d.runtime || 0);
                            return {
                                ...item,
                                title: d.title || d.name || item.title,
                                year: parseInt(String(d.release_date || d.first_air_date || '').slice(0, 4), 10) || item.year,
                                director: director || 'Bilinmiyor',
                                country: countryList.length ? countryList.join(' / ') : 'Bilinmiyor',
                                runtime: runtimeValue ? runtimeValue + ' dk' + (item.type === 'tv' ? ' / bölüm' : '') : 'Bilinmiyor',
                                imdb: Number.isFinite(Number(d.vote_average)) && Number(d.vote_average) > 0 ? Number(d.vote_average).toFixed(1) : item.imdb,
                                genres: genreList,
                                overview: d.overview || item.overview,
                                poster: d.poster_path ? 'https://image.tmdb.org/t/p/w500' + d.poster_path : item.poster,
                                cast
                            };
                        } catch (detailError) {
                            return item;
                        }
                    }));
                    fetchedOnlineResults = results;
                    renderSearchResults(container, results, q);
                    return;
                }
                for (const term of terms) {
                    try {
                        const response = await fetch('https://www.omdbapi.com/?apikey=trilogy&s=' + encodeURIComponent(term));
                        const data = await response.json();
                        if (data.Response === 'True' && Array.isArray(data.Search)) {
                            results = await Promise.all(data.Search.slice(0, 8).map(async item => {
                                try {
                                    const detailResponse = await fetch('https://www.omdbapi.com/?apikey=trilogy&i=' + encodeURIComponent(item.imdbID));
                                    const d = await detailResponse.json();
                                    if (d.Response !== 'True') throw new Error('detail');
                                    return { id: item.imdbID, title: d.Title || item.Title, type: item.Type === 'series' ? 'tv' : 'movie', year: parseInt(String(d.Year || item.Year).slice(0, 4), 10) || '', director: d.Director && d.Director !== 'N/A' ? d.Director : 'Bilinmiyor', country: d.Country && d.Country !== 'N/A' ? d.Country : 'Bilinmiyor', runtime: d.Runtime && d.Runtime !== 'N/A' ? d.Runtime : 'Bilinmiyor', imdb: d.imdbRating && d.imdbRating !== 'N/A' ? d.imdbRating : '—', status: 'watched', favorite: false, genres: d.Genre && d.Genre !== 'N/A' ? d.Genre.split(', ') : [], trailerUrl: '', poster: d.Poster && d.Poster !== 'N/A' ? d.Poster : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80', overview: d.Plot && d.Plot !== 'N/A' ? d.Plot : (d.Title || item.Title) + ' yapımı.', cast: d.Actors && d.Actors !== 'N/A' ? d.Actors.split(', ').map(name => ({ name, role: 'Oyuncu' })) : [] };
                                } catch (error) {
                                    return { id: item.imdbID, title: item.Title, type: item.Type === 'series' ? 'tv' : 'movie', year: parseInt(String(item.Year || '').slice(0, 4), 10) || '', director: 'Bilinmiyor', country: 'Bilinmiyor', runtime: 'Bilinmiyor', imdb: '—', status: 'watched', favorite: false, genres: [], trailerUrl: '', poster: item.Poster && item.Poster !== 'N/A' ? item.Poster : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80', overview: item.Title + ' yapımı.', cast: [] };
                                }
                            }));
                            break;
                        }
                        apiError = data.Error || '';
                    } catch (error) { apiError = 'network'; }
                }
                if (!results.length) {
                    try {
                        const response = await fetch('https://api.tvmaze.com/search/shows?q=' + encodeURIComponent(q));
                        if (response.ok) {
                            const data = await response.json();
                            results = (Array.isArray(data) ? data.slice(0, 8) : []).map(entry => {
                                const show = entry.show || {};
                                const summary = String(show.summary || '').replace(/<[^>]*>/g, ' ').replace(/\\s+/g, ' ').trim();
                                return { id: 'tvmaze-' + show.id, title: show.name || q, type: 'tv', year: parseInt(String(show.premiered || '').slice(0, 4), 10) || '', director: 'Bilinmiyor', country: show.network && show.network.country ? show.network.country.name : 'Bilinmiyor', runtime: show.averageRuntime ? show.averageRuntime + ' dk' : 'Dizi', imdb: show.rating && show.rating.average ? show.rating.average.toFixed(1) : '—', status: 'watched', favorite: false, genres: Array.isArray(show.genres) ? show.genres : [], trailerUrl: '', poster: show.image && (show.image.original || show.image.medium) ? (show.image.original || show.image.medium) : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80', overview: summary || (show.name || q) + ' dizisi.', cast: [] };
                            });
                        }
                    } catch (error) {}
                }
                const seen = new Set();
                results = results.filter(item => {
                    const key = normalize(item.title);
                    if (!key || seen.has(key)) return false;
                    seen.add(key);
                    return true;
                });
                if (results.length) {
                    fetchedOnlineResults = results;
                    renderSearchResults(container, results, q);
                    return;
                }
                const normalized = normalize(q);
                const localMatches = onlineCatalog.filter(item => normalize(item.title).includes(normalized));
                if (localMatches.length) {
                    fetchedOnlineResults = localMatches;
                    renderSearchResults(container, localMatches, q);
                    return;
                }
                const safeTitle = q.replace(/[&<>]/g, '');
                const message = apiError === 'network' ? 'Katalog servisine bağlanılamadı. İnternet bağlantısını kontrol edin.' : (/key|limit|valid|disabled/i.test(apiError) ? 'OMDb servisi anahtar veya kullanım limiti hatası verdi.' : 'Sonuç bulunamadı. Orijinal adını da deneyebilir veya özel kayıt ekleyebilirsiniz.');
                container.innerHTML = '<div class="text-center py-6 space-y-2"><p class="text-xs dark:text-clean-muted text-light-muted">' + message + '</p><button onclick="saveManualMovie(decodeURIComponent(\'' + encodeURIComponent(safeTitle) + '\'))" class="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg font-semibold">Bu isimle özel ekle</button></div>';
            }, 450);
        }

        function renderSearchResults(container, list, query) {
            if (!list || list.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-6 space-y-2">
                        <p class="text-xs dark:text-clean-muted text-light-muted">Yapım bulunamadı.</p>
                        <button onclick="saveManualMovie('${query}')" class="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg font-semibold">
                            Özel Olarak Ekle
                        </button>
                    </div>
                `;
                return;
            }

            container.innerHTML = list.map(item => `
                <div class="flex items-center justify-between p-2.5 rounded-xl dark:bg-clean-card bg-white border dark:border-clean-border border-light-border hover:border-blue-500 transition-all">
                    <div class="flex items-center gap-3 overflow-hidden">
                        <img src="${item.poster}" class="w-10 h-14 object-cover rounded-lg shrink-0" onerror="this.src='https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=200&q=80'">
                        <div class="overflow-hidden">
                            <h4 class="font-bold text-xs dark:text-white text-slate-900 truncate">${item.title} <span class="text-[10px] text-clean-muted font-normal">(${item.year})</span></h4>
                            <p class="text-[10px] dark:text-clean-muted text-light-muted truncate">Tür: ${item.type === 'tv' ? 'Dizi' : 'Film'}</p>
                            <span class="text-[9px] font-bold text-amber-500 flex items-center gap-1 mt-0.5"><i class="fa-solid fa-star text-[8px]"></i> ${item.imdb} ${item.source === 'tmdb' ? 'TMDb' : 'IMDb'}</span>
                        </div>
                    </div>
                    <button onclick="addCatalogItemToArchive('${item.id}')" class="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1.5 rounded-lg font-semibold shrink-0 ml-2 shadow-sm">
                        Arşive Ekle
                    </button>
                </div>
            `).join('');
        }

        function addCatalogItemToArchive(catalogId) {
            const item = fetchedOnlineResults.find(x => x.id === catalogId) || onlineCatalog.find(x => x.id === catalogId);
            if (!item) return;

            if (movies.some(m => m.title.toLowerCase() === item.title.toLowerCase())) {
                showToast('Bu yapım zaten arşivinizde bulunuyor!');
                return;
            }

            movies.unshift({
                ...item,
                id: Date.now().toString()
            });

            saveToLocalStorage();
            closeModal('add-modal');
            renderDashboard();
            renderLibrary();
            showToast(`"${item.title}" arşivinize eklendi!`);
        }

        function saveManualMovie(presetTitle = '') {
            const title = presetTitle || prompt('Yapım Adını Giriniz:');
            if (!title) return;

            movies.unshift({
                id: Date.now().toString(),
                title: title,
                type: 'movie',
                year: 2026,
                director: 'Bilinmiyor',
                country: 'Türkiye',
                runtime: '120 dk',
                imdb: 7.5,
                status: 'watched',
                favorite: false,
                genres: ['Dram'],
                trailerUrl: '',
                poster: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80',
                overview: 'Kullanıcı tarafından manuel olarak eklendi.',
                cast: []
            });

            saveToLocalStorage();
            closeModal('add-modal');
            renderDashboard();
            renderLibrary();
            showToast(`"${title}" özel olarak eklendi!`);
        }

        function openAddMovieModal() {
            document.getElementById('add-modal').classList.remove('hidden');
            document.getElementById('add-search-input').value = '';
            handleCatalogSearch('');
        }

        function closeModal(modalId) {
            document.getElementById(modalId).classList.add('hidden');
            if (modalId === 'detail-modal') {
                document.getElementById('detail-modal-content').innerHTML = '';
            }
        }

        function renderCharts() {
            const isDark = document.documentElement.classList.contains('dark');
            const textColor = isDark ? '#F8FAFC' : '#0F172A';

            // Kütüphaneden dinamik tür dağılımı çekme
            const genreCounts = {};
            movies.forEach(m => {
                if (m.genres && Array.isArray(m.genres)) {
                    m.genres.forEach(g => {
                        genreCounts[g] = (genreCounts[g] || 0) + 1;
                    });
                }
            });

            const labels = Object.keys(genreCounts).length > 0 ? Object.keys(genreCounts) : ['Bilim Kurgu', 'Dram', 'Aksiyon', 'Suç'];
            const dataValues = Object.keys(genreCounts).length > 0 ? Object.values(genreCounts) : [3, 2, 2, 1];

            const ctx1 = document.getElementById('genreDoughnutChart')?.getContext('2d');
            if (ctx1) {
                if (genreChartInstance) genreChartInstance.destroy();
                genreChartInstance = new Chart(ctx1, {
                    type: 'doughnut',
                    data: {
                        labels: labels,
                        datasets: [{
                            data: dataValues,
                            backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#F43F5E', '#8B5CF6', '#EC4899', '#6366F1'],
                            borderWidth: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: { labels: { color: textColor, font: { family: 'Plus Jakarta Sans', size: 11 } } }
                        }
                    }
                });
            }

            const ctx2 = document.getElementById('statusBarChart')?.getContext('2d');
            if (ctx2) {
                if (statusChartInstance) statusChartInstance.destroy();
                statusChartInstance = new Chart(ctx2, {
                    type: 'bar',
                    data: {
                        labels: ['İzlenenler', 'İzlenecekler', 'Favoriler'],
                        datasets: [{
                            data: [
                                movies.filter(m => m.status === 'watched').length,
                                movies.filter(m => m.status === 'watch_later').length,
                                movies.filter(m => m.favorite).length
                            ],
                            backgroundColor: ['#10B981', '#F59E0B', '#F43F5E'],
                            borderRadius: 8
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: { legend: { display: false } },
                        scales: {
                            x: { ticks: { color: textColor } },
                            y: { ticks: { color: textColor } }
                        }
                    }
                });
            }
        }

        function showToast(message) {
            const container = document.getElementById('toast-container');
            if (!container) return;

            const toast = document.createElement('div');
            toast.className = 'bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-slate-700 pointer-events-auto transform translate-y-2 opacity-0 transition-all duration-300';
            toast.innerHTML = `<i class="fa-solid fa-circle-check text-blue-400"></i> ${message}`;

            container.appendChild(toast);

            setTimeout(() => {
                toast.classList.remove('translate-y-2', 'opacity-0');
            }, 10);

            setTimeout(() => {
                toast.classList.add('opacity-0', 'translate-y-2');
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }

        // Başlangıç Yüklemeleri
        window.addEventListener('DOMContentLoaded', () => {
            initTheme();
            loadFromLocalStorage();
            renderDashboard();
        });
