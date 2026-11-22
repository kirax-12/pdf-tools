# PDF Tools

**Demo live:** [pdf-tools di GitHub Pages](https://kirax-12.github.io/pdf-tools/)

Alat PDF gratis yang jalan 100% di browser: gabung banyak PDF jadi satu, ambil halaman tertentu, dan ubah halaman PDF jadi gambar PNG. Gak ada upload ke server — file diproses lokal di browser kamu, jadi aman buat dokumen sensitif.

## Fitur

- **Gabung PDF** — pilih banyak file PDF sekaligus (klik atau drag & drop), lihat jumlah halaman tiap file, hapus file yang gak jadi dipakai, lalu gabungkan jadi satu PDF dengan urutan sesuai daftar.
- **Ambil Halaman** — buka satu PDF, ketik halaman yang mau diambil pakai format simpel kayak `1-3, 5, 8`, hasilnya jadi PDF baru berisi halaman itu aja.
- **PDF ke Gambar** — tiap halaman PDF di-render jadi gambar PNG resolusi 2x, lengkap dengan thumbnail dan tombol download per halaman.
- **Privat secara default** — semua proses jalan di memori tab browser. Tutup tab, file hilang. Gak ada backend, gak ada pelacakan file.
- Validasi file non-PDF dan pesan error yang jelas kalau file rusak atau kepassword.

## Cara Jalanin

Karena ini situs statis murni, cukup buka `index.html` di browser modern (Chrome, Edge, Firefox, Safari). Gak perlu build, gak perlu install apa-apa.

Buat yang mau jalanin lewat server lokal:

```bash
npx serve .
# atau
python3 -m http.server 8000
```

Lalu buka `http://localhost:8000` di browser.

Catatan: library dimuat dari CDN, jadi koneksi internet dibutuhkan saat pertama kali halaman dibuka. Setelah itu, proses PDF-nya sendiri gak butuh internet.

## Teknologi

- [pdf-lib](https://pdf-lib.js.org/) — manipulasi PDF (gabung & ambil halaman) langsung di browser.
- [PDF.js](https://mozilla.github.io/pdf.js/) — render halaman PDF ke canvas buat diubah jadi PNG.
- HTML, CSS, dan JavaScript vanilla — tanpa framework, tanpa build step.
- Desain neo-brutalist khas Remike Dev: background cream, border hitam tegas, hard shadow, font Space Grotesk + Space Mono + Caveat.

## Struktur File

```
pdf-tools/
├── index.html   # struktur halaman + tiga tab alat
├── style.css    # styling neo-brutalist
├── script.js    # semua logika pemrosesan PDF
└── README.md
```

---

Dibuat oleh Remike Dev.
