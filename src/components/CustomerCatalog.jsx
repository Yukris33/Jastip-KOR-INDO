
import React, { useState, useEffect } from 'react';

// useState menyimpan data di komponen; useEffect mengambil data dari API.

export default function CustomerCatalog({ onOrderAdded, setCharacter, character }) {
  const [products, setProducts] = useState([]);
  const [feePercent, setFeePercent] = useState(11.0); // Satu fee jastip, default 11%
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Form Data Pembeli (Lengkap dengan Pilihan Medsos/Kontak & Notes)
  const [formData, setFormData] = useState({
    buyerName: '',
    platform: 'whatsapp', // 'whatsapp', 'instagram', 'line', 'tiktok'
    contactValue: '',     // Berisi Angka jika WA, Username jika Medsos lain
    quantity: 1,
    notes: '',            // Detail/Catatan khusus
    paymentStatus: 'PENDING',
  });

  // 1. Fetch Produk Asli dari Database FastAPI
  useEffect(() => {
    fetchProducts();
  }, [feePercent]); // Ambil ulang total jika fee jastip berubah

  const fetchProducts = async () => {
    try {
      setLoading(true); // Tampilkan indikator ketika mengambil ulang data
      const response = await fetch(`http://127.0.0.1:8000/products/?tax_percent=${feePercent}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`); // Jangan anggap error API sebagai katalog kosong
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Gagal mengambil data produk:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenOrderModal = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  // 2. Submit Order ke Endpoint `POST /orders/`
  const handleSubmitOrder = async (e) => { // e = parameter/object yang dikirim
    e.preventDefault(); // Cegah browser reload saat form dikirim

    if (!formData.buyerName.trim()) { // Tolak nama kosong atau cuma spasi
      alert('Nama Pembeli wajib diisi!');
      return;
    }

    if (!formData.contactValue.trim()) {
      alert('Kontak / Medsos wajib diisi!');
      return;
    }

    // Payload dikirim sesuai dengan schemas.OrderCreate di FastAPI
    const orderPayload = {
      customer_name: formData.buyerName,
      status: formData.paymentStatus,
      tax_percent: feePercent, // API lama masih memakai nama tax_percent untuk fee jastip
      items: [
        {
          product_id: selectedProduct.id,
          quantity: Number(formData.quantity) || 1, // Konversi input jadi angka (default 1)
        }
      ]
    };

    try {
      const response = await fetch('http://127.0.0.1:8000/orders/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderPayload), // Ubah payload JavaScript jadi JSON
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Gagal menyimpan order');
      }

      const savedOrder = await response.json();
      alert(`Sukses! Order atas nama ${formData.buyerName} tersimpan. Kontak dan catatan belum ikut tersimpan (Step 7).`); // Payload order belum memuat kontak/notes

      if (onOrderAdded) onOrderAdded(savedOrder);

      // Reset form setelah API berhasil menyimpan order
      setFormData({
        buyerName: '',
        platform: 'whatsapp',
        contactValue: '',
        quantity: 1,
        notes: '',
        paymentStatus: 'PENDING',
      });
      setIsModalOpen(false);

    } catch (error) {
      console.error('Error Submit Order:', error);
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <div className="px-0 py-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="bg-amber-100 border-4 border-amber-300 rounded-3xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-amber-950">🛍️ Katalog Jastip Line & Friends</h2>
          <p className="text-xs text-amber-800">Pilih barang di bawah ini untuk membuat orderan pelanggan!</p>
        </div>
      
          {/* Character Selector */}
          <div className="character-switch">
            <p className="character-title">Pilih Temanmu ♡</p>

            <div className="character-options !grid !grid-cols-2 !gap-2 sm:!flex sm:!flex-wrap sm:!justify-center">
              <button
                type="button"
                className={`character-button ${character === 'Brown' ? 'active' : ''}`}
                onClick={() => setCharacter('Brown')}
              >
                🐻 Brown
              </button>

              <button
                type="button"
                className={`character-button ${character === 'Cony' ? 'active' : ''}`}
                onClick={() => setCharacter('Cony')}
              >
                🐰 Cony
              </button>

              <button
                type="button"
                className={`character-button ${character === 'Sally' ? 'active' : ''}`}
                onClick={() => setCharacter('Sally')}
              >
                🐥 Sally
              </button>

              <button
                type="button"
                className={`character-button ${character === 'Choco' ? 'active' : ''}`}
                onClick={() => setCharacter('Choco')}
              >
                🎀 Choco
              </button>
            </div>
          </div>


        <div className="flex items-center gap-2 bg-amber-50 border-2 border-amber-300 rounded-2xl px-3 py-1.5 text-xs font-bold text-amber-900">
          <span>🧮 Setting Fee Jastip (%):</span>
          <input
            type="number"
            value={feePercent}
            min="0"
            max="100"
            onChange={(e) => setFeePercent(Number(e.target.value))} // Nilai fee dari input owner
            className="w-14 bg-white border border-amber-300 rounded-lg text-center p-1 font-bold outline-none text-amber-950"
          />
        </div>
      </div>

      {/* Grid Katalog Produk */}
      {loading ? (
        <div className="text-center py-10 font-bold text-amber-900">Memuat data produk...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-10 bg-amber-50 rounded-3xl border-2 border-dashed border-amber-300 text-amber-900">
          Belum ada produk di database. Silakan tambah produk dari menu <b>"+ Tambah Produk"</b> di navbar atas.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((item) => (
            <div key={item.id} className="bg-white border-4 border-amber-200 rounded-3xl overflow-hidden shadow-sm flex flex-col justify-between">
              <div className="relative h-56 bg-amber-50 overflow-hidden flex items-center justify-center">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl">📦</span>
                )}
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-bold text-amber-950 text-base">{item.name}</h3>
                  {item.description && <p className="text-xs text-gray-500 line-clamp-2 mt-1">{item.description}</p>}
                </div>

                {/* Tampilkan harga dari respons GET /products/ — tidak menyimpan ke database */}
                <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-3 space-y-1 text-xs font-semibold">
                  <div className="flex flex-col gap-1 sm:flex-row sm:justify-between text-amber-800">
                    <span>Harga (KRW):</span>
                    <span>₩{Number(item.price_krw ?? 0).toLocaleString('ko-KR')}</span> {/* Harga produk dalam Won */}
                  </div>

                  <div className="flex flex-col gap-1 sm:flex-row sm:justify-between text-amber-800">
                    <span>Modal IDR:</span>
                    <span>Rp {Number(item.price_idr ?? 0).toLocaleString('id-ID', { maximumFractionDigits: 2 })}</span> {/* Harga dasar dari DB */}
                  </div>

                  <div className="flex justify-between text-amber-700">
                    <span>Fee Jastip ({feePercent}%):</span>
                    <span>
                      {item.tax_idr == null
                        ? 'Belum tersedia'
                        : `+ Rp ${Number(item.tax_idr).toLocaleString('id-ID', { maximumFractionDigits: 2 })}`}
                    </span> {/* Fee jastip dari backend, hanya satu kali */}
                  </div>

                  <div className="border-t border-amber-200 pt-1 flex justify-between text-amber-950 font-bold text-sm">
                    <span>Est. Total IDR:</span>
                    <span>
                      {item.total_tagihan_idr == null
                        ? 'Belum tersedia'
                        : `Rp ${Number(item.total_tagihan_idr).toLocaleString('id-ID', { maximumFractionDigits: 2 })}`}
                    </span> {/* Modal + satu fee dari API */}
                  </div>
                </div>

                <button
                  onClick={() => handleOpenOrderModal(item)}
                  className="w-full bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold py-2.5 rounded-2xl border-2 border-amber-500 shadow-sm transition-all active:scale-95 text-xs"
                >
                  🛒 Pesan Produk Ini
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL INPUT DETAIL ORDER */}
      {isModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-amber-50 border-4 border-amber-300 rounded-3xl p-4 sm:p-6 max-w-md w-full max-h-[calc(100dvh-2rem)] overflow-y-auto shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-amber-950">📝 Order: {selectedProduct.name}</h3>

            <form onSubmit={handleSubmitOrder} className="space-y-3 text-xs">
              {/* Nama Customer */}
              <div>
                <label className="block font-bold text-amber-900 mb-1">Nama Customer *</label>
                <input
                  type="text"
                  required
                  placeholder="Nama pembeli..."
                  value={formData.buyerName}
                  onChange={(e) => setFormData({ ...formData, buyerName: e.target.value })}
                  className="w-full bg-white border-2 border-amber-300 rounded-xl p-2 font-medium outline-none text-amber-950"
                />
              </div>

              {/* Dropdown Scroll Medsos & Input Kontak */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-amber-900 mb-1">Medsos/Kontak</label>
                  <select
                    value={formData.platform}
                    onChange={(e) => setFormData({ ...formData, platform: e.target.value, contactValue: '' })}
                    className="w-full bg-white border-2 border-amber-300 rounded-xl p-2 font-bold text-amber-950 outline-none cursor-pointer"
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="instagram">Instagram</option>
                    <option value="line">Line</option>
                    <option value="tiktok">TikTok</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-amber-900 mb-1">
                    {formData.platform === 'whatsapp' ? 'Nomor WA (Angka) *' : `Username ${formData.platform.toUpperCase()} *`}
                  </label>
                  <input
                    type='text'
                    required
                    placeholder={formData.platform === 'whatsapp' ? '08123456789' : '@username'}
                    value={formData.contactValue}
                    onChange={(e) => setFormData({ ...formData, contactValue: e.target.value })}
                    className="w-full bg-white border-2 border-amber-300 rounded-xl p-2 font-medium outline-none text-amber-950"
                  />
                </div>
              </div>

              {/* Qty & Status Pembayaran */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-amber-900 mb-1">Jumlah (Qty) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full bg-white border-2 border-amber-300 rounded-xl p-2 font-medium outline-none text-amber-950"
                  />
                </div>

                <div>
                  <label className="block font-bold text-amber-900 mb-1">Status Pembayaran</label>
                  <select
                    value={formData.paymentStatus}
                    onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                    className="w-full bg-white border-2 border-amber-300 rounded-xl p-2 font-bold text-amber-950 outline-none cursor-pointer"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="PAID">PAID</option>
                  </select>
                </div>
              </div>

              {/* Detail / Catatan Khusus */}
              <div>
                <label className="block font-bold text-amber-900 mb-1">Detail / Catatan Khusus</label>
                <textarea
                  rows="2"
                  placeholder="Warna, ukuran, request khusus..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-white border-2 border-amber-300 rounded-xl p-2 font-medium outline-none text-amber-950 resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 rounded-xl transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold py-2 rounded-xl transition-all shadow-sm"
                >
                  Simpan Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
