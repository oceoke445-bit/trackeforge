# Traxon

Dasbor intelijen armada untuk memantau personel, senjata, komunikasi, dan geofence. Aplikasi ini berjalan di Next.js App Router. Data yang tampil masih data demo di kode, belum terhubung ke backend.

## Menjalankan

Perlu Node.js dan npm.

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000). Halaman login muncul jika belum ada sesi. Setelah masuk, aplikasi membuka Command Overview.

Perintah lain:

- `npm run build` — build produksi
- `npm start` — jalankan hasil build
- `npm run lint` — ESLint
- `npm run maplibre:worker` — salin worker MapLibre ke `public/vendor/maplibre/`

`npm run dev` dan `npm run build` sudah menyalin worker itu lewat skrip `predev` dan `prebuild`.

## Masuk

Login menerima username atau email. Sesi disimpan di `sessionStorage` dengan kunci `traxon-session`. Keluar dari menu pengguna di header menghapus sesi dan kembali ke `/login`.

Kunjungan ke `/` saat sudah masuk diarahkan ke `/overview`. Kunjungan tanpa sesi diarahkan ke `/login`.

## Menu

| Grup | Halaman | Rute |
| --- | --- | --- |
| Dashboard | Overview | `/overview` |
| Dashboard | Groups | `/groups` |
| Dashboard | Personal | `/personal` |
| Dashboard | Weapons | `/weapons` |
| Communication | LoRa Mesh | `/lora-mesh` |
| Communication | Gateways | `/gateways` |
| Monitoring | Alerts | `/alerts` |
| Monitoring | History | `/groups/history` |
| Monitoring | Geofences | `/groups/geofence` |
| Administration | User Access | `/user-access` |
| Administration | Activity Log | `/activity-log` |
| Administration | Settings | `/settings` |

Notifikasi ada di `/notifications` lewat ikon lonceng di header, bukan dari sidebar.

### Yang ditampilkan tiap halaman

- **Overview** memuat kartu ringkasan, peta personel, peringatan aktif, aktivitas langsung, tabel personel, dan ringkasan kesehatan. Kartu detail di peta hanya muncul setelah satu data diklik. Klik data yang sama lagi, atau klik area peta yang kosong, untuk menutupnya.
- **Groups** memuat pilih grup, peta area, informasi grup, kesehatan grup, dan tabel personel dengan pagination.
- **Personal** memuat profil, peta, status, tanda vital, peralatan, dan kejadian terbaru. Tinggi kartu profil dan peta tetap, tidak berubah saat ganti orang.
- **Weapons** memuat kartu status senjata, peta, dan daftar senjata.
- **LoRa Mesh** dan **Gateways** memuat status jaringan. Halaman ini menggulung bersama jendela, bukan panel dalam.
- **Alerts** terkunci setinggi layar. Filter dan tabel ada dalam satu kartu. Panel detail tidak punya scrollbar sendiri.
- **History** memuat jejak kejadian grup.
- **Geofences** memuat kartu statistik, peta zona, panel buat geofence, dan daftar dengan pagination. Peta menampilkan area poligon beserta ikon di tengah zona.
- **User Access** memuat registri identitas, peran, dan otoritas. Formulir tambah membuka modal.
- **Activity Log** memuat jejak aksi pengguna.
- **Settings** hanya bagian General yang aktif. Menu lain tetap terlihat, redup, dan tidak bisa diklik.

## Peta

Peta memakai MapLibre GL JS. Worker diambil dari `/vendor/maplibre/`. Atribusi Esri dimatikan di peta utama.

Mode peta di Overview: Terrain, Satellite, dan Dark. Zoom in dan zoom out tetap ada. Di Overview, chip status Online, Alert, dan Offline sudah dihilangkan.

Batas garis putus-putus hijau di peta Groups dan Weapons tidak ditampilkan. Isi area tetap ada. Di Geofences, batas area dan ikon zona tetap ditampilkan.

`feature-state` tidak dipakai pada properti layout MapLibre seperti `icon-size` atau `icon-image`. Ekspresi data seperti `["get", "status"]` boleh di layout. `line-dasharray` adalah properti paint.

## Tampilan

Tema disimpan di `localStorage` dengan kunci `traxon-theme`. Nilainya `blue` atau `gray`. Tema biru adalah tampilan yang dipakai. Pengalih tema di header dan di halaman login sedang tidak ditampilkan. Di Settings, Dark mengikuti tema biru, Light mengikuti abu-abu, dan System mengikuti `prefers-color-scheme` sekali.

Judul setiap menu memakai kelas `page-title`: ikon 28px, judul 16px, dan keterangan 11px. Jarak kiri-kanan isi halaman 14px. Jarak dari header ke judul 8px.

## Struktur folder

- `src/app/layout.tsx` — layout akar, metadata, dan font Inter
- `src/app/globals.css` — gaya global dan impor Tailwind CSS v4
- `src/app/login/` — halaman masuk
- `src/app/(platform)/` — rute dasbor; tiap modul menyimpan komponen di `components/`
- `src/components/` — kerangka: `Layout.tsx`, `Sidebar.tsx`, `TopHeader.tsx`
- `src/components/map/` — peta bersama, termasuk `traxon-map.tsx`
- `src/components/data/` — data demo navigasi
- `src/lib/` — sesi, tema, dan state sidebar
- `public/images/` — gambar statis
- `public/vendor/maplibre/` — worker MapLibre, dibuat oleh skrip salin

Grup rute `(platform)` tidak muncul di URL.

Komponen halaman diekspor sebagai default export. String yang berisi apostrof memakai kutip ganda, misalnya `"We're here to help"`.

## Dependensi

- Next.js 16, React 19, dan React DOM 19
- Tailwind CSS v4 lewat `@tailwindcss/postcss`
- MapLibre GL JS
- TypeScript 5.7 dan ESLint

Tailwind diimpor di `src/app/globals.css` dengan `@import "tailwindcss";`. Font Inter dimuat di `src/app/layout.tsx` dengan bobot 400, 500, 600, dan 700.
