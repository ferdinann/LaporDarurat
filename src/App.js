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

  const getGeoLocation = () => {
    setLocation("Mencari alamat...");
    if (!navigator.geolocation) {
      setLocation("Geolocation tidak didukung");
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
        );
        const data = await response.json();
        setLocation(data.display_name || `${latitude}, ${longitude}`);
      } catch (error) {
        setLocation(`${latitude}, ${longitude}`);
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
    <div className="min-h-screen bg-[#0D0D0D] text-slate-200 font-sans antialiased pb-10">
      {/* Navbar Responsif */}
      <nav className="sticky top-0 z-50 bg-[#0D0D0D]/90 backdrop-blur-lg border-b border-red-900/30 px-4 md:px-6 py-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 p-2 rounded-lg shadow-lg">🚨</div>
            <h1 className="text-lg md:text-xl font-black tracking-tighter italic">LaporDarurat</h1>
          </div>
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 w-full sm:w-auto">
            {["analisis", "riwayat"].map(t => (
              <button 
                key={t} 
                onClick={() => setActiveTab(t)} 
                className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${activeTab === t ? "bg-red-600 text-white" : "text-slate-500"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-10">
        {activeTab === "analisis" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">
            {/* Input Section */}
            <section className="space-y-6">
              <div className="relative aspect-video rounded-2xl md:rounded-[2.5rem] bg-[#141414] overflow-hidden border border-white/5">
                <div className="absolute top-3 right-3 md:top-5 md:right-5 z-20 flex bg-black/80 backdrop-blur-md p-1 rounded-xl">
                  <button onClick={() => setMode("camera")} className={`px-3 py-1.5 text-[9px] font-black rounded-lg ${mode === "camera" ? "bg-red-600" : ""}`}>CAM</button>
                  <button onClick={() => setMode("gallery")} className={`px-3 py-1.5 text-[9px] font-black rounded-lg ${mode === "gallery" ? "bg-red-600" : ""}`}>FILE</button>
                </div>
                {mode === "camera" ? 
                  <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" className="w-full h-full object-cover" /> : 
                  <div onClick={() => fileInputRef.current.click()} className="w-full h-full flex items-center justify-center cursor-pointer p-4">
                    {image ? <img src={image} className="w-full h-full object-contain md:object-cover" alt="Visual" /> : <p className="text-[10px] font-bold opacity-30">TAP UNTUK UPLOAD</p>}
                  </div>
                }
                <input type="file" ref={fileInputRef} onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) { setImage(URL.createObjectURL(file)); runPrediction(file); }
                }} className="hidden" accept="image/*" />
              </div>

              <div className="p-5 md:p-6 bg-[#141414] rounded-2xl md:rounded-[2rem] border border-white/5">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-black text-red-500 uppercase italic">Lokasi Kejadian</label>
                  <button onClick={getGeoLocation} className="text-[8px] bg-white/5 px-2 py-1 rounded hover:bg-white/10 transition">REFRESH</button>
                </div>
                <textarea 
                  value={location} 
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-[#0D0D0D] border border-white/5 rounded-xl px-4 py-3 text-xs outline-none focus:border-red-500/50 h-24 resize-none"
                />
              </div>

              {mode === "camera" && (
                <button onClick={handleCapture} className="w-full bg-red-600 active:scale-95 transition-transform py-4 md:py-5 rounded-2xl font-black text-xs uppercase shadow-xl shadow-red-600/20">
                  Ambil & Analisis
                </button>
              )}
            </section>

            {/* Result Section */}
            <section className="flex flex-col min-h-[300px]">
              {loading ? (
                <div className="flex-grow flex flex-col items-center justify-center bg-[#141414] rounded-2xl md:rounded-[3rem] animate-pulse">
                  <div className="w-10 h-10 border-4 border-t-red-600 rounded-full animate-spin mb-4"></div>
                  <p className="text-[10px] font-bold opacity-50">MEMPROSES AI...</p>
                </div>
              ) : prediction ? (
                <div className="space-y-4 md:space-y-6">
                  <div className="bg-gradient-to-br from-red-700 to-black p-6 md:p-10 rounded-2xl md:rounded-[3rem] border border-red-500/20">
                    <span className="text-[10px] font-black uppercase text-red-200/80">Hasil Prediksi</span>
                    <h2 className="text-2xl md:text-4xl font-black uppercase mt-2 text-white break-words">
                      {prediction[1].toString().split('**Prediksi:** ')[1]?.split(' (')[0]}
                    </h2>
                  </div>
                  <div className="bg-[#141414] p-6 md:p-10 rounded-2xl md:rounded-[3rem] border border-white/5">
                    <p className="text-red-500 text-[10px] font-black uppercase mb-4">Instruksi Tindakan</p>
                    <div className="text-slate-300 text-xs md:text-sm leading-relaxed max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                      {prediction[1].toString().replace(/###|#|\*\*|---/g, '')}
                    </div>
                    <button onClick={saveToHistory} className="mt-6 md:mt-10 w-full bg-red-600 active:scale-95 transition-transform py-4 md:py-5 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-red-600/10">
                      📢 Kirim Laporan Resmi
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-grow flex items-center justify-center border-2 border-dashed border-white/5 rounded-2xl md:rounded-[3.5rem] opacity-20 uppercase font-black text-[10px] p-10 text-center">
                  Menunggu Input Visual
                </div>
              )}
            </section>
          </div>
        ) : (
          /* History Table Responsif */
          <div className="bg-[#141414] rounded-2xl md:rounded-[3rem] border border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-white/5 text-[9px] md:text-[10px] font-black uppercase text-slate-500">
                  <tr>
                    <th className="px-6 md:px-10 py-5">Waktu</th>
                    <th className="px-6 md:px-10 py-5">Insiden</th>
                    <th className="px-6 md:px-10 py-5">Alamat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-[11px] md:text-xs">
                  {history.length > 0 ? history.map(item => (
                    <tr key={item.id} className="hover:bg-red-900/5 transition-colors">
                      <td className="px-6 md:px-10 py-5 text-slate-400 whitespace-nowrap">{item.waktu}</td>
                      <td className="px-6 md:px-10 py-5">
                        <span className="px-2 py-1 rounded bg-red-500/10 text-red-500 font-bold uppercase text-[9px] md:text-[10px]">
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 md:px-10 py-5 text-slate-500 italic min-w-[200px] max-w-xs truncate md:whitespace-normal">
                        {item.lokasi}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="3" className="px-10 py-20 text-center opacity-20 font-black uppercase text-[10px]">Belum ada riwayat</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;