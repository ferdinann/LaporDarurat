import gradio as gr
import tensorflow as tf
from tensorflow.keras.models import load_model 
import numpy as np       
from PIL import Image
import pandas as pd
from datetime import datetime
import os

# --- KONFIGURASI GLOBAL ---
IMG_SIZE = (224, 224)
history_data = []

class_names = ['Bangunan Runtuh', 'Kebakaran', 'Banjir' , 'Normal',  'Kecelakaan Lalu Lintas']
num_classes = len(class_names)

incident_descriptions = {
    'Bangunan Runtuh': 'Terdeteksi struktur bangunan roboh. Segera evakuasi dan jauhi reruntuhan.',
    'Kebakaran': 'Terdeteksi api atau asap. Hubungi dinas pemadam kebakaran segera.',
    'Banjir': 'Area tergenang air. Waspada arus kuat dan matikan aliran listrik.',
    'Normal': 'Area terpantau aman. Tidak ada tanda-tanda insiden darurat.',
    'Kecelakaan Lalu Lintas': 'Terjadi insiden kendaraan. Berikan ruang untuk ambulans dan petugas.'   
}

# --- LOAD MODEL ---
model_path = "mobilenet_final_model.h5"

print("🔍 Mencoba load model dari:", model_path)
print("🔍 File exists?", os.path.exists(model_path))

try:
    best_model = load_model(model_path)
    print("✅ Model berhasil dimuat!")
    print("✅ Model summary:", best_model.summary())
except FileNotFoundError as e:
    print(f"❌ File model tidak ditemukan: {e}")
    best_model = None
except Exception as e:
    print(f"❌ Error saat load model: {type(e).__name__}")
    print(f"❌ Detail error: {str(e)}")
    import traceback
    traceback.print_exc()
    best_model = None

# --- FUNGSI PREDIKSI ---
def predict_image(image_input):
    if image_input is None:
        return {}, "Silakan unggah gambar."
    
    # Preprocessing
    img = image_input.resize(IMG_SIZE)
    img_array = tf.keras.utils.img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0) # Tambah batch dimension
    img_array = img_array / 255.0                # Rescale 0-1

    if best_model:
        predictions = best_model.predict(img_array)
        # Ambil probabilitas (biasanya model sudah pakai Softmax di layer terakhir)
        scores = predictions[0] 
        
        output_dict = {class_names[i]: float(scores[i]) for i in range(num_classes)}
        top_label = max(output_dict, key=output_dict.get)
        top_confidence = output_dict[top_label]
        
        description = incident_descriptions.get(top_label, "Deskripsi tidak tersedia.")
        formatted_desc = f"**Prediksi:** {top_label} ({top_confidence:.2%})\n\n**Info:** {description}"
        return output_dict, formatted_desc
    else:
        return {"Error": 1.0}, "Model belum siap."

def predict_with_metadata(img, location):
    if img is None:
        return {}, pd.DataFrame(history_data, columns=["Waktu", "Insiden", "Lokasi"]), None, "Gagal melapor."
    
    output_dict, formatted_description = predict_image(img)
    top_label = max(output_dict, key=output_dict.get)
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Masukkan ke list riwayat
    history_data.append([now, top_label, location if location else "-"])
    history_df = pd.DataFrame(history_data, columns=["Waktu", "Insiden", "Lokasi"])

    # Mengembalikan None ke input_img untuk clear gambar setelah lapor
    return output_dict, history_df, None, formatted_description

# --- INTERFACE ---
with gr.Blocks(theme=gr.themes.Soft(primary_hue="red")) as demo:
    gr.Markdown("# 🚨 LaporDarurat AI")
    
    with gr.Tabs():
        with gr.TabItem("📸 Analisis Real-time"):
            with gr.Row():
                with gr.Column():
                    input_img = gr.Image(sources=["upload", "webcam"], type="pil", label="Ambil Foto")
                    input_loc = gr.Textbox(label="Lokasi", placeholder="Ketik alamat kejadian...")
                    btn_report = gr.Button("📋 LAPORKAN INSIDEN", variant="primary")
                with gr.Column():
                    output_label = gr.Label(num_top_classes=5, label="Hasil Deteksi")
                    output_description = gr.Markdown("_Menunggu input gambar..._")

        with gr.TabItem("📜 Riwayat Laporan"):
            output_history = gr.Dataframe(headers=["Waktu", "Insiden", "Lokasi"], interactive=False)

    # Event saat gambar diupload/diambil
    input_img.change(fn=predict_image, inputs=input_img, outputs=[output_label, output_description])
    
    # Event saat tombol lapor diklik
    btn_report.click(
        fn=predict_with_metadata, 
        inputs=[input_img, input_loc], 
        outputs=[output_label, output_history, input_img, output_description]
    )
    
demo.launch(server_name="0.0.0.0", server_port=7860)