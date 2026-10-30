// Global State & Persistent Storage Key
        const STORAGE_KEY = 'perde_movies_archive_v1'; // Eski anahtar korunur: mevcut arşiv verileri kaybolmaz.
        const ADMIN_PASS_KEY = 'perde_admin_password_v1';
        let isAdminLoggedIn = false;
        let searchDebounceTimer = null;
        let fetchedOnlineResults = [];
        let comparisonSelection = [];

        function scrollDetailCast(direction) {
            const track = document.getElementById('perde-detail-cast-grid');
            if (track) track.scrollBy({ left: direction * track.clientWidth * 0.8, behavior: 'smooth' });
        }

        function updateDetailCastArrows() {
            const track = document.getElementById('perde-detail-cast-grid');
            if (!track) return;
            const hasOverflow = track.scrollWidth > track.clientWidth + 4;
            const prev = track.parentElement.querySelector('.perde-cast-prev');
            const next = track.parentElement.querySelector('.perde-cast-next');
            if (prev) prev.hidden = !hasOverflow || track.scrollLeft <= 4;
            if (next) next.hidden = !hasOverflow || track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
        }

        function getPerdeRatedMovies() {
            return movies.filter(item => Number.isFinite(Number(item.perdeRating)) && Number(item.perdeRating) >= 1 && Number(item.perdeRating) <= 10);
        }

        function renderPerdeRatingPanel(movie) {
            const current = Number(movie.perdeRating) || 0;
            const rated = getPerdeRatedMovies();
            const average = rated.length
                ? (rated.reduce((sum, item) => sum + Number(item.perdeRating), 0) / rated.length).toFixed(1)
                : '—';
            const options = '<option value="" ' + (!current ? 'selected' : '') + ' disabled>Puan seç</option>' + Array.from({ length: 10 }, (_, index) => {
                const value = index + 1;
                return '<option value="' + value + '" ' + (current === value ? 'selected' : '') + '>' + value + ' / 10</option>';
            }).join('');
            return '<section class="perde-rating-panel" aria-label="Perde Puanı">' +
                '<div class="perde-rating-heading"><div><span>SADECE SENİN ARŞİVİN</span><h3><i class="fa-solid fa-clapperboard"></i> Perde Puanı</h3><p>Bu yapımı kendi izleme deneyimine göre 10 üzerinden puanla.</p></div>' +
                '<div class="perde-rating-average"><strong>' + average + '</strong><span>Arşiv ortalaması</span><small>' + rated.length + ' puanlanan yapım</small></div></div>' +
                '<div class="perde-rating-controls"><label for="perde-rating-select">Senin puanın</label><select id="perde-rating-select" class="input-field">' + options + '</select>' +
                '<button type="button" onclick="savePerdeRating(\'' + String(movie.id).replace(/'/g, '') + '\')"><i class="fa-solid fa-star"></i> Puanı kaydet</button>' +
                (current ? '<span class="perde-rating-saved"><i class="fa-solid fa-circle-check"></i> Kaydedilen puanın: ' + current + '/10</span>' : '<span class="perde-rating-hint">Henüz puan vermedin.</span>') +
                '</div><small class="perde-rating-note">Puanın bu tarayıcıdaki kişisel arşivine kaydedilir; IMDb puanından bağımsızdır.</small></section>';
        }

        function savePerdeRating(id) {
            const select = document.getElementById('perde-rating-select');
            const value = Number(select && select.value);
            if (!Number.isInteger(value) || value < 1 || value > 10) {
                showToast('Lütfen 1 ile 10 arasında bir puan seç.');
                return;
            }
            let item = movies.find(movie => String(movie.id) === String(id));
            if (!item) {
                item = onlineCatalog.find(movie => String(movie.id) === String(id)) ||
                    fetchedOnlineResults.find(movie => String(movie.id) === String(id));
                if (!item) return;
                item = { ...item };
                movies.push(item);
            }
            item.perdeRating = value;
            saveToLocalStorage();
            showToast('Perde Puanın kaydedildi.');
            openDetailModal(id);
        }

        function getComparisonMovie(id) {
            return movies.find(item => String(item.id) === String(id)) ||
                onlineCatalog.find(item => String(item.id) === String(id)) ||
                fetchedOnlineResults.find(item => String(item.id) === String(id)) || null;
        }

        function addToComparison(id) {
            const item = getComparisonMovie(id);
            if (!item) return;
            if (comparisonSelection.some(entry => String(entry.id) === String(item.id))) {
                showToast('Bu yapım zaten karşılaştırma listesinde.');
                return;
            }
            if (comparisonSelection.length >= 2) {
                showToast('Karşılaştırma için en fazla iki yapım seçebilirsin.');
                return;
            }
            comparisonSelection.push(item);
            renderComparisonTray();
            showToast(item.title + ' karşılaştırmaya eklendi.');
            if (comparisonSelection.length === 2) openComparison();
        }

        function removeFromComparison(id) {
            comparisonSelection = comparisonSelection.filter(item => String(item.id) !== String(id));
            renderComparisonTray();
            if (comparisonSelection.length < 2) closeComparison();
        }

        function clearComparison() {
            comparisonSelection = [];
            renderComparisonTray();
            closeComparison();
        }

        function renderComparisonTray() {
            const tray = document.getElementById('comparison-tray');
            const count = document.getElementById('comparison-count');
            if (!tray || !count) return;
            count.textContent = comparisonSelection.length + '/2';
            tray.hidden = comparisonSelection.length === 0;
        }

        function comparisonValue(value) {
            if (Array.isArray(value)) return value.length ? value.join(', ') : 'Bilgi yok';
            return value !== undefined && value !== null && String(value).trim() ? String(value) : 'Bilgi yok';
        }

        function openComparison() {
            if (comparisonSelection.length !== 2) {
                showToast('Karşılaştırmak için iki yapım seçmelisin.');
                return;
            }
            const [a, b] = comparisonSelection;
            const rows = [
                ['Yapım türü', a.type === 'tv' ? 'Dizi' : a.type === 'doc' ? 'Belgesel' : 'Film', b.type === 'tv' ? 'Dizi' : b.type === 'doc' ? 'Belgesel' : 'Film'],
                ['Yıl', a.year, b.year],
                ['IMDb puanı', a.imdb, b.imdb],
                ['Perde Puanı', a.perdeRating ? a.perdeRating + '/10' : 'Henüz puanlanmadı', b.perdeRating ? b.perdeRating + '/10' : 'Henüz puanlanmadı'],
                ['Süre', a.runtime, b.runtime],
                ['Türler', a.genres, b.genres],
                ['Yönetmen / yaratıcı', a.director, b.director],
                ['Ülke', a.country, b.country],
                ['Oyuncular', (a.cast || []).slice(0, 5).map(person => person.name), (b.cast || []).slice(0, 5).map(person => person.name)],
                ['Konu', a.overview, b.overview]
            ];
            const poster = item => item.poster || item.backdrop || '';
            const content = document.getElementById('comparison-modal-content');
            content.innerHTML =
                '<div class="perde-compare-heading"><span>PERDE KARŞILAŞTIRMA</span><h2>Hangisi sana daha yakın?</h2><p>İki yapımın temel bilgilerini yan yana incele.</p></div>' +
                '<div class="perde-compare-productions">' + [a,b].map(item =>
                    '<article class="perde-compare-production"><img src="' + escapeProviderText(poster(item)) + '" alt="' + escapeProviderText(item.title) + ' afişi"><div><strong>' + escapeProviderText(item.title) + '</strong><small>' + escapeProviderText(item.year || 'Yıl bilinmiyor') + '</small><button type="button" onclick="removeFromComparison(\'' + String(item.id).replace(/'/g, '') + '\')"><i class="fa-solid fa-xmark"></i> Çıkar</button></div></article>'
                ).join('') + '</div>' +
                '<div class="perde-compare-table">' + rows.map(row =>
                    '<div class="perde-compare-row"><b>' + row[0] + '</b><div>' + escapeProviderText(comparisonValue(row[1])) + '</div><div>' + escapeProviderText(comparisonValue(row[2])) + '</div></div>'
                ).join('') + '</div>' +
                '<p class="perde-compare-footnote">Bilgiler mevcut arşiv ve TMDB kayıtlarından alınır. Eksik veriler “Bilgi yok” olarak gösterilir.</p>';
            document.getElementById('comparison-modal').classList.remove('hidden');
        }

        function closeComparison() {
            const modal = document.getElementById('comparison-modal');
            if (modal) modal.classList.add('hidden');
        }

        let genreChartInstance = null;
        let statusChartInstance = null;
        let monthlyWatchChartInstance = null;

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

            ['dashboard', 'library', 'trailers', 'detail', 'stats', 'profile', 'admin'].forEach(t => {
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
            if (tabId === 'profile') renderPerdeProfile();
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

        // Favoriler, izleme durumu ve kullanıcının Perde Puanı ile önerileri kişiselleştirir.
        let personalRecommendationRequest = 0;
        let personalRecommendationRefreshCycle = 0;
        let personalRecommendationPreviousIds = new Set();
        const PERDE_RECOMMENDATION_PREFS_KEY = 'perde_recommendation_preferences_v1';
        function getPersonalRecommendationPreferences() {
            try {
                const saved = JSON.parse(localStorage.getItem(PERDE_RECOMMENDATION_PREFS_KEY) || '{}') || {};
                return { dismissedIds:Array.isArray(saved.dismissedIds)?saved.dismissedIds:[], dislikedGenreIds:Array.isArray(saved.dislikedGenreIds)?saved.dislikedGenreIds.map(Number).filter(Number.isFinite):[], history:Array.isArray(saved.history)?saved.history.filter(entry=>entry&&entry.id):[] };
            } catch (error) { return { dismissedIds:[], dislikedGenreIds:[], history:[] }; }
        }
        function savePersonalRecommendationPreferences(preferences) {
            localStorage.setItem(PERDE_RECOMMENDATION_PREFS_KEY,JSON.stringify({
                dismissedIds:[...new Set(preferences.dismissedIds||[])].slice(-300),
                dislikedGenreIds:[...new Set((preferences.dislikedGenreIds||[]).map(Number).filter(Number.isFinite))],
                history:(preferences.history||[]).slice(-150)
            }));
        }
        function dismissPersonalRecommendation(id) {
            const item=fetchedOnlineResults.find(entry=>String(entry.id)===String(id));
            const preferences=getPersonalRecommendationPreferences();
            if(!preferences.dismissedIds.includes(String(id)))preferences.dismissedIds.push(String(id));
            if(item&&Array.isArray(item.genreIds))preferences.dislikedGenreIds.push(...item.genreIds);
            savePersonalRecommendationPreferences(preferences);
            showToast('Bu yapım önerilerinden çıkarıldı.');
            renderPersonalRecommendations();
        }
        function markPersonalRecommendationWatched(id) { updateMovieStatus(id,'watched'); }
        function scrollPersonalRecommendations(direction) {
            const rail = document.getElementById('perde-personal-recommendations');
            if (!rail) return;
            const distance = Math.max(rail.clientWidth * 0.85, 280);
            rail.scrollBy({ left: direction * distance, behavior: 'smooth' });
        }

        async function renderPersonalRecommendations() {
            const container = document.getElementById('perde-personal-recommendations');
            if (!container) return;
            const requestId = ++personalRecommendationRequest;
            const refreshCycle = personalRecommendationRefreshCycle++;
            const previousRecommendationIds = personalRecommendationPreviousIds;
            const preferences = getPersonalRecommendationPreferences();
            const dismissedIds = new Set(preferences.dismissedIds.map(String));
            const dislikedGenreIds = new Set(preferences.dislikedGenreIds.map(Number));
            const historyIds = new Set(preferences.history.map(entry => String(entry.id)));
            const historyCount = document.getElementById('perde-recommendation-history-count');
            if (historyCount) historyCount.textContent = preferences.history.length + ' farklı öneri';
            const seeds = movies.filter(item => item.status === 'watched' || item.favorite)
                .sort((a,b) => Number(Boolean(b.favorite))-Number(Boolean(a.favorite)) ||
                    (Number(b.perdeRating)||0)-(Number(a.perdeRating)||0) ||
                    (Number(b.imdb)||0)-(Number(a.imdb)||0)).slice(0,4);
            if (!seeds.length) {
                container.innerHTML = '<p class="perde-recommendation-empty"><i class="fa-solid fa-lightbulb"></i> Sana özel öneriler oluşturmak için arşivinden birkaç yapımı favorile veya izledim olarak işaretle.</p>';
                return;
            }
            container.innerHTML = '<p class="perde-recommendation-loading"><i class="fa-solid fa-spinner fa-spin"></i> İzleme zevkine göre öneriler aranıyor…</p>';
            const apiKey = 'feec99b21abf1323730ff9fdc6e4e912';
            const base = 'https://api.themoviedb.org/3/';
            const requests = seeds.map(async (seed, seedIndex) => {
                const mediaType = seed.type === 'tv' ? 'tv' : 'movie';
                let tmdbId = seed.tmdbId || (String(seed.id || '').match(/^tmdb-(?:movie|tv)-(.+)$/) || [])[1] || '';
                if (!tmdbId) {
                    const searchParams = new URLSearchParams({api_key:apiKey,language:'tr-TR',query:seed.title||''});
                    const search = await fetch(base + 'search/' + mediaType + '?' + searchParams.toString());
                    if (!search.ok) return [];
                    const searchData = await search.json();
                    const year = String(seed.year || '');
                    const results = searchData.results || [];
                    const match = results.find(item => year && String(item.release_date || item.first_air_date || '').startsWith(year)) ||
                        results.find(item => String(item.title || item.name || '').trim().toLocaleLowerCase('tr') === String(seed.title || '').trim().toLocaleLowerCase('tr')) || results[0];
                    tmdbId = match && match.id;
                }
                if (!tmdbId) return [];
                const recommendationPage = ((refreshCycle + seedIndex * 2) % 5) + 1;
                const params = new URLSearchParams({api_key:apiKey,language:'tr-TR',page:String(recommendationPage)});
                const [detailResponse,recommendationResponse,similarResponse] = await Promise.all([
                    fetch(base + mediaType + '/' + encodeURIComponent(tmdbId) + '?' + params.toString()),
                    fetch(base + mediaType + '/' + encodeURIComponent(tmdbId) + '/recommendations?' + params.toString()),
                    fetch(base + mediaType + '/' + encodeURIComponent(tmdbId) + '/similar?' + params.toString())
                ]);
                if (!recommendationResponse.ok && !similarResponse.ok) return [];
                const details = detailResponse.ok ? await detailResponse.json() : {};
                const recommendations = recommendationResponse.ok ? await recommendationResponse.json() : {results:[]};
                const similar = similarResponse.ok ? await similarResponse.json() : {results:[]};
                const genreIds = new Set((details.genres || []).map(genre => Number(genre.id)).filter(Boolean));
                const seedWeight = 1 + (seed.favorite ? 1.5 : 0) + (Math.max(0,Math.min(10,Number(seed.perdeRating)||0)) / 10);
                const combinedResults = [...(recommendations.results || []), ...(similar.results || [])];
                return combinedResults.map(item => ({item,mediaType,genreIds,seedWeight}));
            });
            try {
                const groups = await Promise.all(requests);
                if (requestId !== personalRecommendationRequest || !document.getElementById('perde-personal-recommendations')) return;
                const archiveHas = item => movies.some(saved =>
                    (saved.tmdbId && String(saved.tmdbId) === String(item.tmdbId)) ||
                    String(saved.id || '') === String(item.id || '') ||
                    ((saved.title || '').trim().toLocaleLowerCase('tr') === (item.title || '').trim().toLocaleLowerCase('tr') && String(saved.year || '') === String(item.year || ''))
                );
                const ranked = new Map();
                groups.flat().forEach(({item,mediaType,genreIds,seedWeight}) => {
                    const key = mediaType + ':' + item.id;
                    const date = item.release_date || item.first_air_date || '';
                    const title = item.title || item.name || '';
                    if (!title) return;
                    const candidateGenres = new Set((item.genre_ids || []).map(Number));
                    const genreMatches = [...candidateGenres].filter(id => genreIds.has(id)).length;
                    const dislikedGenreMatches = [...candidateGenres].filter(id => dislikedGenreIds.has(id)).length;
                    const vote = Number(item.vote_average) || 0;
                    const score = (genreMatches * 3 * seedWeight) + (vote / 10) - (dislikedGenreMatches * 2.5);
                    const existing = ranked.get(key);
                    if (existing) {
                        existing.score += score;
                        existing.genreMatches = Math.max(existing.genreMatches,genreMatches);
                        existing.genreIds = [...new Set([...(existing.genreIds || []),...candidateGenres])];
                    } else {
                        ranked.set(key,{
                            id:'tmdb-' + mediaType + '-' + item.id, tmdbId:item.id, source:'recommendation',
                            title, type:mediaType, year:date.slice(0,4), imdb:vote>0?vote.toFixed(1):'—',
                            status:'watch_later', favorite:false, genres:[],
                            poster:item.poster_path?'https://image.tmdb.org/t/p/w500'+item.poster_path:'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80',
                            backdrop:item.backdrop_path?'https://image.tmdb.org/t/p/w1280'+item.backdrop_path:'',
                            overview:item.overview||'Bu yapım için henüz konu özeti bulunmuyor.',
                            director:'Bilinmiyor', country:'Bilinmiyor', runtime:'Bilinmiyor', cast:[], trailerUrl:'',
                            score,genreMatches,genreIds:[...candidateGenres]
                        });
                    }
                });
                const candidates = [...ranked.values()].filter(item => !archiveHas(item) && !dismissedIds.has(String(item.id)))
                    .sort((a,b) => b.score-a.score || (Number(b.imdb)||0)-(Number(a.imdb)||0));
                const freshCandidates = candidates.filter(item => !historyIds.has(String(item.id)) && !previousRecommendationIds.has(item.id));
                const pool = freshCandidates.length >= Math.min(3,candidates.length) ? freshCandidates : candidates;
                const recommendations = [];
                const remaining = [...pool];
                while (remaining.length && recommendations.length < 6) {
                    let bestIndex=0,bestScore=-Infinity;
                    remaining.forEach((candidate,index)=>{
                        const candidateGenres=candidate.genreIds||[];
                        const covered=new Set(recommendations.flatMap(entry=>entry.genreIds||[]));
                        const newGenres=candidateGenres.filter(id=>!covered.has(id)).length;
                        const repeatedGenres=candidateGenres.length-newGenres;
                        const diversityScore=candidate.score+(newGenres*1.35)-(repeatedGenres*0.65);
                        if(diversityScore>bestScore){bestScore=diversityScore;bestIndex=index;}
                    });
                    recommendations.push(remaining.splice(bestIndex,1)[0]);
                }
                personalRecommendationPreviousIds=new Set(recommendations.map(item=>item.id));
                preferences.history=[...new Map([...preferences.history,...recommendations.map(item=>({id:String(item.id),title:String(item.title||''),shownAt:new Date().toISOString()}))].map(entry=>[String(entry.id),entry])).values()].slice(-150);
                savePersonalRecommendationPreferences(preferences);
                if(historyCount)historyCount.textContent=preferences.history.length+' farklı öneri';
                recommendations.forEach(item => {
                    if (!fetchedOnlineResults.some(existing => String(existing.tmdbId || '') === String(item.tmdbId))) fetchedOnlineResults.push(item);
                });
                if (!recommendations.length) {
                    container.innerHTML = '<p class="perde-recommendation-empty">Şu an yeni öneri bulunamadı. İzleme geçmişin değiştikçe önerilerin de yenilenecek.</p>';
                    return;
                }
                async function loadRecommendationProviders(item) {
                    const mediaType = item.type === 'tv' ? 'tv' : 'movie';
                    const tmdbId = item.tmdbId || (String(item.id || '').match(/^tmdb-(?:movie|tv)-(.+)$/) || [])[1] || '';
                    const target = document.getElementById('perde-recommendation-providers-' + mediaType + '-' + tmdbId);
                    if (!target || !tmdbId) return;
                    const cacheKey = mediaType + ':' + tmdbId;
                    try {
                        let result;
                        if (Object.prototype.hasOwnProperty.call(watchProviderCache,cacheKey)) result = watchProviderCache[cacheKey];
                        else {
                            const response = await fetch(base + mediaType + '/' + encodeURIComponent(tmdbId) + '/watch/providers?api_key=' + encodeURIComponent(apiKey));
                            if (!response.ok) throw new Error('providers');
                            const data = await response.json();
                            result = data.results && data.results.TR ? data.results.TR : null;
                            watchProviderCache[cacheKey] = result;
                        }
                        const providers = result ? [...(result.flatrate||[]),...(result.free||[]),...(result.ads||[]),...(result.rent||[]),...(result.buy||[])] : [];
                        const uniqueProviders = providers.filter((provider,index,list) => provider.logo_path && list.findIndex(entry => entry.provider_id === provider.provider_id) === index);
                        target.innerHTML = uniqueProviders.map(provider => '<span class="perde-recommendation-provider" title="' + escapeProviderText(provider.provider_name) + '"><img src="https://image.tmdb.org/t/p/w45' + escapeProviderText(provider.logo_path) + '" alt="' + escapeProviderText(provider.provider_name) + '" loading="lazy" onerror="this.parentElement.remove()"></span>').join('');
                    } catch (error) {
                        if (target.isConnected) target.innerHTML = '';
                        console.warn('Öneri platform bilgileri alınamadı:',item.title,error);
                    }
                }
                container.innerHTML = recommendations.map(item => {
                    const id = escapeProviderText(item.id), title = escapeProviderText(item.title), poster = escapeProviderText(item.poster);
                    const rawOverview = String(item.overview || '').trim();
                    const overview = escapeProviderText(rawOverview ? (rawOverview.length > 190 ? rawOverview.slice(0,187).trimEnd() + '…' : rawOverview) : 'Bu yapım için henüz konu özeti bulunmuyor.');
                    return '<article class="perde-personal-card"><div class="perde-personal-poster-wrap"><button type="button" class="perde-personal-poster" onclick="openDetailModal(\'' + id + '\')" aria-label="' + title + ' detaylarını aç"><img src="' + poster + '" alt="' + title + ' afişi" loading="lazy"><span><i class="fa-solid fa-star"></i> ' + escapeProviderText(item.imdb) + '</span></button><button type="button" class="perde-personal-details" onclick="openDetailModal(\'' + id + '\')"><i class="fa-solid fa-circle-info" aria-hidden="true"></i><span>Detaylar</span></button></div><div class="perde-personal-card-copy"><button type="button" onclick="openDetailModal(\'' + id + '\')">' + title + '</button><small>' + escapeProviderText(item.year || 'Yıl bilinmiyor') + ' · ' + (item.type === 'tv' ? 'Dizi' : 'Film') + '</small><p class="perde-personal-overview">' + overview + '</p><div class="perde-recommendation-providers" id="perde-recommendation-providers-' + item.type + '-' + escapeProviderText(item.tmdbId) + '"></div><div class="perde-personal-actions"><button type="button" class="perde-personal-add" onclick="addSimilarProduction(\'' + id + '\', this)"><i class="fa-solid fa-plus"></i> Listeme ekle</button><button type="button" class="perde-personal-link" onclick="openDetailModal(\'' + id + '\', \'tr_sub\', true)"><i class="fa-solid fa-play"></i> Fragmanı izle</button></div></div></article>';
                }).join('');
                recommendations.forEach(item => loadRecommendationProviders(item));
            } catch (error) {
                if (requestId === personalRecommendationRequest) container.innerHTML = '<p class="perde-recommendation-empty">Öneriler şu anda yüklenemedi. Biraz sonra tekrar deneyebilirsin.</p>';
                console.warn('Kişisel öneriler alınamadı:',error);
            }
        }

        let hiddenGemRequestId = 0;
        let hiddenGemRefreshCycle = 0;
        let hiddenGemCache = [];

        // Popüler listelerde kaybolan, puanı yüksek ve görece az bilinen yapımları keşfet.
        async function renderHiddenGems(forceRefresh = false) {
            const container = document.getElementById('hidden-gems-grid');
            if (!container) return;
            if (hiddenGemCache.length && !forceRefresh) {
                renderRow('hidden-gems-grid', hiddenGemCache);
                return;
            }
            const requestId = ++hiddenGemRequestId;
            container.innerHTML = '<div class="perde-hidden-gems-loading"><i class="fa-solid fa-spinner fa-spin"></i><span>Keşfedilmeyi bekleyen yapımlar aranıyor…</span></div>';
            const apiKey = 'feec99b21abf1323730ff9fdc6e4e912';
            const base = 'https://api.themoviedb.org/3/discover/';
            const page = (hiddenGemRefreshCycle++ % 3) + 1;
            const params = new URLSearchParams({
                api_key: apiKey,
                language: 'tr-TR',
                sort_by: 'vote_average.desc',
                'vote_average.gte': '7.4',
                'vote_count.gte': '250',
                'vote_count.lte': '12000',
                'popularity.lte': '55',
                include_adult: 'false',
                page: String(page)
            });
            try {
                const [moviesResponse, tvResponse] = await Promise.all([
                    fetch(base + 'movie?' + params.toString()),
                    fetch(base + 'tv?' + params.toString())
                ]);
                if (!moviesResponse.ok || !tvResponse.ok) throw new Error('discover');
                const [movieData, tvData] = await Promise.all([moviesResponse.json(), tvResponse.json()]);
                if (requestId !== hiddenGemRequestId) return;
                const genreNames = {
                    12:'Macera',14:'Fantastik',16:'Animasyon',18:'Dram',27:'Korku',28:'Aksiyon',
                    35:'Komedi',36:'Tarih',37:'Western',53:'Gerilim',80:'Suç',99:'Belgesel',
                    878:'Bilim Kurgu',9648:'Gizem',10402:'Müzik',10749:'Romantik',10751:'Aile',
                    10752:'Savaş',10759:'Aksiyon & Macera',10762:'Çocuk',10763:'Haber',
                    10764:'Reality',10765:'Bilim Kurgu & Fantastik',10766:'Pembe Dizi',
                    10767:'Talk Show',10768:'Savaş & Politik',10770:'TV Filmi'
                };
                const archiveHas = item => movies.some(saved =>
                    (saved.tmdbId && String(saved.tmdbId) === String(item.id)) ||
                    String(saved.id || '') === String(item.id) ||
                    ((saved.title || '').trim().toLocaleLowerCase('tr') === (item.title || '').trim().toLocaleLowerCase('tr') &&
                        String(saved.year || '') === String(item.year || ''))
                );
                const candidates = [
                    ...(movieData.results || []).map(item => ({item,type:'movie'})),
                    ...(tvData.results || []).map(item => ({item,type:'tv'}))
                ].map(({item,type}) => {
                    const date = item.release_date || item.first_air_date || '';
                    const title = item.title || item.name || '';
                    return {
                        id: 'tmdb-' + type + '-' + item.id,
                        tmdbId: item.id,
                        title,
                        type,
                        year: date ? Number(date.slice(0,4)) : '',
                        imdb: Number(Number(item.vote_average || 0).toFixed(1)),
                        poster: item.poster_path ? 'https://image.tmdb.org/t/p/w500' + item.poster_path : '',
                        backdrop: item.backdrop_path ? 'https://image.tmdb.org/t/p/w1280' + item.backdrop_path : '',
                        overview: item.overview || 'Bu yapım, yüksek izleyici puanına rağmen daha az bilinen keşiflerden biri.',
                        genres: (item.genre_ids || []).map(id => genreNames[id]).filter(Boolean),
                        status: 'discovered',
                        favorite: false
                    };
                }).filter(item => item.title && item.poster && !archiveHas(item));
                const unique = [...new Map(candidates.map(item => [item.id,item])).values()]
                    .sort((a,b) => (Number(b.imdb)||0)-(Number(a.imdb)||0));
                hiddenGemCache = unique.slice(0,8);
                if (!hiddenGemCache.length) {
                    container.innerHTML = '<div class="perde-hidden-gems-empty"><i class="fa-solid fa-gem"></i><span>Bu turda yeni bir gizli cevher bulamadık. Yeniden deneyebilirsin.</span></div>';
                    return;
                }
                // Detay penceresi ve mevcut listeye ekleme akışlarıyla uyumlu tut.
                hiddenGemCache.forEach(item => {
                    if (!fetchedOnlineResults.some(existing => String(existing.id) === String(item.id))) fetchedOnlineResults.push(item);
                });
                renderRow('hidden-gems-grid', hiddenGemCache);
            } catch (error) {
                if (requestId === hiddenGemRequestId) {
                    container.innerHTML = '<div class="perde-hidden-gems-empty"><i class="fa-solid fa-cloud-arrow-down"></i><span>Gizli cevherler şu anda yüklenemedi. Bağlantını kontrol edip yeniden deneyebilirsin.</span><button type="button" onclick="renderHiddenGems(true)">Tekrar dene</button></div>';
                }
                console.warn('Gizli cevherler yüklenemedi:', error);
            }
        }

        function renderDashboard() {
            renderFeaturedHero();
            renderTodaysPick();
            renderPersonalRecommendations();
            renderHiddenGems();
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

        // Ana sayfa poster görseli yüklenemezse uzaktan bağımlılığı olmayan bir yedek göster.
        function handleHomePosterError(image) {
            if (!image || image.dataset.fallbackApplied === 'true') return;
            image.dataset.fallbackApplied = 'true';
            image.hidden = true;
            const fallback = document.createElement('div');
            fallback.className = 'ml-home-poster-fallback';
            fallback.setAttribute('role', 'img');
            fallback.setAttribute('aria-label', 'Afiş görseli yüklenemedi');
            fallback.innerHTML = '<i class="fa-solid fa-film" aria-hidden="true"></i><span>AFİŞ YÜKLENEMEDİ</span>';
            image.insertAdjacentElement('afterend', fallback);
        }

        // Ana sayfa kartlarında eksik künye ve süre bilgilerini TMDB'den tamamlar.
        const homeCardMetadataCache = {};
        async function loadHomeCardMetadata(movie) {
            const mediaType = movie.type === 'tv' ? 'tv' : 'movie';
            const key = mediaType + ':' + String(movie.tmdbId || movie.id || (movie.title + ':' + movie.year));
            if (homeCardMetadataCache[key]) return homeCardMetadataCache[key];
            homeCardMetadataCache[key] = (async () => {
                const apiKey = 'feec99b21abf1323730ff9fdc6e4e912';
                const apiBase = 'https://api.themoviedb.org/3/';
                let tmdbId = movie.tmdbId || (String(movie.id || '').match(/^tmdb-(?:tv|movie)-(.+)$/) || [])[1] || '';
                if (!tmdbId) {
                    const params = new URLSearchParams({ api_key: apiKey, language: 'tr-TR', include_adult: 'false', query: movie.title || '' });
                    const response = await fetch(apiBase + 'search/' + mediaType + '?' + params.toString());
                    if (!response.ok) return null;
                    const data = await response.json();
                    const results = data.results || [];
                    const normalize = value => String(value || '').toLocaleLowerCase('tr-TR').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
                    const title = normalize(movie.title);
                    const year = String(movie.year || '');
                    const exact = results.find(item => normalize(item.name || item.title) === title);
                    const yearMatch = results.find(item => year && String(item.first_air_date || item.release_date || '').startsWith(year));
                    const match = exact || yearMatch;
                    tmdbId = match && match.id;
                }
                if (!tmdbId) return null;
                const params = new URLSearchParams({ api_key: apiKey, language: 'tr-TR' });
                const response = await fetch(apiBase + mediaType + '/' + encodeURIComponent(tmdbId) + '?' + params.toString());
                if (!response.ok) return null;
                const details = await response.json();
                const date = details.first_air_date || details.release_date || '';
                let changed = false;
                const fill = (field, value) => {
                    const current = movie[field];
                    const missing = current === undefined || current === null || current === '' ||
                        ['—', 'Bilinmiyor', 'Süre bilgisi yok'].includes(String(current).trim());
                    if (missing && value !== undefined && value !== null && value !== '') {
                        movie[field] = value;
                        changed = true;
                    }
                };
                fill('tmdbId', String(tmdbId));
                fill('year', date ? date.slice(0, 4) : '');
                if ((!Array.isArray(movie.genres) || !movie.genres.length) && Array.isArray(details.genres) && details.genres.length) {
                    movie.genres = details.genres.map(genre => genre.name).filter(Boolean);
                    changed = true;
                }
                if ((!movie.poster || String(movie.poster).includes('unsplash.com')) && details.poster_path) {
                    movie.poster = 'https://image.tmdb.org/t/p/w500' + details.poster_path;
                    changed = true;
                }
                if (mediaType === 'tv') {
                    fill('number_of_seasons', Number(details.number_of_seasons) || '');
                    fill('number_of_episodes', Number(details.number_of_episodes) || '');
                } else {
                    fill('runtime', details.runtime ? details.runtime + ' dk' : '');
                }
                if (changed && movies.some(item => String(item.id) === String(movie.id))) saveToLocalStorage();
                return {
                    year: movie.year || '',
                    genres: Array.isArray(movie.genres) ? movie.genres : [],
                    runtime: movie.runtime || '',
                    seasons: Number(movie.number_of_seasons || movie.seasons) || 0,
                    episodes: Number(movie.number_of_episodes || movie.episodes) || 0
                };
            })().catch(error => {
                console.warn('Ana sayfa kart bilgileri alınamadı:', error);
                return null;
            });
            return homeCardMetadataCache[key];
        }

        function toggleHomeCardPreview(button) {
            const card = button && button.closest('.ml-home-poster-card');
            if (!card) return;
            const opening = !card.classList.contains('is-preview-open');
            card.classList.toggle('is-preview-open', opening);
            button.setAttribute('aria-expanded', String(opening));
            button.setAttribute('aria-label', opening ? 'Önizlemeyi kapat' : 'Önizlemeyi aç');
            const preview = card.querySelector('.ml-home-poster-preview');
            if (preview) preview.setAttribute('aria-hidden', String(!opening));
        }

        function renderRow(containerId, list) {
            const container = document.getElementById(containerId);
            if (!container) return;
            if (!list.length) {
                container.innerHTML = '<div class="col-span-full ml-empty-state"><i class="fa-solid fa-film"></i><span>Henüz burada bir yapım yok. Arşivine yapım ekleyerek başlayabilirsin.</span></div>';
                return;
            }
            const safe = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
            const homePosterMode = ['editor-picks-grid', 'recent-row', 'watchlist-row', 'hidden-gems-grid'].includes(containerId);
            container.innerHTML = list.map(m => {
                const type = m.type === 'tv' ? 'DİZİ' : m.type === 'doc' ? 'BELGESEL' : 'FİLM';
                const watched = m.status === 'watched';
                const genres = Array.isArray(m.genres) ? m.genres.slice(0,2).join(' · ') : '';
                const runtime = m.runtime && !['Bilinmiyor', 'Süre bilgisi yok', '—'].includes(String(m.runtime).trim()) ? String(m.runtime).trim() : '';
                const seriesSeasons = Number(m.number_of_seasons || m.seasons) || 0;
                const seriesEpisodes = Number(m.number_of_episodes || m.episodes) || 0;
                const title = safe(m.title), id = safe(m.id);
                const metaId = 'ml-home-meta-' + safe(containerId) + '-' + list.indexOf(m);
                const seriesMeta = m.type === 'tv'
                    ? (seriesSeasons || seriesEpisodes
                        ? (seriesSeasons ? seriesSeasons + ' sezon' : '') + (seriesSeasons && seriesEpisodes ? ' · ' : '') + (seriesEpisodes ? seriesEpisodes + ' bölüm' : '')
                        : '')
                    : '';
                const durationMeta = m.type === 'tv' ? seriesMeta : runtime;
                const overview = String(m.overview || '').trim();
                const previewText = overview.length > 190 ? overview.slice(0, 187).trimEnd() + '…' : overview;
                const posterInfo = '<div class="ml-home-poster-info">' +
                    '<h3 title="' + title + '">' + title + '</h3>' +
                    '<div class="ml-home-poster-facts"><span class="ml-home-poster-rating"><i class="fa-solid fa-star"></i> ' + (containerId === 'hidden-gems-grid' ? 'TMDB ' : 'IMDb ') + safe(m.imdb || '—') + '</span>' +
                    '<span id="' + metaId + '-year">' + safe(m.year || '—') + '</span></div>' +
                    '<div id="' + metaId + '-genres" class="ml-home-poster-genres">' + safe(genres || type) + '</div></div>' +
                    '<span id="' + metaId + '-duration" class="ml-home-poster-runtime"' + (durationMeta ? '' : ' hidden') + '><i class="' + (m.type === 'tv' ? 'fa-solid fa-list-ol' : 'fa-regular fa-clock') + '"></i> ' + safe(durationMeta) + '</span>';
                return '<article class="ml-catalog-card' + (homePosterMode ? ' ml-home-poster-card' : '') + '" role="button" tabindex="0" aria-label="' + title + ' detaylarını aç" onclick="openDetailModal(\'' + id + '\')" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();openDetailModal(\'' + id + '\')}">' +
                    '<div class="ml-catalog-poster"><img src="' + safe(m.poster || '') + '" alt="' + title + ' afişi" loading="lazy" onerror="' + (homePosterMode ? 'handleHomePosterError(this)' : "this.onerror=null;this.src=\\'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80\\'") + '">' +
                    '<span class="ml-catalog-type">' + type + '</span><span class="ml-catalog-rating"><i class="fa-solid fa-star"></i> ' + safe(m.imdb || '—') + '</span>' + (containerId === 'hidden-gems-grid' ? '<span class="perde-hidden-gem-badge"><i class="fa-solid fa-gem"></i> GİZLİ CEVHER</span>' : '') +
                    (m.favorite ? '<span class="ml-catalog-favorite"><i class="fa-solid fa-heart"></i></span>' : '') +
                    (homePosterMode ? '<div class="ml-home-poster-gradient"></div>' + posterInfo +
                        '<div class="ml-home-poster-preview" aria-hidden="true"><span class="ml-home-preview-label">KISA ÖNİZLEME</span><p>' + safe(previewText || 'Bu yapım için henüz kısa bir açıklama eklenmemiş.') + '</p></div>' +
                        '<button type="button" class="ml-home-preview-toggle" aria-label="' + title + ' önizlemesini aç" aria-expanded="false" onclick="event.stopPropagation();toggleHomeCardPreview(this)" onkeydown="event.stopPropagation()"><i class="fa-solid fa-eye" aria-hidden="true"></i><span>Önizleme</span></button>' : '') +
                    '<span class="ml-catalog-overlay"><i class="fa-solid fa-arrow-up-right-from-square"></i> DETAYLAR</span></div>' +
                    (homePosterMode ? '' : '<div class="ml-catalog-meta"><h3 title="' + title + '">' + title + '</h3><div class="ml-catalog-sub"><span>' + safe(m.year || '—') + '</span>' +
                    (genres ? '<span class="ml-catalog-separator">•</span><span class="ml-catalog-genre">' + safe(genres) + '</span>' : '') +
                    '</div><div class="ml-catalog-status"><span class="ml-catalog-status-dot ' + (watched ? 'watched' : 'planned') + '"></span>' + (watched ? 'İzlendi' : 'İzleme listesinde') + '</div></div>') +
                    '</article>';
            }).join('');
            if (homePosterMode) {
                list.forEach((movie, index) => {
                    const metaId = 'ml-home-meta-' + containerId + '-' + index;
                    const yearNode = document.getElementById(metaId + '-year');
                    const genreNode = document.getElementById(metaId + '-genres');
                    const durationNode = document.getElementById(metaId + '-duration');
                    const needsMetadata = !movie.year || ['—', 'Bilinmiyor'].includes(String(movie.year).trim()) || !Array.isArray(movie.genres) || !movie.genres.length || !movie.poster || String(movie.poster).includes('unsplash.com') ||
                        (movie.type === 'tv'
                            ? !(Number(movie.number_of_seasons || movie.seasons) && Number(movie.number_of_episodes || movie.episodes))
                            : !movie.runtime || ['Bilinmiyor', 'Süre bilgisi yok', '—'].includes(String(movie.runtime).trim()));
                    if (!needsMetadata) return;
                    loadHomeCardMetadata(movie).then(meta => {
                        if (!meta) return;
                        if (yearNode && meta.year) yearNode.textContent = meta.year;
                        if (genreNode && meta.genres.length) genreNode.textContent = meta.genres.slice(0, 2).join(' · ');
                        if (durationNode) {
                            const label = movie.type === 'tv'
                                ? (meta.seasons ? meta.seasons + ' sezon' : '') +
                                    (meta.seasons && meta.episodes ? ' · ' : '') +
                                    (meta.episodes ? meta.episodes + ' bölüm' : '')
                                : meta.runtime;
                            if (label) {
                                durationNode.innerHTML = '<i class="' + (movie.type === 'tv' ? 'fa-solid fa-list-ol' : 'fa-regular fa-clock') + '"></i> ' + safe(label);
                                durationNode.hidden = false;
                            }
                        }
                    });
                });
            }
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
        const personProfileCache = {};

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
                    return '<button class="perde-person-credit" data-production-id="' + mediaId + '" onclick="openDetailModal(this.dataset.productionId)"><span class="perde-person-credit-title">' + title + '</span><span class="perde-person-credit-meta">' + year + ' · ' + role + '</span><span class="perde-person-credit-score"><i class="fa-solid fa-star"></i> ' + score + '</span></button>';
                }).join('') : '<p class="perde-person-empty">Bu sanatçı için öne çıkan yapım kaydı bulunamadı.</p>';

                content.innerHTML = '<div class="perde-person-profile-head">' +
                    '<img src="' + escapeProviderText(imageUrl) + '" alt="' + safeName + '" class="perde-person-profile-image">' +
                    '<div class="perde-person-profile-intro"><span class="perde-person-department">' + escapeProviderText(department) + '</span><h3>' + safeName + '</h3>' +
                    (facts.length ? '<p class="perde-person-facts">' + facts.map(escapeProviderText).join(' · ') + '</p>' : '') +
                    '<p class="perde-person-biography">' + escapeProviderText(biography) + '</p></div></div>' +
                    '<section class="perde-person-filmography"><div class="perde-person-section-heading"><h4><i class="fa-solid fa-clapperboard"></i> Öne çıkan yapımları</h4><span>' + credits.length + ' yapım</span></div>' +
                    '<div class="perde-person-credit-grid">' + creditMarkup + '</div></section>' +
                    '<p class="perde-person-source">Sanatçı ve filmografi bilgileri TMDB kaynaklıdır.</p>';
                const profileImage = content.querySelector('.perde-person-profile-image');
                if (profileImage) profileImage.onerror = () => { profileImage.src = getAvatarUrl(actorName); };
            } catch (error) {
                console.warn('Sanatçı profili yüklenemedi:', error);
                const local = actorDatabase[actorName];
                const localCredits = movies.filter(movie => movie.cast && movie.cast.some(person => person.name && person.name.toLowerCase() === actorName.toLowerCase()));
                content.innerHTML = '<div class="perde-person-profile-head"><img src="' + getAvatarUrl(actorName) + '" alt="' + safeName + '" class="perde-person-profile-image"><div class="perde-person-profile-intro"><span class="perde-person-department">Sanatçı Profili</span><h3>' + safeName + '</h3><p class="perde-person-biography">' + escapeProviderText((local && local.bio) || 'Çevrimiçi sanatçı bilgisine şu anda ulaşılamıyor.') + '</p></div></div>' +
                    '<section class="perde-person-filmography"><div class="perde-person-section-heading"><h4>Arşivindeki yapımlar</h4></div><div class="perde-person-credit-grid">' +
                    (localCredits.map(movie => '<button class="perde-person-credit" data-production-id="' + escapeProviderText(movie.id) + '" onclick="openDetailModal(this.dataset.productionId)"><span class="perde-person-credit-title">' + escapeProviderText(movie.title) + '</span><span class="perde-person-credit-meta">' + escapeProviderText(movie.year || '') + '</span></button>').join('') || '<p class="perde-person-empty">Arşivinde kayıtlı başka yapım bulunamadı.</p>') +
                    '</div></section>';
            }
        }

        function renderPersonLinks(names) {
            return String(names || 'Bilinmiyor').split(',').map(name => name.trim()).filter(Boolean).map(name => {
                const safe = escapeProviderText(name);
                return '<button type="button" class="perde-person-inline-link" data-person-name="' + safe + '" onclick="openActorBio(this.dataset.personName)">' + safe + '</button>';
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

        function openDetailModal(id, trailerMode = null, popupOnly = false) {
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
                if (!videoId && !popupOnly) window.open(searchUrl, '_blank', 'noopener,noreferrer');
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
                const detailIsInArchive = movies.some(existing =>
                    (existing.tmdbId && m.tmdbId && String(existing.tmdbId) === String(m.tmdbId)) ||
                    existing.id === m.id ||
                    ((existing.title || '').trim().toLocaleLowerCase('tr') === (m.title || '').trim().toLocaleLowerCase('tr') &&
                     String(existing.year || '') === String(m.year || ''))
                );
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
                                ${renderPerdeRatingPanel(m)}
                                <p class="perde-imdb-overview" id="perde-detail-overview">${m.overview || 'Bu yapım için henüz bir konu özeti eklenmemiş.'}</p><div id="perde-detail-series-meta" class="perde-detail-series-meta" hidden></div>
                                <section class="perde-watch-providers" id="perde-watch-providers" aria-live="polite">
                                    <div class="perde-watch-heading"><div><span>NEREDEN İZLENİR?</span><h3>Yayın Platformları</h3></div><span class="perde-watch-region"><i class="fa-solid fa-location-dot"></i> Türkiye</span></div>
                                    <div class="perde-watch-loading"><i class="fa-solid fa-spinner fa-spin"></i> Platform bilgileri yükleniyor…</div>
                                </section>
                                
                                <div class="perde-imdb-actions">
                                    <button type="button" onclick="addToComparison('${m.id}')" class="perde-imdb-action-btn"><i class="fa-solid fa-scale-balanced"></i> Karşılaştırmaya ekle</button>
                                    ${detailIsInArchive ? `<label class="perde-imdb-watch-label">İZLEME LİSTEM<select onchange="updateMovieStatus('${m.id}', this.value)" class="input-field"><option value="watched" ${m.status === 'watched' ? 'selected' : ''}>İzledim</option><option value="watch_later" ${m.status === 'watch_later' ? 'selected' : ''}>İzleyeceğim</option></select></label><button onclick="deleteMovie('${m.id}')" class="perde-imdb-delete"><i class="fa-solid fa-trash"></i> Arşivden sil</button>` : `<button type="button" class="perde-detail-add-to-list" onclick="addSimilarProduction('${m.id}', this)"><i class="fa-solid fa-plus"></i><span>Listeme Ekle</span><small>İzleme listene kaydet</small></button>`}
                                </div>
                                <div class="perde-imdb-cast"><h3>Oyuncular ve ekip</h3><div class="perde-cast-carousel"><button type="button" class="perde-cast-arrow perde-cast-prev" onclick="scrollDetailCast(-1)" aria-label="Önceki oyuncular" hidden><i class="fa-solid fa-chevron-left"></i></button><div class="perde-imdb-cast-grid" id="perde-detail-cast-grid">${(m.cast && m.cast.length > 0) ? m.cast.map((c, idx) => { const imgId = `actor-img-${m.id}-${idx}`; const safeActorName = (c.name || 'Oyuncu').replace(/'/g, "\\'"); return `<button onclick="openActorBio('${safeActorName}')" class="perde-imdb-cast-card"><img id="${imgId}" src="${getAvatarUrl(c.name)}" alt="${c.name || 'Oyuncu'}"><span><b>${c.name || 'Bilinmiyor'}</b><small>${c.role || 'Karakter bilgisi yok'}</small></span></button>`; }).join('') : '<p class="perde-imdb-no-cast">Oyuncu bilgisi bulunmuyor.</p>'}</div><button type="button" class="perde-cast-arrow perde-cast-next" onclick="scrollDetailCast(1)" aria-label="Sonraki oyuncular" hidden><i class="fa-solid fa-chevron-right"></i></button></div></div>
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

                updateDetailCastArrows();
                const castTrack = document.getElementById('perde-detail-cast-grid');
                if (castTrack) castTrack.addEventListener('scroll', updateDetailCastArrows, { passive: true });
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
                updateDetailCastArrows();
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
                                const summary = String(show.summary || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
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


        const PERDE_PROFILE_KEY = 'perde_personal_profile_v1';

        function getPerdeProfileSettings() {
            try { return JSON.parse(localStorage.getItem(PERDE_PROFILE_KEY) || '{}') || {}; }
            catch (error) { return {}; }
        }

        function savePerdeProfileName() {
            const input = document.getElementById('perde-profile-name');
            if (!input) return;
            const settings = getPerdeProfileSettings();
            settings.displayName = String(input.value || '').trim().slice(0, 40);
            localStorage.setItem(PERDE_PROFILE_KEY, JSON.stringify(settings));
            renderPerdeProfile();
            showToast('Profil adı kaydedildi.');
        }

        function renderPerdeProfile() {
            const safe = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
            const settings = getPerdeProfileSettings();
            const name = settings.displayName || 'Benim Sinema Profilim';
            const watched = movies.filter(item => item.status === 'watched');
            const favorites = movies.filter(item => item.favorite);
            const rated = getPerdeRatedMovies();
            const average = rated.length ? (rated.reduce((sum,item)=>sum+Number(item.perdeRating),0)/rated.length).toFixed(1) : '—';
            const genreCounts = {};
            movies.forEach(item => {
                const genres = Array.isArray(item.genres) ? item.genres : (typeof item.genres === 'string' ? item.genres.split(',') : []);
                genres.map(value=>String(value).trim()).filter(Boolean).forEach(genre=>genreCounts[genre]=(genreCounts[genre]||0)+1);
            });
            const topGenre = Object.entries(genreCounts).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'Henüz belirlenmedi';
            const title = document.getElementById('perde-profile-title');
            const nameInput = document.getElementById('perde-profile-name');
            const tagline = document.getElementById('perde-profile-tagline');
            if(title) title.textContent = name;
            if(nameInput && nameInput.value !== name) nameInput.value = settings.displayName || '';
            if(tagline) tagline.textContent = movies.length ? 'Her izleme, koleksiyonunda sana ait bir iz bırakıyor.' : 'Arşivine yapımlar ekledikçe sinema profilin şekillenecek.';
            const highlights = document.getElementById('perde-profile-highlights');
            if(highlights) {
                const items = [
                    {value:movies.length,label:'Koleksiyondaki yapım',icon:'fa-film'},
                    {value:watched.length,label:'İzlenen yapım',icon:'fa-circle-check'},
                    {value:average,label:'Ortalama Perde puanı',icon:'fa-star'},
                    {value:topGenre,label:'En sık tercih ettiğin tür',icon:'fa-masks-theater'}
                ];
                highlights.innerHTML = items.map(item=>'<article><i class="fa-solid '+item.icon+'"></i><strong>'+safe(item.value)+'</strong><span>'+item.label+'</span></article>').join('');
            }
            const topTen = [...watched].sort((a,b)=>(Number.parseFloat(b.imdb)||0)-(Number.parseFloat(a.imdb)||0)||String(a.title).localeCompare(String(b.title),'tr')).slice(0,10);
            const topRoot = document.getElementById('perde-profile-top-ten');
            if(topRoot) topRoot.innerHTML = topTen.length ? topTen.map((item,index)=>'<button type="button" class="perde-profile-top-card" onclick="openDetailModal(\''+String(item.id).replace(/'/g,'')+'\')"><span class="perde-profile-rank">'+String(index+1).padStart(2,'0')+'</span><img src="'+safe(item.poster||'')+'" alt="'+safe(item.title)+' afişi" loading="lazy" onerror="this.style.visibility=\'hidden\'"><span class="perde-profile-top-copy"><b>'+safe(item.title)+'</b><small>'+safe(item.year||'Yıl bilinmiyor')+' · '+(item.type==='tv'?'Dizi':item.type==='doc'?'Belgesel':'Film')+'</small><em>'+'★ IMDb '+safe(item.imdb||'—')+'</em></span></button>').join('') : '<p class="perde-profile-empty">Henüz izlediğin yapım yok. İzleme durumunu İzlendi olarak işaretlediğin yapımlar burada IMDb puanına göre sıralanacak.</p>';
            const count = document.getElementById('perde-profile-favorite-count');
            if(count) count.textContent = favorites.length+' yapım';
            const favoriteRoot = document.getElementById('perde-profile-favorites');
            if(favoriteRoot) favoriteRoot.innerHTML = favorites.length ? [...favorites].sort((a,b)=>String(a.title).localeCompare(String(b.title),'tr')).map(item=>'<button type="button" class="perde-profile-favorite-card" onclick="openDetailModal(\''+String(item.id).replace(/'/g,'')+'\')"><img src="'+safe(item.poster||'')+'" alt="'+safe(item.title)+' afişi" loading="lazy" onerror="this.style.visibility=\'hidden\'"><span><b>'+safe(item.title)+'</b><small>'+safe(item.year||'')+'</small></span></button>').join('') : '<p class="perde-profile-empty">Favori koleksiyonun henüz boş.</p>';
            renderPerdeAchievements();
        }

        function renderPerdeAchievements() {
            const root = document.getElementById('perde-achievements');
            const countRoot = document.getElementById('perde-achievement-count');
            if (!root) return;
            const watched = movies.filter(item => item.status === 'watched');
            const favorites = movies.filter(item => item.favorite);
            const rated = getPerdeRatedMovies();
            const genres = new Set();
            watched.forEach(item => {
                const values = Array.isArray(item.genres) ? item.genres : (typeof item.genres === 'string' ? item.genres.split(',') : []);
                values.map(value => String(value).trim().toLocaleLowerCase('tr')).filter(Boolean).forEach(value => genres.add(value));
            });
            const definitions = [
                {id:'first-watch',title:'İlk Perde',description:'İlk yapımını izledin.',icon:'fa-play',value:watched.length,target:1,unit:'yapım'},
                {id:'watch-10',title:'İlk 10',description:'10 farklı yapımı izleme listene değil, geçmişine ekledin.',icon:'fa-film',value:watched.length,target:10,unit:'yapım'},
                {id:'watch-25',title:'Sinema Tutkunu',description:'25 yapımı izledin.',icon:'fa-ticket',value:watched.length,target:25,unit:'yapım'},
                {id:'watch-50',title:'Perde Müdavimi',description:'50 yapımı izledin.',icon:'fa-clapperboard',value:watched.length,target:50,unit:'yapım'},
                {id:'watch-100',title:'Yüzler Kulübü',description:'100 yapımı izledin.',icon:'fa-crown',value:watched.length,target:100,unit:'yapım'},
                {id:'genre-5',title:'Tür Kaşifi',description:'İzlediklerinde 5 farklı tür keşfettin.',icon:'fa-compass',value:genres.size,target:5,unit:'tür'},
                {id:'collection-10',title:'Koleksiyoner',description:'Arşivine 10 yapım ekledin.',icon:'fa-box-archive',value:movies.length,target:10,unit:'yapım'},
                {id:'favorite-10',title:'Seçici Göz',description:'10 yapımı favorilerine ekledin.',icon:'fa-heart',value:favorites.length,target:10,unit:'favori'},
                {id:'rating-1',title:'Eleştirmen',description:'İlk Perde puanını verdin.',icon:'fa-star',value:rated.length,target:1,unit:'puan'},
                {id:'rating-10',title:'Puan Ustası',description:'10 yapımı kendi puanınla değerlendirdin.',icon:'fa-award',value:rated.length,target:10,unit:'puan'}
            ];
            const unlocked = definitions.filter(item => item.value >= item.target).length;
            if (countRoot) countRoot.textContent = unlocked + ' / ' + definitions.length + ' rozet';
            root.innerHTML = definitions.map(item => {
                const earned = item.value >= item.target;
                return '<article class="perde-achievement-card ' + (earned ? 'is-earned' : 'is-locked') + '" title="' + item.description + ' · ' + (earned ? 'Kazanıldı' : item.value + ' / ' + item.target + ' ' + item.unit) + '" aria-label="' + item.title + ': ' + (earned ? 'Kazanıldı' : item.value + ' / ' + item.target + ' ' + item.unit) + '">' +
                    '<span class="perde-achievement-icon"><i class="fa-solid ' + item.icon + '"></i></span>' +
                    '<strong class="perde-achievement-name">' + item.title + '</strong>' +
                    (earned ? '<i class="fa-solid fa-circle-check perde-achievement-status" aria-label="Kazanıldı"></i>' : '') +
                    '</article>';
            }).join('');
        }

        async function sharePerdeProfile() {
            const settings = getPerdeProfileSettings();
            const favorites = movies.filter(item=>item.favorite);
            const watched = movies.filter(item=>item.status==='watched');
            const rated = getPerdeRatedMovies();
            const average = rated.length ? (rated.reduce((sum,item)=>sum+Number(item.perdeRating),0)/rated.length).toFixed(1) : 'Henüz puan yok';
            const genres = {};
            movies.forEach(item=>(Array.isArray(item.genres)?item.genres:(typeof item.genres==='string'?item.genres.split(','):[])).forEach(g=>{const key=String(g).trim();if(key)genres[key]=(genres[key]||0)+1;}));
            const favoriteGenre = Object.entries(genres).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'Belirlenmedi';
            const summary = '🎬 '+(settings.displayName||'Benim Sinema Profilim')+' · Perde\n'+movies.length+' yapım koleksiyonumda · '+watched.length+' izlenen · '+favorites.length+' favori\nOrtalama Perde puanım: '+average+'\nEn sık tercih ettiğim tür: '+favoriteGenre+'\n\nKişisel sinema arşivimden.';
            if(navigator.share) {
                try { await navigator.share({title:'Perde · Sinema Profilim',text:summary}); }
                catch(error) { if(error && error.name!=='AbortError') showToast('Paylaşım açılamadı.'); }
            } else if(navigator.clipboard && navigator.clipboard.writeText) {
                try { await navigator.clipboard.writeText(summary); showToast('Profil özeti panoya kopyalandı.'); }
                catch(error) { showToast('Kopyalama başarısız oldu.'); }
            } else {
                window.prompt('Profil özetini kopyala:',summary);
            }
        }

        function getPerdeWatchSessions(item) {
            const history = Array.isArray(item.watchHistory) ? item.watchHistory : [];
            const valid = history.map(entry => entry && entry.date ? String(entry.date).slice(0, 10) : '').filter(date => /^\d{4}-\d{2}-\d{2}$/.test(date));
            if (valid.length) return valid;
            return item.watchedAt && /^\d{4}-\d{2}-\d{2}/.test(String(item.watchedAt))
                ? [String(item.watchedAt).slice(0, 10)] : [];
        }

        function renderYearInReview() {
            const root = document.getElementById('perde-year-review');
            const select = document.getElementById('perde-year-select');
            if (!root || !select) return;
            const currentYear = new Date().getFullYear();
            const availableYears = new Set([currentYear]);
            movies.forEach(item => getPerdeWatchSessions(item).forEach(date => availableYears.add(Number(date.slice(0, 4)))));
            const years = [...availableYears].filter(Number.isFinite).sort((a,b) => b-a);
            const selectedYear = years.includes(Number(select.value)) ? Number(select.value) : currentYear;
            const heading = document.getElementById('perde-year-heading-title');
            if (heading) heading.textContent = selectedYear + ' Sinema Özetin';
            select.innerHTML = years.map(year => '<option value="' + year + '"' + (year === selectedYear ? ' selected' : '') + '>' + year + '</option>').join('');

            const sessions = [];
            movies.forEach(item => getPerdeWatchSessions(item).forEach(date => {
                if (Number(date.slice(0, 4)) === selectedYear) sessions.push({ item, date });
            }));
            const uniqueItems = [...new Map(sessions.map(entry => [String(entry.item.id), entry.item])).values()];
            const totalMinutes = sessions.reduce((sum, entry) => {
                const match = String(entry.item.runtime || '').match(/(\d+)\s*(?:dk|min(?:ute)?s?)/i);
                return sum + (match ? Number(match[1]) : 0);
            }, 0);
            const duration = totalMinutes
                ? (Math.floor(totalMinutes / 60) ? Math.floor(totalMinutes / 60) + ' sa ' : '') + (totalMinutes % 60 ? totalMinutes % 60 + ' dk' : '')
                : 'Süre bilgisi yok';
            const genreCounts = {};
            uniqueItems.forEach(item => {
                const genres = Array.isArray(item.genres) ? item.genres : (typeof item.genres === 'string' ? item.genres.split(',') : []);
                genres.map(value => String(value).trim()).filter(Boolean).forEach(genre => genreCounts[genre] = (genreCounts[genre] || 0) + 1);
            });
            const topGenre = Object.entries(genreCounts).sort((a,b) => b[1]-a[1])[0];
            const kpis = [
                { label:'İzleme seansı', value:sessions.length, icon:'fa-play' },
                { label:'Farklı yapım', value:uniqueItems.length, icon:'fa-film' },
                { label:'Toplam izleme süresi', value:duration, icon:'fa-clock' },
                { label:'En çok izlenen tür', value:topGenre ? topGenre[0] : '—', icon:'fa-masks-theater' }
            ];
            const safe = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
            const ranked = [...uniqueItems].sort((a,b) => {
                const countA = sessions.filter(entry => String(entry.item.id) === String(a.id)).length;
                const countB = sessions.filter(entry => String(entry.item.id) === String(b.id)).length;
                return countB-countA || (Number(b.imdb)||0)-(Number(a.imdb)||0);
            }).slice(0,5);
            root.innerHTML = '<div class="perde-year-kpis">' + kpis.map(item => '<article><span><i class="fa-solid '+item.icon+'"></i></span><small>'+item.label+'</small><strong>'+safe(item.value)+'</strong></article>').join('') + '</div>' +
                (sessions.length
                    ? '<div class="perde-year-ranking"><div class="perde-year-subhead"><div><span>YILIN SEÇKİSİ</span><h3>En çok izlediklerin</h3></div><small>'+uniqueItems.length+' farklı yapım</small></div><div class="perde-year-list">'+ranked.map((item,index) => {
                        const count = sessions.filter(entry => String(entry.item.id) === String(item.id)).length;
                        return '<button type="button" class="perde-year-item" onclick="openDetailModal(\''+String(item.id).replace(/'/g,'')+'\')"><b class="perde-year-rank">'+String(index+1).padStart(2,'0')+'</b><img src="'+safe(item.poster||'')+'" alt="'+safe(item.title)+' afişi" loading="lazy" onerror="this.style.visibility=\'hidden\'"><span><strong>'+safe(item.title)+'</strong><small>'+safe(item.year||'')+' · '+(item.type==='tv'?'Dizi':item.type==='doc'?'Belgesel':'Film')+'</small></span><em>'+count+' kez</em></button>';
                    }).join('')+'</div>'
                    : '<div class="perde-year-empty"><i class="fa-regular fa-calendar"></i><strong>'+selectedYear+' için tarihli izleme kaydı bulunamadı.</strong><span>Yapımları “İzlendi” olarak işaretlediğinde yıllık özetin burada oluşur.</span></div>');
            const shareButton = document.getElementById('perde-year-share');
            if (shareButton) shareButton.disabled = sessions.length === 0;
            window.perdeYearSummary = sessions.length ? {
                year:selectedYear, sessions:sessions.length, titles:uniqueItems.length, duration,
                topGenre:topGenre ? topGenre[0] : 'Belirlenmedi',
                topTitles:ranked.map(item => item.title)
            } : null;
        }

        async function sharePerdeYearReview() {
            const summary = window.perdeYearSummary;
            if (!summary) { showToast('Paylaşılacak yıllık özet bulunamadı.'); return; }
            const message = '🎬 Perde · '+summary.year+' Sinema Özetim\n'+summary.sessions+' izleme seansı · '+summary.titles+' farklı yapım\nİzleme süresi: '+summary.duration+'\nEn çok izlediğim tür: '+summary.topGenre+'\nYılın seçkisi: '+summary.topTitles.join(', ');
            if (navigator.share) {
                try { await navigator.share({ title:'Perde · '+summary.year+' Sinema Özeti', text:message }); }
                catch (error) { if (error && error.name !== 'AbortError') showToast('Paylaşım açılamadı.'); }
            } else if (navigator.clipboard && navigator.clipboard.writeText) {
                try { await navigator.clipboard.writeText(message); showToast('Yıllık özet panoya kopyalandı.'); }
                catch (error) { showToast('Kopyalama başarısız oldu.'); }
            } else {
                window.prompt('Yıllık özetini kopyala:', message);
            }
        }

        function renderPersonalStats() {
            const safe = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
            const watched = movies.filter(item => item.status === 'watched');
            const watchLater = movies.filter(item => item.status === 'watch_later');
            const favorites = movies.filter(item => item.favorite);
            const rated = getPerdeRatedMovies();
            const averageRating = rated.length
                ? (rated.reduce((sum, item) => sum + Number(item.perdeRating), 0) / rated.length).toFixed(1)
                : '—';
            const totalMinutes = watched.reduce((sum, item) => {
                if (item.type === 'tv') return sum;
                const runtime = String(item.runtime || '');
                const match = runtime.match(/(\d+)\s*(?:dk|min(?:ute)?s?)/i);
                return sum + (match ? Number(match[1]) : 0);
            }, 0);
            const durationLabel = totalMinutes
                ? (Math.floor(totalMinutes / 60) ? Math.floor(totalMinutes / 60) + ' sa ' : '') + (totalMinutes % 60 ? (totalMinutes % 60) + ' dk' : '')
                : '—';
            const filmCount = movies.filter(item => item.type !== 'tv' && item.type !== 'doc').length;
            const seriesCount = movies.filter(item => item.type === 'tv').length;
            const documentaryCount = movies.filter(item => item.type === 'doc').length;
            const kpis = [
                {label:'Toplam koleksiyon',value:movies.length,detail:filmCount+' film · '+seriesCount+' dizi · '+documentaryCount+' belgesel',icon:'fa-layer-group',tone:'blue'},
                {label:'İzlenen yapım',value:watched.length,detail:'Arşivinde izledim olarak işaretli',icon:'fa-circle-check',tone:'green'},
                {label:'İzleme listesi',value:watchLater.length,detail:'İzlemeyi bekleyen yapımlar',icon:'fa-bookmark',tone:'amber'},
                {label:'Ortalama Perde Puanı',value:averageRating,detail:rated.length+' yapım puanlandı',icon:'fa-star',tone:'violet'},
                {label:'İzlenen yapım süresi',value:durationLabel,detail:'Dizi süreleri hariç, kayıtlı süreler üzerinden',icon:'fa-clock',tone:'cyan'},
                {label:'Favoriler',value:favorites.length,detail:'Favorilerine eklediğin yapımlar',icon:'fa-heart',tone:'rose'}
            ];
            const kpiRoot=document.getElementById('personal-stats-kpis');
            if(kpiRoot) kpiRoot.innerHTML=kpis.map(item=>'<article class="perde-stats-kpi perde-stats-'+item.tone+'"><span class="perde-stats-kpi-icon"><i class="fa-solid '+item.icon+'"></i></span><span class="perde-stats-kpi-label">'+item.label+'</span><strong>'+item.value+'</strong><small>'+item.detail+'</small></article>').join('');

            const genreCounts={};
            movies.forEach(item=>{
                const genres=Array.isArray(item.genres)?item.genres:(typeof item.genres==='string'?item.genres.split(','):[]);
                genres.map(g=>String(g).trim()).filter(Boolean).forEach(genre=>genreCounts[genre]=(genreCounts[genre]||0)+1);
            });
            const topGenres=Object.entries(genreCounts).sort((a,b)=>b[1]-a[1]).slice(0,5);
            const genreRoot=document.getElementById('stats-top-genres');
            if(genreRoot) genreRoot.innerHTML=topGenres.length?topGenres.map(([name,count])=>'<span><b>'+safe(name)+'</b><small>'+count+' yapım</small></span>').join(''):'<p class="perde-stats-empty">Tür bilgisi bulunan yapım yok.</p>';

            const topRated=[...rated].sort((a,b)=>Number(b.perdeRating)-Number(a.perdeRating)||String(a.title).localeCompare(String(b.title),'tr')).slice(0,5);
            const rankingRoot=document.getElementById('stats-top-rated');
            if(rankingRoot) rankingRoot.innerHTML=topRated.length?topRated.map((item,index)=>'<button type="button" class="perde-stats-rank-item" onclick="openDetailModal(\''+String(item.id).replace(/'/g,'')+'\')"><span class="perde-stats-rank-number">'+(index+1)+'</span><img src="'+safe(item.poster||'')+'" alt="" loading="lazy" onerror="this.style.visibility=\'hidden\'"><span class="perde-stats-rank-copy"><b>'+safe(item.title)+'</b><small>'+safe(item.year||'Yıl bilinmiyor')+' · '+(item.type==='tv'?'Dizi':item.type==='doc'?'Belgesel':'Film')+'</small></span><strong>'+Number(item.perdeRating).toFixed(1)+'</strong></button>').join(''):'<p class="perde-stats-empty">Henüz Perde Puanı verdiğin bir yapım yok. Bir yapımı puanladığında burada görünecek.</p>';

            const now=new Date();
            const monthKeys=[];
            const monthLabels=[];
            for(let offset=11;offset>=0;offset--){
                const date=new Date(now.getFullYear(),now.getMonth()-offset,1);
                monthKeys.push(date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0'));
                monthLabels.push(date.toLocaleDateString('tr-TR',{month:'short'}));
            }
            const monthlyCounts=Object.fromEntries(monthKeys.map(key=>[key,0]));
            movies.forEach(item=>{
                const history=Array.isArray(item.watchHistory)?item.watchHistory:[];
                const dates=history.map(entry=>entry&&entry.date).filter(Boolean);
                if(!dates.length&&item.watchedAt) dates.push(item.watchedAt);
                dates.forEach(dateValue=>{
                    const match=String(dateValue).match(/^(\d{4})-(\d{2})/);
                    if(match){
                        const key=match[1]+'-'+match[2];
                        if(Object.prototype.hasOwnProperty.call(monthlyCounts,key)) monthlyCounts[key]++;
                    }
                });
            });
            const label=document.getElementById('stats-updated-label');
            if(label) label.textContent='Son güncelleme: '+now.toLocaleDateString('tr-TR');
            return {genreCounts,monthlyCounts,monthLabels,watchedCount:watched.length,watchLaterCount:watchLater.length,favoriteCount:favorites.length};
        }

        function renderCharts() {
            const isDark = document.documentElement.classList.contains('dark');
            const textColor = isDark ? '#F8FAFC' : '#0F172A';
            const stats = renderPersonalStats();
            renderYearInReview();
            const labels = Object.keys(stats.genreCounts);
            const dataValues = Object.values(stats.genreCounts);

            const ctx1 = document.getElementById('genreDoughnutChart')?.getContext('2d');
            if (ctx1) {
                if (genreChartInstance) genreChartInstance.destroy();
                genreChartInstance = new Chart(ctx1, {
                    type: 'doughnut',
                    data: { labels: labels.length ? labels : ['Henüz tür verisi yok'], datasets: [{ data: labels.length ? dataValues : [1], backgroundColor: labels.length ? ['#3B82F6','#10B981','#F59E0B','#F43F5E','#8B5CF6','#EC4899','#6366F1','#14B8A6'] : ['#94A3B8'], borderWidth: 0 }] },
                    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: textColor, font: { family: 'Plus Jakarta Sans', size: 11 } } }, tooltip: { enabled: labels.length > 0 } } }
                });
            }

            const ctx2 = document.getElementById('statusBarChart')?.getContext('2d');
            if (ctx2) {
                if (statusChartInstance) statusChartInstance.destroy();
                statusChartInstance = new Chart(ctx2, {
                    type: 'bar',
                    data: { labels: ['İzlenenler','İzlenecekler','Favoriler'], datasets: [{ data: [stats.watchedCount,stats.watchLaterCount,stats.favoriteCount], backgroundColor: ['#10B981','#F59E0B','#F43F5E'], borderRadius: 8 }] },
                    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: textColor } }, y: { beginAtZero: true, ticks: { color: textColor, precision: 0 } } } }
                });
            }

            const ctx3=document.getElementById('monthlyWatchChart')?.getContext('2d');
            if(ctx3){
                if(monthlyWatchChartInstance) monthlyWatchChartInstance.destroy();
                monthlyWatchChartInstance=new Chart(ctx3,{
                    type:'line',
                    data:{labels:stats.monthLabels,datasets:[{label:'İzleme kaydı',data:Object.values(stats.monthlyCounts),borderColor:'#8B5CF6',backgroundColor:'rgba(139,92,246,.14)',fill:true,tension:.35,pointRadius:3,pointHoverRadius:5}]},
                    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:textColor}},y:{beginAtZero:true,ticks:{color:textColor,precision:0}}}}
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
