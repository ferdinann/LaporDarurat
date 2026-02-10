import React, { useState, useRef, useEffect } from 'react';
import Webcam from "react-webcam";
import { Client } from "@gradio/client";
import './App.css';

// Komponen Icon Reset untuk mengambil foto ulang
const IconReset = ({ onClick }) => (
  <button 
    onClick={onClick}
    className="flex items-center gap-2 bg-black/70 backdrop-blur-md px-3 py-2 rounded-full border border-white/20 hover:bg-red-600 transition-all cursor-pointer pointer-events-auto"
  >
    <span className="text-sm">🔄</span>
    <span className="text-[9px] font-bold uppercase tracking-wider text-white">Ambil Ulang</span>
  </button>
);

function App() {
  const [activeTab, setActiveTab] = useState("analisis");
  const [mode, setMode] = useState("camera"); 
  const [facingMode, setFacingMode] = useState("user"); 
  const [image, setImage] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(true); 
  const [prediction, setPrediction] = useState(null);
  const [location, setLocation] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);

  // --- Geolocation ---
  const getGeoLocation = () => {
    setLocation("Mencari alamat...");
    if (!navigator.geolocation) {
      setLocation("Geolocation tidak didukung");
      return;
    }
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
        const data = await response.json();
        setLocation(data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      } catch {
        setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      }
    }, () => setLocation("Izin lokasi ditolak"));
  };

  useEffect(() => {
    if (activeTab === "analisis") getGeoLocation();
  }, [activeTab]);

  // --- API Prediction ---
  const runPrediction = async (fileBlob) => {
    setLoading(true);
    try {
      const client = await Client.connect("https://ferdinann-bantudarurat-lapor.hf.space/");
      const result = await client.predict("/predict_image", { image_input: fileBlob });
      setPrediction(result.data);
    } catch (err) {
      console.error("API Error:", err);
      alert("Gagal memproses gambar. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  // --- Logic Kamera ---
  const handleCapture = async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) return;
    setImage(imageSrc);
    setIsCameraActive(false); // Stop stream agar gambar membeku
    const blob = await fetch(imageSrc).then(r => r.blob());
    runPrediction(blob);
  };

  const resetInput = (targetMode) => {
    setImage(null);
    setPrediction(null);
    setIsCameraActive(true);
    if (targetMode) setMode(targetMode);
    if (targetMode === "gallery") fileInputRef.current.click();
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === "user" ? "environment" : "user");
  };

  const saveToHistory = () => {
    if (!prediction) return;
    const label = prediction[1].toString().split('**Prediksi:** ')[1]?.split(' (')[0] || "Laporan Umum";
    const newEntry = {
      id: Date.now(),
      waktu: new Date().toLocaleString('id-ID'),
      status: label,
      lokasi: location
    };
    setHistory([newEntry, ...history]);
    alert("✅ Laporan Berhasil Dikirim ke Server!");
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-slate-200 font-sans antialiased pb-10">
      {/* Header Responsif */}
      <nav className="sticky top-0 z-50 bg-[#0D0D0D]/90 backdrop-blur-lg border-b border-red-900/30 px-4 py-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 p-2 rounded-lg shadow-lg animate-pulse">🚨</div>
            <h1 className="text-xl font-black tracking-tighter">LaporDarurat</h1>
          </div>
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 w-full sm:w-auto">
            {["analisis", "riwayat"].map(t => (
              <button key={t} onClick={() => setActiveTab(t)} className={`flex-1 sm:px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === t ? "bg-red-600 text-white" : "text-slate-500 hover:text-slate-300"}`}>{t}</button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-10">
        {activeTab === "analisis" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            
            {/* KOLOM KIRI: INPUT VISUAL */}
            <section className="space-y-6">
              <div className="relative aspect-video sm:aspect-square lg:aspect-video rounded-[2rem] bg-[#141414] overflow-hidden border border-white/5 shadow-2xl">
                
                {/* Overlay Controls */}
                <div className="absolute top-4 left-4 right-4 z-30 flex justify-between items-start pointer-events-none">
                  {(image || !isCameraActive) ? (
                    <IconReset onClick={() => resetInput(mode)} />
                  ) : <div />}

                  <div className="flex bg-black/60 backdrop-blur-md p-1 rounded-xl border border-white/10 pointer-events-auto">
                    <button onClick={() => resetInput("camera")} className={`px-4 py-1.5 text-[9px] font-black rounded-lg transition-all ${mode === "camera" ? "bg-red-600" : "hover:text-red-400"}`}>CAM</button>
                    <button onClick={() => resetInput("gallery")} className={`px-4 py-1.5 text-[9px] font-black rounded-lg transition-all ${mode === "gallery" ? "bg-red-600" : "hover:text-red-400"}`}>FILE</button>
                  </div>
                </div>

                {/* Tombol Switch Kamera Depan/Belakang */}
                {mode === "camera" && isCameraActive && (
                  <button onClick={toggleCamera} className="absolute bottom-4 right-4 z-30 bg-black/60 p-3 rounded-full border border-white/20 hover:bg-white/10 transition-all">
                    📷🔄
                  </button>
                )}

                {/* Display Utama */}
                {mode === "camera" && isCameraActive ? (
                  <Webcam 
                    audio={false} 
                    ref={webcamRef} 
                    screenshotFormat="image/jpeg" 
                    videoConstraints={{ facingMode: facingMode }}
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#0D0D0D]">
                    {image ? (
                      <img src={image} className="w-full h-full object-contain md:object-cover" alt="Preview" />
                    ) : (
                      <div onClick={() => fileInputRef.current.click()} className="text-center cursor-pointer group">
                        <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">📁</div>
                        <p className="text-[10px] font-black opacity-30 uppercase tracking-widest">Klik untuk Upload Foto</p>
                      </div>
                    )}
                  </div>
                )}
                
                <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) { setImage(URL.createObjectURL(file)); setIsCameraActive(false); runPrediction(file); }
                }} />
              </div>

              {/* Tombol Ambil Foto hanya muncul saat kamera aktif */}
              {mode === "camera" && isCameraActive && (
                <button onClick={handleCapture} className="w-full bg-red-600 hover:bg-red-700 active:scale-95 py-5 rounded-2xl font-black text-xs uppercase transition-all shadow-xl shadow-red-600/20">
                  📸 Ambil & Analisis Sekarang
                </button>
              )}

              {/* Box Lokasi */}
              <div className="p-5 bg-[#141414] rounded-2xl border border-white/5">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-[10px] font-black text-red-500 uppercase italic">📍 Lokasi Terdeteksi</label>
                  <button onClick={getGeoLocation} className="text-[8px] bg-white/5 px-2 py-1 rounded hover:bg-white/10 transition">REFRESH</button>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed min-h-[40px] italic">{location || "Menunggu data lokasi..."}</p>
              </div>
            </section>

            {/* KOLOM KANAN: HASIL ANALISIS */}
            <section className="flex flex-col min-h-[400px]">
              {loading ? (
                <div className="flex-grow flex flex-col items-center justify-center bg-[#141414] rounded-[2.5rem] border border-white/5 animate-pulse">
                  <div className="w-12 h-12 border-4 border-t-red-600 border-white/10 rounded-full animate-spin mb-4"></div>
                  <p className="text-[10px] font-black opacity-40 uppercase tracking-tighter">AI sedang bekerja...</p>
                </div>
              ) : prediction ? (
                <div className="space-y-6 h-full">
                  <div className="bg-gradient-to-br from-red-700 to-black p-8 md:p-10 rounded-[2.5rem] border border-red-500/20 shadow-2xl">
                    <span className="text-[10px] font-black uppercase text-red-200/60">Hasil Identifikasi</span>
                    <h2 className="text-3xl md:text-4xl font-black uppercase mt-2 text-white leading-tight break-words">
                      {prediction[1].toString().split('**Prediksi:** ')[1]?.split(' (')[0] || "Bahaya Terdeteksi"}
                    </h2>
                  </div>

                  <div className="flex-grow bg-[#141414] p-8 md:p-10 rounded-[2.5rem] border border-white/5 flex flex-col">
                    <p className="text-red-500 text-[10px] font-black uppercase mb-4 tracking-widest italic">⚠️ Instruksi Tindakan</p>
                    <div className="text-slate-300 text-sm leading-relaxed overflow-y-auto max-h-[300px] mb-8 pr-2">
                      {prediction[1].toString().replace(/###|#|\*\*|---/g, '')}
                    </div>
                    
                    <button 
                      onClick={saveToHistory}
                      className="mt-auto w-full bg-white text-black hover:bg-red-600 hover:text-white py-5 rounded-2xl font-black text-[11px] uppercase transition-all shadow-xl active:scale-95"
                    >
                      📢 Kirim Laporan ke Petugas
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-grow flex items-center justify-center border-2 border-dashed border-white/5 rounded-[2.5rem] opacity-20 p-10 text-center">
                  <p className="font-black text-[10px] uppercase tracking-[0.2em]">Upload atau ambil foto untuk memulai analisis AI</p>
                </div>
              )}
            </section>
          </div>
        ) : (
          /* TAB RIWAYAT */
          <div className="bg-[#141414] rounded-3xl border border-white/5 overflow-hidden shadow-2xl overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead className="bg-white/5 text-[10px] font-black uppercase text-slate-500">
                <tr>
                  <th className="px-8 py-6">Waktu Kejadian</th>
                  <th className="px-8 py-6">Status/Insiden</th>
                  <th className="px-8 py-6">Alamat Lengkap</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-slate-400">
                {history.length > 0 ? history.map(item => (
                  <tr key={item.id} className="hover:bg-red-900/5 transition-colors">
                    <td className="px-8 py-6 whitespace-nowrap">{item.waktu}</td>
                    <td className="px-8 py-6">
                      <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-500 font-bold uppercase text-[9px]">
                        {item.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 italic opacity-70 leading-relaxed">{item.lokasi}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="3" className="px-8 py-20 text-center opacity-20 font-black uppercase tracking-widest">Belum ada data laporan</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;