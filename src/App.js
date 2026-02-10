import React, { useState, useRef, useEffect } from 'react';
import Webcam from "react-webcam";
import { Client } from "@gradio/client";
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState("analisis");
  const [mode, setMode] = useState("gallery");
  const [image, setImage] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [location, setLocation] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);

  // --- REVERSE GEOCODING (KOORDINAT -> TEKS) ---
  const getGeoLocation = () => {
    setLocation("Mencari alamat...");
    if (!navigator.geolocation) {
      setLocation("Geolocation tidak didukung");
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      try {
        // Menggunakan OpenStreetMap API (Gratis)
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
        );
        const data = await response.json();
        // Mengambil nama lokasi yang manusiawi (display_name)
        setLocation(data.display_name || `${latitude}, ${longitude}`);
      } catch (error) {
        console.error("Geocoding Error:", error);
        setLocation(`${latitude}, ${longitude}`); // Fallback ke koordinat jika API gagal
      }
    }, () => {
      setLocation("Izin lokasi ditolak");
    });
  };

  useEffect(() => {
    if (activeTab === "analisis") getGeoLocation();
  }, [activeTab]);

  const runPrediction = async (fileBlob) => {
    setLoading(true);
    try {
      const client = await Client.connect("https://ferdinann-bantudarurat-lapor.hf.space/");
      const result = await client.predict("/predict_image", { image_input: fileBlob });
      setPrediction(result.data);
    } catch (err) {
      console.error("API Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCapture = async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) return;
    setImage(imageSrc);
    const blob = await fetch(imageSrc).then(r => r.blob());
    runPrediction(blob);
  };

  const saveToHistory = () => {
    if (!prediction) return;
    const label = prediction[1].toString().split('**Prediksi:** ')[1]?.split(' (')[0] || "Unknown";
    const newEntry = {
      id: Date.now(),
      waktu: new Date().toLocaleString('id-ID'),
      status: label,
      lokasi: location
    };
    setHistory([newEntry, ...history]);
    alert("Laporan Terkirim!");
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-slate-200 font-sans antialiased">
      <nav className="sticky top-0 z-50 bg-[#0D0D0D]/90 backdrop-blur-lg border-b border-red-900/30 px-6 py-5">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 p-2 rounded-lg shadow-lg">🚨</div>
            <h1 className="text-xl font-black tracking-tighter uppercase italic">LaporDaruratAI</h1>
          </div>
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
            {["analisis", "riwayat"].map(t => (
              <button key={t} onClick={() => setActiveTab(t)} className={`px-6 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${activeTab === t ? "bg-red-600 text-white" : "text-slate-500"}`}>{t}</button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {activeTab === "analisis" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <section className="space-y-6">
              <div className="relative aspect-video rounded-[2.5rem] bg-[#141414] overflow-hidden border border-white/5">
                <div className="absolute top-5 right-5 z-20 flex bg-black/80 backdrop-blur-md p-1 rounded-xl">
                  <button onClick={() => setMode("camera")} className={`px-4 py-1.5 text-[9px] font-black rounded-lg ${mode === "camera" ? "bg-red-600" : ""}`}>CAM</button>
                  <button onClick={() => setMode("gallery")} className={`px-4 py-1.5 text-[9px] font-black rounded-lg ${mode === "gallery" ? "bg-red-600" : ""}`}>FILE</button>
                </div>
                {mode === "camera" ? <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" className="w-full h-full object-cover" /> : 
                <div onClick={() => fileInputRef.current.click()} className="w-full h-full flex items-center justify-center cursor-pointer">
                  {image ? <img src={image} className="w-full h-full object-cover" alt="Visual" /> : <p className="text-[10px] font-bold opacity-30">UPLOAD FOTO</p>}
                </div>}
                <input type="file" ref={fileInputRef} onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) { setImage(URL.createObjectURL(file)); runPrediction(file); }
                }} className="hidden" accept="image/*" />
              </div>

              <div className="p-6 bg-[#141414] rounded-[2rem] border border-white/5">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-black text-red-500 uppercase italic">Lokasi Kejadian</label>
                  <button onClick={getGeoLocation} className="text-[8px] bg-white/5 px-2 py-1 rounded">REFRESH ALAMAT</button>
                </div>
                <textarea 
                  value={location} 
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-[#0D0D0D] border border-white/5 rounded-xl px-5 py-4 text-xs outline-none focus:border-red-500/50 h-24 resize-none"
                />
              </div>

              {mode === "camera" && <button onClick={handleCapture} className="w-full bg-red-600 py-5 rounded-2xl font-black text-xs uppercase">Ambil & Analisis</button>}
            </section>

            <section className="flex flex-col">
              {loading ? (
                <div className="flex-grow flex items-center justify-center bg-[#141414] rounded-[3rem] animate-pulse">
                  <div className="w-12 h-12 border-4 border-t-red-600 rounded-full animate-spin"></div>
                </div>
              ) : prediction ? (
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-red-700 to-black p-10 rounded-[3rem] border border-red-500/20">
                    <span className="text-[10px] font-black uppercase text-red-200/80">Hasil AI</span>
                    <h2 className="text-4xl font-black uppercase mt-2 text-white">{prediction[1].toString().split('**Prediksi:** ')[1]?.split(' (')[0]}</h2>
                  </div>
                  <div className="bg-[#141414] p-10 rounded-[3rem] border border-white/5">
                    <p className="text-red-500 text-[10px] font-black uppercase mb-4">Instruksi</p>
                    <p className="text-slate-300 text-sm leading-relaxed">{prediction[1].toString().replace(/###|#|\*\*|---/g, '')}</p>
                    <button onClick={saveToHistory} className="mt-10 w-full bg-red-600 py-5 rounded-xl font-black text-[10px] uppercase">📢 Kirim Laporan</button>
                  </div>
                </div>
              ) : <div className="h-full flex items-center justify-center border-4 border-dashed border-white/5 rounded-[3.5rem] opacity-20 uppercase font-black text-[10px]">Menunggu Visual</div>}
            </section>
          </div>
        ) : (
          <div className="bg-[#141414] rounded-[3rem] border border-white/5 overflow-hidden overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-[10px] font-black uppercase text-slate-500">
                <tr><th className="px-10 py-6">Waktu</th><th className="px-10 py-6">Insiden</th><th className="px-10 py-6">Alamat</th></tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {history.map(item => (
                  <tr key={item.id} className="hover:bg-red-900/5">
                    <td className="px-10 py-6 text-slate-400">{item.waktu}</td>
                    <td className="px-10 py-6"><span className="px-2 py-1 rounded bg-red-500/10 text-red-500 font-bold uppercase">{item.status}</span></td>
                    <td className="px-10 py-6 text-slate-500 italic max-w-xs">{item.lokasi}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;