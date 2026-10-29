# My Library

Kişisel film, dizi ve belgesel arşivi. Bir yayın/streaming servisi değildir; izleme geçmişini, izleme listenizi ve favorilerinizi tek yerde düzenlemek için tasarlanmıştır.

## Özellikler

- Film, dizi ve belgesel kayıtları
- İzlediklerim, izleyeceklerim ve favorilerim
- Başlık arama, filtreleme ve sıralama
- Yapım detayları, yönetmen, oyuncular, tür ve puan bilgileri
- Fragman bağlantıları ve oyuncu profilleri
- İstatistikler ve tür grafikleri
- JSON arşivini dışa aktarma ve yedekten içe aktarma
- Açık ve koyu tema
- Masaüstü, tablet ve mobil ekranlara uyumlu arayüz

## Çalıştırma

Bu proje HTML, CSS ve Vanilla JavaScript ile hazırlanmıştır; paket kurulum adımı gerektirmez.

1. Depoyu klonlayın veya ZIP olarak indirin.
2. `index.html` dosyasını bir statik web sunucusu üzerinden açın. Örneğin VS Code Live Server kullanılabilir.
3. Katalog araması için uygulamadaki TMDb bağlantısının geçerli bir API anahtarıyla yapılandırılmış olması gerekir.

Uygulama Tailwind CSS, Font Awesome, Chart.js ve Google Fonts gibi bazı bağımlılıkları CDN üzerinden yükler; bu nedenle ilk açılışta internet bağlantısı gerekir.

## Veri saklama ve yedekleme

- Arşiv verileri tarayıcının `localStorage` alanında saklanır.
- Veriler otomatik olarak hesaplar veya cihazlar arasında eşitlenmez.
- Tarayıcı verilerini silmek arşivi silebilir. Düzenli olarak Yönetim bölümünden JSON yedeği indirin.
- Yedeği geri yüklemek mevcut arşivin üzerine yazar. Geri yüklemeden önce mevcut arşivinizin yedeğini alın.
- Arşiv verisi için kullanılan mevcut anahtar `perde_movies_archive_v1` olduğundan, marka değişikliği mevcut yerel kayıtları ayrı bir anahtara taşımayı gerektirmez.

## Güvenlik notları

- Tarayıcıda çalışan bir uygulamada JavaScript dosyasına yazılmış API anahtarı gizli değildir. TMDb anahtarını sağlayıcı panelinde yenileyin/kısıtlayın ve herkese açık depolarda ayrıcalıklı ya da özel anahtar bulundurmayın. Bu statik uygulama, kendi başına sunucu tarafında sır saklayamaz.
- Yönetim ekranındaki parola kontrolü yalnızca bu tarayıcıdaki arayüzü kilitleyen istemci tarafı bir kontroldür; gerçek kimlik doğrulama veya erişim güvenliği değildir. Uygulamayı çok kullanıcılı ya da hassas verili bir hizmet olarak kullanmayın.
- Yalnızca güvendiğiniz JSON yedeklerini içe aktarın. Uygulama, içe aktarılan arşiv için temel biçim kontrolü yapar.

## Geliştirme kontrolleri

GitHub Actions, Pull Request'lerde ve `main` dalına gönderimlerde şu kontrolleri çalıştırır:

- `js/app.js` JavaScript sözdizimi denetimi
- Temel HTML öğeleri ve özellik fonksiyonları için statik smoke testleri
- Yerel arşiv anahtarı, tema uyumluluğu ve mobil/açık-koyu tema kurallarının varlık kontrolü

Bu kontroller statik doğrulamadır; gerçek tarayıcıda tüm kullanıcı akışlarının uçtan uca test edildiği anlamına gelmez.
