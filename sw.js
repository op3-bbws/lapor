const CACHE_NAME = 'bbws-brantas-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './home.html',
  './kamera.html',
  './peta.html',
  './verifikasi.html',
  './raport.html',
  './profile.html',
  './assets/css/style.css',
  './assets/js/supabase.js',
  './assets/img/logo-bbws.svg',
  // Tambahkan gambar/ikon lain di sini jika perlu
];

// 1. Install Service Worker & Simpan File ke Cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Menyimpan file aplikasi ke cache...');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. Aktifkan Service Worker & Hapus Cache Lama
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Menghapus cache lama:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 3. Strategi Fetch (Ambil dari Cache jika Offline)
self.addEventListener('fetch', (event) => {
  // Jangan cache request ke Supabase atau GAS (harus online)
  if (event.request.url.includes('supabase.co') || event.request.url.includes('script.google.com')) {
    return; 
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Kembalikan dari cache jika ada, jika tidak ambil dari internet
      return response || fetch(event.request).catch(() => {
        // Jika offline dan file tidak ada di cache, biarkan gagal (atau tampilkan halaman offline)
      });
    })
  );
});