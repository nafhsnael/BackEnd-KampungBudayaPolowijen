# Backend Mobile Polowijen

API REST untuk aplikasi Flutter dengan fitur autentikasi, profil, katalog UMKM,
dan wishlist. API menggunakan tabel `users`, `umkm`, dan `revoked_tokens` dari
database backend yang sudah ada.

## Menjalankan

1. Pastikan database `kampung_polowijen` sudah dibuat dan skema utama di
   `Backend/database/schema.sql` serta migrasi konten di
   `Backend/database/migration_admin_content.sql` sudah dijalankan.
2. Dari folder `Backend/Mobile`, salin `.env.example` menjadi `.env`, lalu isi
   kredensial MySQL dan `JWT_SECRET` acak minimal 32 karakter.
3. Jalankan migrasi khusus API mobile satu kali:

   ```powershell
   cmd /c "mysql -u root -p kampung_polowijen < database\migration_mobile_api.sql"
   ```

4. Pasang dependensi dan jalankan API:

   ```powershell
   npm install
   npm run dev
   ```

API berjalan pada `http://localhost:5001`; pemeriksaan status tersedia di
`GET /health`. Upload foto profil memerlukan `BLOB_READ_WRITE_TOKEN`; semua
endpoint lain dapat digunakan tanpa konfigurasi penyimpanan tersebut.

## Endpoint

Semua endpoint berada di bawah `/api/v1`. Login menggunakan
`Authorization: Bearer <access_token>`. Respons sukses berbentuk
`{ "data": ... }`; respons daftar juga memuat `meta` paginasi.

| Method | Path | Akses | Kegunaan |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | Publik | Daftar nama, email, password, konfirmasi password |
| `POST` | `/auth/login` | Publik | Login dengan email dan password |
| `POST` | `/auth/logout` | Login | Cabut token saat ini |
| `GET` | `/profile` | Login | Ambil profil sendiri |
| `PATCH` | `/profile` | Login | Ubah `name` dan/atau unggah `photo` (JPG/PNG, maks. 2 MB) |
| `PUT` | `/profile/password` | Login | Ubah password (`currentPassword`, `password`, `passwordConfirmation`) |
| `GET` | `/umkm/categories` | Publik | Kategori produk |
| `GET` | `/umkm?category=Kriya&q=topeng&page=1&per_page=10` | Publik/Opsional | Daftar UMKM; token opsional menambahkan `is_wishlisted` |
| `GET` | `/umkm/:id` | Publik/Opsional | Detail UMKM dan galeri |
| `GET` | `/wishlist?page=1&per_page=10` | Login | Wishlist milik sendiri |
| `PUT` | `/umkm/:id/wishlist` | Login | Tambah wishlist (idempoten) |
| `DELETE` | `/umkm/:id/wishlist` | Login | Hapus wishlist (idempoten) |

Data UMKM dikembalikan dengan `cover_url`, `craftsman_name`,
`whatsapp_number`, `images`, dan `is_wishlisted`. Harga dikembalikan sebagai
bilangan bulat Rupiah. Kesalahan validasi memakai HTTP 422 dan memetakan pesan
ke nama field.

Jalankan `npm test` untuk build TypeScript dan tes validasi request. Jalankan
`npm run build` untuk membuat `dist`.
