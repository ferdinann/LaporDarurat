# 🚨 LaporDarurat: AI-Powered Emergency Reporting System

[![Hugging Face Spaces](https://img.shields.io/badge/%F0%9F%A4%97%20Hugging%20Face-Spaces-blue)](https://huggingface.co/spaces/Ferdinann/BantuDarurat_Lapor)
[![Python](https://img.shields.io/badge/Python-3.9+-yellow)](https://www.python.org/)
[![TensorFlow](https://img.shields.io/badge/TensorFlow-2.x-orange)](https://tensorflow.org/)

**LaporDarurat** adalah sistem informasi darurat berbasis *Computer Vision* dan *Deep Learning* yang dirancang untuk mendeteksi serta mengklasifikasikan insiden darurat secara otomatis melalui analisis gambar secara *real-time*.

---

## 📌 Problem Statement
Indonesia memiliki risiko tinggi terhadap berbagai insiden darurat (kebakaran, banjir, kecelakaan), namun sistem pelaporan manual seringkali subjektif dan lambat. Keterlambatan verifikasi data di tengah kondisi panik berisiko memperparah kerusakan dan meningkatkan potensi korban jiwa.

## 💡 Solusi
LaporDarurat hadir untuk memvalidasi bukti visual secara instan. Dengan teknologi AI, sistem ini meminimalkan kesalahan pelaporan, memberikan skor kepercayaan (confidence score), dan mempercepat koordinasi dengan pihak berwenang melalui data yang akurat dan presisi.

---

## ✨ Fitur Utama
* **Deteksi Insiden Visual:** Identifikasi otomatis jenis darurat (Kebakaran, Banjir, Bangunan Runtuh, Kecelakaan) melalui foto/kamera.
* **Confidence Score:** Menampilkan tingkat akurasi prediksi model.
* **Integrasi Lokasi:** Penggabungan analisis visual dengan input lokasi kejadian.
* **Rekomendasi Tindakan:** Instruksi singkat berdasarkan jenis insiden yang terdeteksi.
* **Riwayat Laporan:** Dokumentasi kejadian yang telah dilaporkan untuk tindak lanjut.

---

## 🛠️ Teknologi & Tools
| Kategori | Teknologi yang Digunakan |
|---|---|
| **Core Model** | MobileNet (CNN Architecture) |
| **Framework AI** | TensorFlow & Keras |
| **Language** | Python |
| **Interface** | Gradio |
| **Deployment** | Hugging Face Spaces |
| **Training** | Google Colab |

---

## 🚀 Cara Penggunaan
1.  **Akses Aplikasi:** Buka [LaporDarurat di Hugging Face](https://huggingface.co/spaces/Ferdinann/BantuDarurat_Lapor).
2.  **Input Visual:** Klik "Ambil Foto" atau unggah gambar dari galeri.
3.  **Analisis AI:** Tunggu beberapa detik hingga model MobileNet selesai mengklasifikasikan gambar.
4.  **Verifikasi & Lokasi:** Tinjau hasil prediksi dan masukkan alamat/detail lokasi kejadian.
5.  **Kirim Laporan:** Tekan tombol **LAPORKAN INSIDEN** untuk mengirim data ke sistem.



## 📈 Pengembangan Masa Depan
* **Integrasi IoT:** Menghubungkan model dengan CCTV kota untuk deteksi otomatis tanpa laporan manual.
* **Auto-Location:** Deteksi lokasi otomatis menggunakan GPS perangkat.
* **Multi-Language Support:** Dukungan bahasa daerah untuk instruksi darurat.
