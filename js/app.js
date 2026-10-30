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

        // İzleme geçmişi ve favorilerden hareketle TMDB önerilerini kişiselleştirir.
        let personalRecommendationRequest = 0;
        async function renderPersonalRecommendations() {
            const container = document.getElementById('perde-personal-recommendations');
            if (!container) return;
            const requestId = ++personalRecommendationRequest;
            const seeds = movies.filter(item => item.status === 'watched' || item.favorite)
                .sort((a,b) => Number(Boolean(b.favorite))-Number(Boolean(a.favorite)) || (Number(b.imdb)||0)-(Number(a.imdb)||0)).slice(0,3);
            if (!seeds.length) {
                container.innerHTML = '<p class="perde-recommendation-empty"><i class="fa-solid fa-lightbulb"></i> Sana özel öneriler oluşturmak için arşivinden birkaç yapımı favorile veya izledim olarak işaretle.</p>';
                return;
            }
            container.innerHTML = '<p class="perde-recommendation-loading"><i class="fa-solid fa-spinner fa-spin"></i> İzleme zevkine göre öneriler aranıyor…</p>';
            const apiKey = 'feec99b21abf1323730ff9fdc6e4e912';
            const base = 'https://api.themoviedb.org/3/';
            const requests = seeds.map(async seed => {
                const mediaType = seed.type === 'tv' ? 'tv' : 'movie';
                let tmdbId = seed.tmdbId || (String(seed.id || '').match(/^tmdb-(?:movie|tv)-(.+)$/) || [])[1] || '';
                if (!tmdbId) {
                    const search = await fetch(base + 'search/' + mediaType + '?api_key=' + encodeURIComponent(apiKey) + '&language=tr-TR&query=' + encodeURIComponent(seed.title || ''));
                    if (!search.ok) return [];
                    const searchData = await search.json();
                    const year = String(seed.year || '');
                    const match = (searchData.results || []).find(item => String(item.release_date || item.first_air_date || '').startsWith(year)) || (searchData.results || [])[0];
                    tmdbId = match && match.id;
                }
                if (!tmdbId) return [];
                const response = await fetch(base + mediaType + '/' + tmdbId + '/recommendations?api_key=' + encodeURIComponent(apiKey) + '&language=tr-TR&page=1');
                if (!response.ok) return [];
                const data = await response.json();
                return (data.results || []).map(item => ({ item, mediaType }));
            });
            try {
                const groups = await Promise.all(requests);
                if (requestId !== personalRecommendationRequest || !document.getElementById('perde-personal-recommendations')) return;
                const archiveHas = item => movies.some(saved =>
                    (saved.tmdbId && String(saved.tmdbId) === String(item.tmdbId)) ||
                    ((saved.title || '').trim().toLocaleLowerCase('tr') === (item.title || '').trim().toLocaleLowerCase('tr') && String(saved.year || '') === String(item.year || ''))
                );
                const seen = new Set();
                const recommendations = groups.flat().map(({item,mediaType}) => {
                    const title = item.title || item.name || '';
                    const date = item.release_date || item.first_air_date || '';
                    return {
                        id:'tmdb-' + mediaType + '-' + item.id, tmdbId:item.id, source:'recommendation',
                        title, type:mediaType, year:date.slice(0,4),
                        imdb:Number(item.vote_average)>0?Number(item.vote_average).toFixed(1):'—',
                        status:'watch_later', favorite:false, genres:[],
                        poster:item.poster_path?'https://image.tmdb.org/t/p/w500'+item.poster_path:'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80',
                        backdrop:item.backdrop_path?'https://image.tmdb.org/t/p/w1280'+item.backdrop_path:'',
                        overview:item.overview||'Bu yapım için henüz konu özeti bulunmuyor.',
                        director:'Bilinmiyor', country:'Bilinmiyor', runtime:'Bilinmiyor', cast:[], trailerUrl:''
                    };
                }).filter(item => item.title && !archiveHas(item) && !seen.has(String(item.tmdbId)) && seen.add(String(item.tmdbId)))
                  .sort((a,b) => (Number(b.imdb)||0)-(Number(a.imdb)||0)).slice(0,6);
                recommendations.forEach(item => {
                    if (!fetchedOnlineResults.some(existing => String(existing.tmdbId || '') === String(item.tmdbId))) fetchedOnlineResults.push(item);
                });
                if (!recommendations.length) {
                    container.innerHTML = '<p class="perde-recommendation-empty">Şu an yeni öneri bulunamadı. İzleme geçmişin değiştikçe önerilerin de yenilenecek.</p>';
                    return;
                }
                container.innerHTML = recommendations.map(item => {
                    const id = escapeProviderText(item.id), title = escapeProviderText(item.title), poster = escapeProviderText(item.poster);
                    return '<article class="perde-personal-card"><button type="button" class="perde-personal-poster" onclick="openDetailModal(\'' + id + '\')"><img src="' + poster + '" alt="' + title + ' afişi" loading="lazy"><span><i class="fa-solid fa-star"></i> ' + escapeProviderText(item.imdb) + '</span></button><div class="perde-personal-card-copy"><button type="button" onclick="openDetailModal(\'' + id + '\')">' + title + '</button><small>' + escapeProviderText(item.year || 'Yıl bilinmiyor') + ' · ' + (item.type === 'tv' ? 'Dizi' : 'Film') + '</small><button type="button" class="perde-personal-add" onclick="addSimilarProduction(\'' + id + '\', this)"><i class="fa-solid fa-plus"></i> İzleme listeme ekle</button></div></article>';
                }).join('');
            } catch (error) {
                if (requestId === personalRecommendationRequest) container.innerHTML = '<p class="perde-recommendation-empty">Öneriler şu anda yüklenemedi. Biraz sonra tekrar deneyebilirsin.</p>';
                console.warn('Kişisel öneriler alınamadı:', error);
            }
        }

        function renderDashboard() {
            renderFeaturedHero();
            renderTodaysPick();
            renderPersonalRecommendations();
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


        // Her anasayfa yüklemesinde İzleme Listem'den rastgele bir yapım seç.
        function renderTodaysPick() {
            const container = document.getElementById('ml-todays-pick');
            if (!container) return;
            const safe = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
            const watchlist = movies.filter(item => item.status === 'watch_later');
            if (!watchlist.length) {
                container.innerHTML = '<div class="ml-todays-empty"><span class="ml-todays-kicker"><i class="fa-solid fa-wand-magic-sparkles"></i> BUGÜN NE İZLESEM?</span><div class="ml-todays-empty-icon"><i class="fa-solid fa-bookmark"></i></div><h2>Seçim yapmak kolaylaşsın.</h2><p>İzleme listene yapım eklediğinde burada her yenilemede farklı bir öneri göreceksin.</p><button type="button" onclick="filterByMenu(\'watch_later\')">İzleme Listeme Git <i class="fa-solid fa-arrow-right"></i></button></div>';
                return;
            }
            const item = watchlist[Math.floor(Math.random() * watchlist.length)];
            const id = safe(item.id);
            const title = safe(item.title || 'İsimsiz yapım');
            const poster = safe(item.poster || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=700&q=85');
            const overview = safe(item.overview || 'Bu yapım için henüz kısa bir konu özeti eklenmemiş.');
            const genres = Array.isArray(item.genres) ? item.genres.filter(Boolean).join(' · ') : (item.genres || '');
            const type = item.type === 'tv' ? 'Dizi' : item.type === 'doc' ? 'Belgesel' : 'Film';
            const imdb = item.imdb && item.imdb !== '—' ? safe(item.imdb) : '—';
            const year = item.year ? safe(item.year) : 'Yıl bilgisi yok';
            const runtime = item.runtime && item.runtime !== 'Bilinmiyor' ? safe(item.runtime) : '';
            const country = item.country && item.country !== 'Bilinmiyor' ? safe(item.country) : '';
            const credits = [year, runtime, country].filter(Boolean).join(' · ');
            container.innerHTML = '<div class="ml-todays-card">' +
                '<div class="ml-todays-topline"><span class="ml-todays-kicker"><i class="fa-solid fa-wand-magic-sparkles"></i> BUGÜN NE İZLESEM?</span><span class="ml-todays-random"><i class="fa-solid fa-shuffle"></i> Rastgele seçim</span></div>' +
                '<button type="button" class="ml-todays-main" onclick="openDetailModal(\'' + id + '\')" aria-label="' + title + ' detaylarını aç">' +
                '<div class="ml-todays-poster"><img src="' + poster + '" alt="' + title + ' afişi" loading="lazy" onerror="this.onerror=null;this.src=\'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=700&q=85\'"></div>' +
                '<div class="ml-todays-content"><h2>' + title + '</h2><div class="ml-todays-meta"><span class="ml-todays-type">' + type + '</span><span><i class="fa-solid fa-star"></i> ' + imdb + ' IMDb</span></div>' +
                (genres ? '<div class="ml-todays-genres">' + safe(genres) + '</div>' : '') +
                '<p class="ml-todays-overview">' + overview + '</p><div class="ml-todays-credits">' + (credits ? '<span>' + credits + '</span>' : '') + '</div></div></button>' +
                '<div class="ml-todays-footer"><span><i class="fa-solid fa-bookmark"></i> İzleme Listemden</span><span>Detayları gör <i class="fa-solid fa-arrow-right"></i></span></div></div>';
        }

        function renderFeaturedHero() {
            const container = document.getElementById('ml-featured-hero');
            if (!container) return;
            const safe = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
            // Arşivde en son eklenen kayıtlar movies dizisinin başında tutulur.
            // Manşet yalnızca kullanıcının kendi arşivindeki son eklemeleri gösterir.
            const slides = movies.slice(0, 5);
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
                    '<div class="ml-featured-copy"><span class="ml-featured-eyebrow"><i class="fa-solid fa-clapperboard"></i> SON EKLENENLER <span>·</span> ' + type + '</span>' +
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
            // Tür filtresi diğer aktif filtrelerle birlikte çalışır.
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
            const query = (document.getElementById('search-input')?.value || '').trim().toLocaleLowerCase('tr');
            const typeFilter = document.getElementById('filter-type')?.value || 'all';
            const statusFilter = document.getElementById('filter-status')?.value || 'all';
            const minRating = Number(document.getElementById('filter-min-rating')?.value || 0);
            const sortFilter = document.getElementById('filter-sort')?.value || 'newest';

            let filtered = movies.filter(m => {
                const title = String(m.title || '').toLocaleLowerCase('tr');
                const director = String(m.director || '').toLocaleLowerCase('tr');
                const cast = Array.isArray(m.cast) ? m.cast : [];
                const rating = Number.parseFloat(m.imdb);
                const matchesQuery = !query || title.includes(query) || director.includes(query) ||
                    cast.some(c => String(c?.name || '').toLocaleLowerCase('tr').includes(query));
                const matchesType = typeFilter === 'all' || m.type === typeFilter;
                const matchesGenre = !activeGenreFilter || (Array.isArray(m.genres) && m.genres.some(g => String(g).trim() === activeGenreFilter));
                const matchesStatus = statusFilter === 'all' ||
                    (statusFilter === 'favorite' ? Boolean(m.favorite) : m.status === statusFilter);
                const matchesRating = minRating === 0 || (Number.isFinite(rating) && rating >= minRating);
                return matchesQuery && matchesType && matchesStatus && matchesGenre && matchesRating;
            });

            const ratingValue = item => {
                const value = Number.parseFloat(item.imdb);
                return Number.isFinite(value) ? value : null;
            };
            const yearValue = item => Number(item.year) || 0;
            if (sortFilter === 'newest') filtered.sort((a, b) => movies.indexOf(a) - movies.indexOf(b));
            else if (sortFilter === 'oldest') filtered.sort((a, b) => movies.indexOf(b) - movies.indexOf(a));
            else if (sortFilter === 'imdb_desc' || sortFilter === 'imdb_asc') {
                filtered.sort((a, b) => {
                    const av = ratingValue(a), bv = ratingValue(b);
                    if (av === null) return bv === null ? 0 : 1;
                    if (bv === null) return -1;
                    return sortFilter === 'imdb_desc' ? bv - av : av - bv;
                });
            } else if (sortFilter === 'year_desc') filtered.sort((a, b) => yearValue(b) - yearValue(a));
            else if (sortFilter === 'year_asc') filtered.sort((a, b) => yearValue(a) - yearValue(b));
            else if (sortFilter === 'title_asc') filtered.sort((a, b) => String(a.title || '').localeCompare(String(b.title || ''), 'tr'));
            else if (sortFilter === 'title_desc') filtered.sort((a, b) => String(b.title || '').localeCompare(String(a.title || ''), 'tr'));

            renderRow('library-grid', filtered);
            const count = document.getElementById('library-result-count');
            if (count) count.textContent = filtered.length + ' / ' + movies.length + ' yapım gösteriliyor';
        }

        function resetLibraryFilters() {
            ['search-input', 'filter-type', 'filter-status', 'filter-min-rating', 'filter-sort'].forEach(id => {
                const element = document.getElementById(id);
                if (element) element.value = id === 'filter-sort' ? 'newest' : (id === 'search-input' ? '' : id === 'filter-min-rating' ? '0' : 'all');
            });
            activeGenreFilter = '';
            renderGenreMenu();
            applyFilters();
        }

        function renderTrailerLibrary() {
            const trailerItems = movies.filter(movie => getYouTubeVideoId(movie.trailerUrl || ''));
            const count = document.getElementById('trailer-count');
            if (count) count.textContent = trailerItems.length + ' yapım';
            renderRow('trailers-grid', trailerItems);
        }

        // Oyuncu Biyografisi Açma Modal Fonksiyonu
        async const personProfileCache = {};

        async function openActorBio(actorName) {
            if (!actorName) return;
            const content = document.getElementById('actor-modal-content');
            const modal = document.getElementById('actor-modal');
            if (!content || !modal) return;
            const safeName = escapeProviderText(actorName);
            modal.classList.remove('hidden');
            content.innerHTML = '<div class="perde-person-loading"><i class="fa-solid fa-spinner fa-spin"></i><span>' + safeName + ' profili yükleniyor…</span></div>';

            const apiKey = 'feec99b21abf1323730ff9fdc6e4e912';
            const apiBase = 'https://api.themoviedb.org/3/';
            try {
                let profile = personProfileCache[String(actorName).toLowerCase()];
                if (!profile) {
                    const searchResponse = await fetch(apiBase + 'search/person?api_key=' + encodeURIComponent(apiKey) + '&language=tr-TR&query=' + encodeURIComponent(actorName));
                    if (!searchResponse.ok) throw new Error('Sanatçı araması başarısız');
                    const searchData = await searchResponse.json();
                    const people = searchData.results || [];
                    const normalizedName = String(actorName).trim().toLocaleLowerCase('tr-TR');
                    const person = people.find(item => String(item.name || '').trim().toLocaleLowerCase('tr-TR') === normalizedName) || people[0];
                    if (!person) throw new Error('Sanatçı bulunamadı');
                    const responses = await Promise.all([
                        fetch(apiBase + 'person/' + person.id + '?api_key=' + encodeURIComponent(apiKey) + '&language=tr-TR'),
                        fetch(apiBase + 'person/' + person.id + '/combined_credits?api_key=' + encodeURIComponent(apiKey) + '&language=tr-TR')
                    ]);
                    const details = responses[0].ok ? await responses[0].json() : person;
                    const credits = responses[1].ok ? await responses[1].json() : {};
                    profile = { person: details, credits: credits };
                    personProfileCache[String(actorName).toLowerCase()] = profile;
                }

                const person = profile.person || {};
                const isDirector = String(person.known_for_department || '').toLowerCase() === 'directing';
                const castCredits = (profile.credits.cast || []).map(item => Object.assign({}, item, { profileRole: item.character || 'Oyuncu' }));
                const crewCredits = (profile.credits.crew || []).filter(item => ['director','creator','writer'].includes(String(item.job || '').toLowerCase())).map(item => Object.assign({}, item, { profileRole: item.job || 'Ekip' }));
                const credits = (isDirector ? crewCredits.concat(castCredits) : castCredits.concat(crewCredits))
                    .filter(item => item && item.id && (item.title || item.name))
                    .sort((a,b) => (Number(b.vote_count)||0) - (Number(a.vote_count)||0))
                    .filter((item,index,array) => array.findIndex(other => other.id === item.id && (other.media_type || 'movie') === (item.media_type || 'movie')) === index)
                    .slice(0,10);

                credits.forEach(item => {
                    const mediaType = item.media_type === 'tv' ? 'tv' : 'movie';
                    const id = 'tmdb-' + mediaType + '-' + item.id;
                    if (!fetchedOnlineResults.some(existing => existing.id === id)) {
                        fetchedOnlineResults.push({
                            id: id, tmdbId: item.id, type: mediaType,
                            title: item.title || item.name || 'İsimsiz yapım',
                            year: String(item.release_date || item.first_air_date || '').slice(0,4) || 'Bilinmiyor',
                            poster: item.poster_path ? 'https://image.tmdb.org/t/p/w500' + item.poster_path : getAvatarUrl(item.title || item.name),
                            backdrop: item.backdrop_path ? 'https://image.tmdb.org/t/p/w1280' + item.backdrop_path : '',
                            imdb: item.vote_average ? Number(item.vote_average).toFixed(1) : '—',
                            overview: item.overview || '', genres: [], cast: [],
                            director: 'Bilinmiyor', country: 'Bilinmiyor', runtime: 'Bilinmiyor'
                        });
                    }
                });

                const imageUrl = person.profile_path ? 'https://image.tmdb.org/t/p/w342' + person.profile_path : getAvatarUrl(actorName);
                const biography = person.biography || (actorDatabase[actorName] && actorDatabase[actorName].bio) || 'Bu sanatçı için henüz bir biyografi eklenmemiş.';
                const department = person.known_for_department === 'Acting' ? 'Oyuncu' : person.known_for_department === 'Directing' ? 'Yönetmen' : (person.known_for_department || 'Sanatçı');
                const facts = [person.birthday ? 'Doğum: ' + person.birthday : '', person.place_of_birth || '', person.deathday ? 'Vefat: ' + person.deathday : ''].filter(Boolean);
                const creditMarkup = credits.length ? credits.map(item => {
                    const title = escapeProviderText(item.title || item.name || 'İsimsiz yapım');
                    const year = escapeProviderText(String(item.release_date || item.first_air_date || '').slice(0,4) || '—');
                    const role = escapeProviderText(item.profileRole || 'Ekip');
                    const score = item.vote_average ? Number(item.vote_average).toFixed(1) : '—';
                    const mediaId = 'tmdb-' + (item.media_type === 'tv' ? 'tv' : 'movie') + '-' + item.id;
                    return '<button class="perde-person-credit" onclick="openDetailModal(\\'' + mediaId + '\\')"><span class="perde-person-credit-title">' + title + '</span><span class="perde-person-credit-meta">' + year + ' · ' + role + '</span><span class="perde-person-credit-score"><i class="fa-solid fa-star"></i> ' + score + '</span></button>';
                }).join('') : '<p class="perde-person-empty">Bu sanatçı için öne çıkan yapım kaydı bulunamadı.</p>';

                content.innerHTML = '<div class="perde-person-profile-head">' +
                    '<img src="' + escapeProviderText(imageUrl) + '" alt="' + safeName + '" class="perde-person-profile-image" onerror="this.src=\\'' + getAvatarUrl(actorName) + '\\'">' +
                    '<div class="perde-person-profile-intro"><span class="perde-person-department">' + escapeProviderText(department) + '</span><h3>' + safeName + '</h3>' +
                    (facts.length ? '<p class="perde-person-facts">' + facts.map(escapeProviderText).join(' · ') + '</p>' : '') +
                    '<p class="perde-person-biography">' + escapeProviderText(biography) + '</p></div></div>' +
                    '<section class="perde-person-filmography"><div class="perde-person-section-heading"><h4><i class="fa-solid fa-clapperboard"></i> Öne çıkan yapımları</h4><span>' + credits.length + ' yapım</span></div>' +
                    '<div class="perde-person-credit-grid">' + creditMarkup + '</div></section>' +
                    '<p class="perde-person-source">Sanatçı ve filmografi bilgileri TMDB kaynaklıdır.</p>';
            } catch (error) {
                console.warn('Sanatçı profili yüklenemedi:', error);
                const local = actorDatabase[actorName];
                const localCredits = movies.filter(movie => movie.cast && movie.cast.some(person => person.name && person.name.toLowerCase() === actorName.toLowerCase()));
                content.innerHTML = '<div class="perde-person-profile-head"><img src="' + getAvatarUrl(actorName) + '" alt="' + safeName + '" class="perde-person-profile-image"><div class="perde-person-profile-intro"><span class="perde-person-department">Sanatçı Profili</span><h3>' + safeName + '</h3><p class="perde-person-biography">' + escapeProviderText((local && local.bio) || 'Çevrimiçi sanatçı bilgisine şu anda ulaşılamıyor.') + '</p></div></div>' +
                    '<section class="perde-person-filmography"><div class="perde-person-section-heading"><h4>Arşivindeki yapımlar</h4></div><div class="perde-person-credit-grid">' +
                    (localCredits.map(movie => '<button class="perde-person-credit" onclick="openDetailModal(\\'' + String(movie.id).replace(/'/g, "\\\\'") + '\\')"><span class="perde-person-credit-title">' + escapeProviderText(movie.title) + '</span><span class="perde-person-credit-meta">' + escapeProviderText(movie.year || '') + '</span></button>').join('') || '<p class="perde-person-empty">Arşivinde kayıtlı başka yapım bulunamadı.</p>') +
                    '</div></section>';
            }
        }

        function renderPersonLinks(names) {
            return String(names || 'Bilinmiyor').split(',').map(name => name.trim()).filter(Boolean).map(name => {
                const safe = escapeProviderText(name);
                const jsName = name.replace(/\\\\/g, "\\\\\\\\").replace(/'/g, "\\\\'");
                return '<button type="button" class="perde-person-inline-link" onclick="openActorBio(\\'' + jsName + '\\')">' + safe + '</button>';
            }).join(', ') || 'Bilinmiyor';
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
                'united states of america':['us','Amerika'],'united states':['us','Amerika'],'usa':['us','Amerika'],'u.s.a.':['us','Amerika'],'abd':['us','Amerika'],'amerika birleşik devletleri':['us','Amerika'],'amerika':['us','Amerika'],'us':['us','Amerika'],
                'united kingdom':['gb','Birleşik Krallık'],'uk':['gb','Birleşik Krallık'],'great britain':['gb','Birleşik Krallık'],'birleşik krallık':['gb','Birleşik Krallık'],'england':['gb','İngiltere'],'ingiltere':['gb','İngiltere'],
                'turkey':['tr','Türkiye'],'türkiye':['tr','Türkiye'],'turkiye':['tr','Türkiye'],'south korea':['kr','Güney Kore'],'republic of korea':['kr','Güney Kore'],'korea, republic of':['kr','Güney Kore'],'korea':['kr','Güney Kore'],'north korea':['kp','Kuzey Kore'],'democratic people\'s republic of korea':['kp','Kuzey Kore'],
                'russia':['ru','Rusya'],'russian federation':['ru','Rusya'],'china':['cn','Çin'],'çin':['cn','Çin'],'people\'s republic of china':['cn','Çin'],'people’s republic of china':['cn','Çin'],'prc':['cn','Çin'],'china, people\'s republic of':['cn','Çin'],'çin halk cumhuriyeti':['cn','Çin'],'hong kong':['hk','Hong Kong'],'japan':['jp','Japonya'],'france':['fr','Fransa'],'germany':['de','Almanya'],'italy':['it','İtalya'],'spain':['es','İspanya'],'canada':['ca','Kanada'],'australia':['au','Avustralya'],'india':['in','Hindistan'],'brazil':['br','Brezilya'],'mexico':['mx','Meksika'],'ireland':['ie','İrlanda'],'scotland':['gb-sct','İskoçya'],'wales':['gb-wls','Galler'],'sweden':['se','İsveç'],'norway':['no','Norveç'],'denmark':['dk','Danimarka'],'finland':['fi','Finlandiya'],'netherlands':['nl','Hollanda'],'belgium':['be','Belçika'],'switzerland':['ch','İsviçre'],'austria':['at','Avusturya'],'poland':['pl','Polonya'],'ukraine':['ua','Ukrayna'],'greece':['gr','Yunanistan'],'portugal':['pt','Portekiz'],'new zealand':['nz','Yeni Zelanda'],'south africa':['za','Güney Afrika'],'iran':['ir','İran'],'iraq':['iq','Irak'],'israel':['il','İsrail'],'egypt':['eg','Mısır'],'argentina':['ar','Arjantin'],'chile':['cl','Şili'],'colombia':['co','Kolombiya'],'thailand':['th','Tayland'],'indonesia':['id','Endonezya'],'taiwan':['tw','Tayvan'],'czech republic':['cz','Çekya'],'czechia':['cz','Çekya'],'romania':['ro','Romanya'],'hungary':['hu','Macaristan'],'bulgaria':['bg','Bulgaristan'],'croatia':['hr','Hırvatistan'],'serbia':['rs','Sırbistan'],'iceland':['is','İzlanda'],'malta':['mt','Malta'],'luxembourg':['lu','Lüksemburg'],'uae':['ae','Birleşik Arap Emirlikleri'],'united arab emirates':['ae','Birleşik Arap Emirlikleri']
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
                            <img id="perde-detail-backdrop" class="perde-imdb-backdrop" src="${m.backdrop || m.poster || ''}" alt="" onerror="this.src='${m.poster || ''}'">
                            <div class="perde-imdb-hero-shade"></div>
                            <div class="perde-imdb-hero-top"><span class="perde-imdb-brand">My Library<span>ARŞİV</span></span><span class="perde-imdb-type">${m.type === 'tv' ? 'DİZİ' : m.type === 'doc' ? 'BELGESEL' : 'FİLM'}</span></div>
                            <div class="perde-imdb-feature-art"><img id="perde-detail-hero-poster" src="${m.poster || m.backdrop || ''}" alt="${m.title} afişi" onerror="this.src='${m.backdrop || ''}'"><button onclick="openDetailModal('${m.id}', 'tr_sub')" class="perde-imdb-play" aria-label="${m.title} fragmanını oynat"><i class="fa-solid fa-play"></i><span>FRAGMANI İZLE</span></button></div>
                            <div class="perde-imdb-hero-copy"><div class="perde-imdb-kicker"><span id="perde-detail-year">${m.year || 'Yıl bilinmiyor'}</span> <span>•</span> <span id="perde-detail-runtime">${m.runtime || 'Süre bilgisi yok'}</span></div><h2 id="perde-detail-title">${m.title}</h2><div class="perde-imdb-genres" id="perde-detail-genres">${m.genres && m.genres.length ? m.genres.map(g => `<span>${g}</span>`).join('') : '<span>Sinema</span>'}</div></div>
                        </section>
                        <section class="perde-imdb-content">
                            <aside class="perde-imdb-poster-wrap">
                                <img id="perde-detail-poster" class="perde-imdb-poster" src="${m.poster || ''}" alt="${m.title} afişi" onerror="this.src='https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80'">
                                <section class="perde-film-credits" aria-label="Film künyesi">
                                    <h3><i class="fa-solid fa-ticket"></i> Film Künyesi</h3>
                                    <dl>
                                        <div><dt>${m.type === 'tv' ? 'Yaratıcı' : 'Yönetmen'}</dt><dd id="perde-detail-director">${renderPersonLinks(m.director)}</dd></div>
                                        <div><dt>Yapım yılı</dt><dd>${m.year || 'Bilinmiyor'}</dd></div>
                                        <div><dt>Süre</dt><dd>${m.runtime || 'Bilinmiyor'}</dd></div>
                                        <div class="perde-film-country-row"><dt>Ülke</dt><dd id="perde-detail-country" class="perde-film-country-list">${renderCountryCredits(m.country)}</dd></div>
                                        <div><dt>Tür</dt><dd>${m.genres && m.genres.length ? m.genres.join(', ') : 'Bilinmiyor'}</dd></div>
                                    </dl>
                                </section>
                            </aside>
                            <div class="perde-imdb-main">
                                <div class="perde-imdb-rating-row"><div class="perde-imdb-score"><strong>${m.imdb || '—'}</strong><span>IMDb</span></div><button onclick="toggleFavorite('${m.id}')" class="perde-imdb-fav ${m.favorite ? 'is-favorite' : ''}"><i class="fa-solid fa-heart"></i> ${m.favorite ? 'Favorilerde' : 'Favorilere Ekle'}</button></div>
                                <p class="perde-imdb-overview" id="perde-detail-overview">${m.overview || 'Bu yapım için henüz bir konu özeti eklenmemiş.'}</p><div id="perde-detail-series-meta" class="perde-detail-series-meta" hidden></div>
                                <section class="perde-watch-providers" id="perde-watch-providers" aria-live="polite">
                                    <div class="perde-watch-heading"><div><span>NEREDEN İZLENİR?</span><h3>Yayın Platformları</h3></div><span class="perde-watch-region"><i class="fa-solid fa-location-dot"></i> Türkiye</span></div>
                                    <div class="perde-watch-loading"><i class="fa-solid fa-spinner fa-spin"></i> Platform bilgileri yükleniyor…</div>
                                </section>
                                
                                <div class="perde-imdb-actions"><label class="perde-imdb-watch-label">İZLEME LİSTEM<select onchange="updateMovieStatus('${m.id}', this.value)" class="input-field"><option value="watched" ${m.status === 'watched' ? 'selected' : ''}>İzledim</option><option value="watch_later" ${m.status === 'watch_later' ? 'selected' : ''}>İzleyeceğim</option></select></label><button onclick="openDetailModal('${m.id}', 'tr_sub')" class="perde-imdb-action-btn"><i class="fa-solid fa-closed-captioning"></i> Altyazılı fragman</button><button onclick="openDetailModal('${m.id}', 'tr_dub')" class="perde-imdb-action-btn"><i class="fa-solid fa-microphone"></i> Dublajlı fragman</button><button onclick="deleteMovie('${m.id}')" class="perde-imdb-delete"><i class="fa-solid fa-trash"></i> Arşivden sil</button></div>
                                <div class="perde-imdb-cast"><h3>Oyuncular ve ekip</h3><div class="perde-imdb-cast-grid" id="perde-detail-cast-grid">${(m.cast && m.cast.length > 0) ? m.cast.map((c, idx) => { const imgId = `actor-img-${m.id}-${idx}`; const safeActorName = (c.name || 'Oyuncu').replace(/'/g, "\\'"); return `<button onclick="openActorBio('${safeActorName}')" class="perde-imdb-cast-card"><img id="${imgId}" src="${getAvatarUrl(c.name)}" alt="${c.name || 'Oyuncu'}"><span><b>${c.name || 'Bilinmiyor'}</b><small>${c.role || 'Karakter bilgisi yok'}</small></span></button>`; }).join('') : '<p class="perde-imdb-no-cast">Oyuncu bilgisi bulunmuyor.</p>'}</div></div>
                            </div>
                        </section>
                        <section class="perde-similar" aria-label="Benzer yapımlar">
                            <h3>Benzer Yapımlar</h3>
                            <div id="perde-similar-grid" class="perde-similar-grid"><p class="perde-similar-loading">Benzer yapımlar yükleniyor…</p></div>
                        </section>
                    </div>
                `;

                loadSimilarProductions(m);
                loadWatchProviders(m);
                enrichDetailFromTmdb(m);

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

        // Detay sayfasındaki eksik künye, oyuncu kadrosu ve fragman bilgilerini TMDB'den tamamlar.
        const detailMetadataCache = {};
        async function enrichDetailFromTmdb(movie) {
            const mediaType = movie.type === 'tv' ? 'tv' : 'movie';
            const apiKey = 'feec99b21abf1323730ff9fdc6e4e912';
            const apiBase = 'https://api.themoviedb.org/3/';
            const cacheKey = mediaType + ':' + (movie.tmdbId || movie.id || movie.title);
            const setText = (id, value) => { const node = document.getElementById(id); if (node && value) node.textContent = value; };
            try {
                let tmdbId = movie.tmdbId || (String(movie.id || '').match(/^tmdb-(?:movie|tv)-(.+)$/) || [])[1] || '';
                if (!tmdbId) {
                    const searchUrl = apiBase + 'search/' + mediaType + '?api_key=' + encodeURIComponent(apiKey) + '&language=tr-TR&include_adult=false&query=' + encodeURIComponent(movie.title || '');
                    const searchResponse = await fetch(searchUrl);
                    if (!searchResponse.ok) throw new Error('TMDb araması başarısız');
                    const searchData = await searchResponse.json();
                    const year = String(movie.year || '');
                    const results = searchData.results || [];
                    const match = results.find(item => { const date = String(item.release_date || item.first_air_date || ''); return year && date.startsWith(year); }) || results[0];
                    tmdbId = match && match.id;
                }
                if (!tmdbId) return;
                let payload = detailMetadataCache[mediaType + ':' + tmdbId];
                if (!payload) {
                    const base = apiBase + mediaType + '/' + tmdbId + '?api_key=' + encodeURIComponent(apiKey) + '&language=tr-TR';
                    const requests = await Promise.all([
                        fetch(base),
                        fetch(apiBase + mediaType + '/' + tmdbId + '/credits?api_key=' + encodeURIComponent(apiKey) + '&language=tr-TR'),
                        fetch(apiBase + mediaType + '/' + tmdbId + '/videos?api_key=' + encodeURIComponent(apiKey) + '&language=tr-TR&include_video_language=tr-TR,en-US,null')
                    ]);
                    const responses = await Promise.all(requests.map(async response => response.ok ? response.json() : null));
                    payload = { details: responses[0], credits: responses[1], videos: responses[2] };
                    detailMetadataCache[mediaType + ':' + tmdbId] = payload;
                }
                const details = payload.details || {};
                const credits = payload.credits || {};
                const videos = payload.videos || {};
                const esc = value => escapeProviderText(value);
                const date = details.release_date || details.first_air_date || '';
                if ((!movie.year || String(movie.year).toLowerCase().includes('bilinmiyor')) && date) { movie.year = date.slice(0, 4); setText('perde-detail-year', movie.year); }
                if ((!movie.overview || movie.overview === 'Bu yapım için henüz bir konu özeti eklenmemiş.') && details.overview) { movie.overview = details.overview; setText('perde-detail-overview', details.overview); }
                if ((!movie.genres || !movie.genres.length) && Array.isArray(details.genres)) {
                    movie.genres = details.genres.map(genre => genre.name);
                    const genreNode = document.getElementById('perde-detail-genres');
                    if (genreNode) genreNode.innerHTML = movie.genres.map(genre => '<span>' + esc(genre) + '</span>').join('');
                }
                if ((!movie.poster || movie.poster.includes('unsplash')) && details.poster_path) {
                    movie.poster = 'https://image.tmdb.org/t/p/w500' + details.poster_path;
                    ['perde-detail-poster','perde-detail-hero-poster'].forEach(id => { const image = document.getElementById(id); if (image) image.src = movie.poster; });
                }
                if ((!movie.backdrop || movie.backdrop.includes('unsplash')) && details.backdrop_path) {
                    movie.backdrop = 'https://image.tmdb.org/t/p/w1280' + details.backdrop_path;
                    const image = document.getElementById('perde-detail-backdrop'); if (image) image.src = movie.backdrop;
                }
                if ((!movie.country || movie.country === 'Bilinmiyor') && details.production_countries && details.production_countries.length) {
                    movie.country = details.production_countries.map(country => country.name).join(', ');
                    setText('perde-detail-country', movie.country);
                }
                if (mediaType === 'movie' && (!movie.runtime || ['Bilinmiyor','Süre bilgisi yok'].includes(movie.runtime)) && details.runtime) { movie.runtime = details.runtime + ' dk'; setText('perde-detail-runtime', movie.runtime); }
                let director = '';
                if (mediaType === 'movie') director = (credits.crew || []).filter(person => person.job === 'Director').map(person => person.name).slice(0, 2).join(', ');
                else director = (details.created_by || []).map(person => person.name).slice(0, 3).join(', ');
                if ((!movie.director || movie.director === 'Bilinmiyor') && director) { movie.director = director; const directorNode = document.getElementById('perde-detail-director'); if (directorNode) directorNode.innerHTML = renderPersonLinks(director); }
                if (mediaType === 'tv') {
                    const seasons = Number(details.number_of_seasons) || 0;
                    const episodes = Number(details.number_of_episodes) || 0;
                    const status = details.status === 'Ended' ? 'Tamamlandı' : details.status === 'Returning Series' ? 'Devam ediyor' : details.status === 'Canceled' ? 'İptal edildi' : details.status || '';
                    const episodeRuntime = Array.isArray(details.episode_run_time) && details.episode_run_time.length ? details.episode_run_time[0] + ' dk / bölüm' : '';
                    const meta = document.getElementById('perde-detail-series-meta');
                    if (meta && (seasons || episodes || status || episodeRuntime)) {
                        meta.hidden = false;
                        meta.innerHTML = [seasons ? '<span><b>' + seasons + '</b> sezon</span>' : '', episodes ? '<span><b>' + episodes + '</b> bölüm</span>' : '', episodeRuntime ? '<span>' + esc(episodeRuntime) + '</span>' : '', status ? '<span>' + esc(status) + '</span>' : ''].filter(Boolean).join('');
                    }
                    if ((!movie.runtime || ['Bilinmiyor','Süre bilgisi yok'].includes(movie.runtime)) && episodeRuntime) { movie.runtime = episodeRuntime; setText('perde-detail-runtime', episodeRuntime); }
                }
                const castGrid = document.getElementById('perde-detail-cast-grid');
                if (castGrid && (!Array.isArray(movie.cast) || !movie.cast.length) && Array.isArray(credits.cast) && credits.cast.length) {
                    movie.cast = credits.cast.slice(0, 12).map(person => ({ name: person.name || 'Bilinmiyor', role: person.character || 'Oyuncu', profile: person.profile_path ? 'https://image.tmdb.org/t/p/w185' + person.profile_path : '' }));
                    castGrid.innerHTML = movie.cast.map((person, index) => {
                        const name = String(person.name || 'Oyuncu');
                        const jsName = name.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
                        const avatar = person.profile || getAvatarUrl(name);
                        return '<button onclick="openActorBio(\'' + jsName + '\')" class="perde-imdb-cast-card"><img id="actor-img-' + movie.id + '-' + index + '" src="' + esc(avatar) + '" alt="' + esc(name) + '" loading="lazy"><span><b>' + esc(name) + '</b><small>' + esc(person.role || 'Oyuncu') + '</small></span></button>';
                    }).join('');
                }
                if (!movie.trailerUrl) {
                    const trailer = (videos.results || []).find(video => video.site === 'YouTube' && video.type === 'Trailer' && video.official) || (videos.results || []).find(video => video.site === 'YouTube' && video.type === 'Trailer');
                    if (trailer && trailer.key) { movie.trailerUrl = 'https://www.youtube.com/watch?v=' + trailer.key; if (movies.some(item => item.id === movie.id)) saveToLocalStorage(); }
                }
            } catch (error) { console.warn('Detay bilgileri tamamlanamadı:', error); }
        }
        // Türkiye'deki yayın seçenekleri TMDB'nin JustWatch destekli Watch Providers verisinden alınır.
        const watchProviderCache = {};
        function escapeProviderText(value) {
            return String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
        }

        async function loadWatchProviders(movie) {
            const container = document.getElementById('perde-watch-providers');
            if (!container) return;
            const apiKey = 'feec99b21abf1323730ff9fdc6e4e912';
            const mediaType = movie.type === 'tv' ? 'tv' : 'movie';
            const apiBase = 'https://api.themoviedb.org/3/';
            const cacheKey = mediaType + ':' + (movie.tmdbId || movie.id || movie.title);
            const renderEmpty = message => {
                const target = document.getElementById('perde-watch-providers');
                if (target) target.innerHTML = '<div class="perde-watch-heading"><div><span>NEREDEN İZLENİR?</span><h3>Yayın Platformları</h3></div><span class="perde-watch-region"><i class="fa-solid fa-location-dot"></i> Türkiye</span></div><p class="perde-watch-empty">' + escapeProviderText(message) + '</p><p class="perde-watch-credit">Yayın bilgileri JustWatch kaynaklıdır.</p>';
            };
            const renderGroup = (label, icon, providers) => {
                if (!Array.isArray(providers) || !providers.length) return '';
                return '<div class="perde-watch-group"><h4><i class="fa-solid ' + icon + '"></i>' + label + '</h4><div class="perde-watch-list">' +
                    providers.map(provider => '<div class="perde-watch-provider"><img src="https://image.tmdb.org/t/p/w92' + provider.logo_path + '" alt="" loading="lazy" onerror="this.style.display=\'none\'"><span>' + escapeProviderText(provider.provider_name) + '</span></div>').join('') +
                    '</div></div>';
            };
            try {
                if (Object.prototype.hasOwnProperty.call(watchProviderCache, cacheKey)) {
                    renderWatchProviderResult(watchProviderCache[cacheKey], movie);
                    return;
                }
                let tmdbId = movie.tmdbId || (String(movie.id || '').match(/^tmdb-(?:movie|tv)-(.+)$/) || [])[1] || '';
                if (!tmdbId) {
                    const searchResponse = await fetch(apiBase + 'search/' + mediaType + '?api_key=' + encodeURIComponent(apiKey) + '&language=tr-TR&query=' + encodeURIComponent(movie.title || ''));
                    if (!searchResponse.ok) throw new Error('search');
                    const searchData = await searchResponse.json();
                    const year = String(movie.year || '');
                    const match = (searchData.results || []).find(item => {
                        const date = String(item.release_date || item.first_air_date || '');
                        return !year || date.startsWith(year);
                    }) || (searchData.results || [])[0];
                    tmdbId = match && match.id;
                }
                if (!tmdbId) {
                    renderEmpty('Bu yapım için Türkiye yayın platformu bilgisi bulunamadı.');
                    return;
                }
                const response = await fetch(apiBase + mediaType + '/' + tmdbId + '/watch/providers?api_key=' + encodeURIComponent(apiKey));
                if (!response.ok) throw new Error('providers');
                const data = await response.json();
                const result = data.results && data.results.TR ? data.results.TR : null;
                watchProviderCache[cacheKey] = result;
                renderWatchProviderResult(result, movie);
            } catch (error) {
                renderEmpty('Platform bilgileri şu anda alınamadı. Lütfen daha sonra tekrar deneyin.');
            }
        }

        function renderWatchProviderResult(result, movie) {
            const container = document.getElementById('perde-watch-providers');
            if (!container) return;
            const providers = result
                ? [...(result.flatrate || []), ...(result.free || []), ...(result.ads || []), ...(result.rent || []), ...(result.buy || [])]
                : [];
            const uniqueProviders = providers.filter((provider, index, list) =>
                list.findIndex(item => item.provider_id === provider.provider_id) === index
            );
            const heading = '<span class="perde-watch-label">NEREDE YAYINLANIYOR?</span>';
            if (!uniqueProviders.length) {
                container.innerHTML = '<div class="perde-watch-single-line">' + heading +
                    '<span class="perde-watch-empty">Türkiye için yayın bilgisi bulunamadı</span></div>';
                return;
            }
            const providerMarkup = uniqueProviders.map(provider =>
                '<span class="perde-watch-provider" title="' + escapeProviderText(provider.provider_name) + '">' +
                (provider.logo_path ? '<img src="https://image.tmdb.org/t/p/w92' + provider.logo_path + '" alt="" loading="lazy" onerror="this.style.display=\'none\'">' : '') +
                '<span>' + escapeProviderText(provider.provider_name) + '</span></span>'
            ).join('');
            container.innerHTML = '<div class="perde-watch-single-line">' + heading +
                '<div class="perde-watch-list">' + providerMarkup + '</div>' +
                '<a class="perde-watch-credit" href="https://www.justwatch.com/tr" target="_blank" rel="noopener noreferrer" title="Yayın verileri JustWatch kaynaklıdır">JustWatch</a></div>';
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
                const previousStatus = m.status;
                m.status = newStatus;
                if (newStatus === 'watched' && previousStatus !== 'watched') {
                    const today = new Date().toISOString().slice(0, 10);
                    m.watchedAt = today;
                    if (!Array.isArray(m.watchHistory)) m.watchHistory = [];
                    m.watchHistory.push({ date: today, rating: '', review: '' });
                }
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
