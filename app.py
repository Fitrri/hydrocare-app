from flask import Flask, render_template, request, jsonify
# from flask_sqlalchemy import SQLAlchemy  # Tidak perlu import SQLAlchemy dulu

app = Flask(__name__)

# Jangan konfigurasi database dulu
# app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///hydrocare.db'
# app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
# db = SQLAlchemy(app)

# Comment model karena belum pakai DB
# class RiwayatAir(db.Model):
#     id = db.Column(db.Integer, primary_key=True)
#     nama = db.Column(db.String(100))
#     berat_badan = db.Column(db.Float)
#     aktivitas = db.Column(db.String(50))
#     cuaca = db.Column(db.String(50))
#     kondisi_khusus = db.Column(db.String(50))
#     hasil = db.Column(db.Float)

def hitung_kebutuhan_air(berat_badan, aktivitas, cuaca, kondisi_khusus):
    kebutuhan_dasar = berat_badan * 0.03  # 30 ml/kg
    tambahan_air = 0.0

    if aktivitas == "sangat_tinggi":
        tambahan_air += 1.5
    elif aktivitas == "tinggi":
        tambahan_air += 1.0
    elif aktivitas == "sedang":
        tambahan_air += 0.5
    elif aktivitas == "ringan":
        tambahan_air += 0.2
    elif aktivitas == "tidak_aktif":
        tambahan_air += 0.0

    if cuaca == "panas":
        tambahan_air += 0.5

    if kondisi_khusus == "hamil":
        tambahan_air += 0.3
    elif kondisi_khusus == "menyusui":
        tambahan_air += 0.7

    total = kebutuhan_dasar + tambahan_air
    return round(total, 2)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/kalkulasi', methods=['POST'])
def kalkulasi_air():
    data = request.get_json()
    berat = float(data['berat_badan'])
    aktivitas = data['aktivitas']
    cuaca = data['cuaca']
    kondisi = data['kondisi_khusus']
    nama = data.get('nama', 'Pengguna')

    total = hitung_kebutuhan_air(berat, aktivitas, cuaca, kondisi)
    print(f"Hitung kebutuhan air untuk {nama}: {total} liter")

    # Tidak simpan ke database dulu
    # Jadi kembalikan hasil saja
    return jsonify({'kebutuhan': total})

@app.route('/riwayat')
def lihat_riwayat():
    # Belum ada database, jadi return pesan sederhana saja
    return "Fitur riwayat belum tersedia."

if __name__ == '__main__':
    # Tidak perlu create_all tanpa DB
    app.run(debug=True)
