# LW-link UI Design System

Panduan ini menjelaskan arah visual dashboard LW-link dan cara menerapkannya pada struktur frontend yang sudah ada. Token dan pola dashboard di bawah sudah diterapkan; item checklist menandai pekerjaan lanjutan yang belum tersedia.

## Scope dan struktur saat ini

| Area                             | Lokasi                                             | Tanggung jawab                                                                   |
| -------------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------- |
| App shell                        | `src/frontend/components/layout/Layout.tsx`        | Header, kontainer halaman, dan footer untuk area aplikasi.                       |
| Dashboard shell                  | `src/frontend/pages/dashboard/DashboardLayout.tsx` | Navigasi samping, widget profil/QR, pemuatan data dashboard, dan outlet halaman. |
| Overview                         | `src/frontend/pages/dashboard/OverviewPage.tsx`    | Ringkasan metrik dan quick actions.                                              |
| Public profile                   | `src/frontend/pages/public/PublicProfilePage.tsx`  | Halaman profil full-bleed pada `/:username` (URL kanonis: `/@username`).         |
| Global tokens dan komponen dasar | `src/frontend/styles/globals.css`                  | Token CSS semantik dan kelas `.btn`, `.card`, serta `.input`.                    |
| Tailwind                         | `tailwind.config.js`                               | Ekstensi warna, font, animasi, radius, dan shadow. Konfigurasi memakai ESM.      |

Pertahankan API, state, tracking analytics, routing, dan RBAC yang telah ada. Perubahan desain dashboard seharusnya berada di komponen frontend di atas.

## Arah visual

Gunakan gaya modern-retro yang tetap minimal: latar off-white, permukaan terang, kontras teks yang kuat, dan aksen warna secukupnya. Dashboard adalah area kerja; public profile tetap merupakan halaman link-in-bio yang ringan dan tidak mewarisi header, footer, atau container dashboard.

### Palette usulan

| Token konseptual | Nilai     | Penggunaan                                                                       |
| ---------------- | --------- | -------------------------------------------------------------------------------- |
| `retro.teal`     | `#31AAA9` | State aktif, focus ring, dan indikator progres.                                  |
| `retro.cream`    | `#F8E0A4` | Aksen permukaan atau badge berkontras tinggi.                                    |
| `retro.red`      | `#A82020` | Aksen penting dan status yang membutuhkan perhatian; bukan warna default tombol. |
| `retro.wine`     | `#6C1A1A` | Heading atau CTA gelap dengan penggunaan terbatas.                               |
| `retro.bg`       | `#FAF7F2` | Latar halaman dashboard.                                                         |
| `retro.border`   | `#E8D8C8` | Border dan divider halus.                                                        |

Gunakan token semantik yang sudah tersedia (`background`, `foreground`, `primary`, `card`, `muted`, `accent`, dan `border`) untuk komponen umum. Token `retro.*` hanya dipakai saat warna brand memang diperlukan; jangan mengganti seluruh semantic token sekaligus tanpa audit kontras dan dark mode.

## Dashboard layout

### Navigasi samping

`DashboardLayout.tsx` sudah menyediakan:

- Overview, Links, Profile, dan Analytics untuk semua pengguna terautentikasi.
- Users untuk `admin` dan `super_admin`; Audit Logs untuk `super_admin`.
- Role badge, logout, status publikasi, QR code, dan tautan ke profil publik.

Penyempurnaan visual yang aman:

- Pertahankan `NavLink` dan kondisi role yang ada.
- Gunakan satu warna active state (`bg-primary` atau token retro yang telah ditetapkan), dengan teks yang memenuhi kontras.
- Jaga padding target sentuh minimal nyaman pada mobile dan hindari sidebar berlebar tetap di viewport kecil.
- Jangan menambahkan menu, notifikasi, atau pencarian global sebelum ada kebutuhan dan data flow yang jelas.

### Overview

Overview yang ada menggunakan grid responsif dua kolom pada layar kecil dan empat kolom pada `lg`. Empat metriknya adalah Links, Views, Clicks, dan status Published/Draft. Perubahan tampilan sebaiknya tetap memakai data dari `useDashboardContext()`.

| Bagian             | Status saat ini                            | Arah UI                                                                                                      |
| ------------------ | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Metrik             | Empat `.card` pada grid responsif          | Bedakan hierarki tipografi dan gunakan satu kartu aksen bila diperlukan.                                     |
| Quick actions      | Manage links, Edit profile, View analytics | Pertahankan target navigasi yang ada; hanya ubah presentasi.                                                 |
| Grafik/top links   | Belum ada pada overview                    | Tambahkan hanya setelah sumber data dan library chart dipilih; proyek belum memasang Chart.js atau Recharts. |
| Live phone preview | Belum ada                                  | Jika diperlukan, turunkan dari data profil/link aktual—jangan hard-code atau menggandakan state.             |

## Public profile

Public profile memiliki sistem palet tersendiri di `src/frontend/utils/theme.ts`. Halaman menggunakan `getThemeTokens()` untuk latar, teks, border, ikon, dan shadow berdasarkan palet profil. Jangan menerapkan palette dashboard ke halaman ini secara global, karena itu akan menimpa personalisasi profil pengguna.

Aturan visual public profile:

- Tetap full-bleed tanpa `Layout`, header, atau footer aplikasi.
- Pertahankan maksimum lebar konten `480px`, padding responsif, dan link yang mudah disentuh.
- Jangan mengubah pemanggilan `api.trackView()` atau `api.trackClick()` ketika mengubah markup link.

## Implementasi token Tailwind

`tailwind.config.js` memakai `export default`, bukan `module.exports`. Palette berikut tersedia di `theme.extend.colors`; jangan mengganti konfigurasi `content`, semantic colors, atau ekstensi lain.

```js
// tailwind.config.js
export default {
  // ...content, darkMode, dan konfigurasi yang sudah ada
  theme: {
    extend: {
      colors: {
        retro: {
          teal: '#31AAA9',
          cream: '#F8E0A4',
          red: '#A82020',
          wine: '#6C1A1A',
          bg: '#FAF7F2',
          border: '#E8D8C8',
        },
      },
    },
  },
}
```

Contoh penggunaan yang terukur: `bg-retro-bg`, `border-retro-border`, atau `bg-retro-wine text-retro-cream`. Untuk state tombol umum, tetap prioritaskan `bg-primary text-primary-foreground` agar kompatibel dengan token global.

## Checklist implementasi

- [x] Tambahkan token `retro` ke `tailwind.config.js`.
- [x] Terapkan active state sidebar yang konsisten tanpa mengubah route atau aturan RBAC.
- [x] Rapikan hierarki metrik overview dan verifikasi pada mobile, tablet, serta desktop.
- [ ] Jika grafik dibutuhkan, pilih library dan petakan data analytics aktual sebelum menambahkan UI.
- [ ] Jika preview profil dibutuhkan, gunakan data dashboard yang sudah dimuat dan pertahankan perilaku analytics.
- [ ] Jalankan `npm run typecheck` dan pemeriksaan visual responsif setelah perubahan UI.
