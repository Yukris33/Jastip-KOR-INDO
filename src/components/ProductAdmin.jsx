
import React, { useState, useEffect } from "react";
import { getProducts, createProduct, updateProduct, deleteProduct } from "../api/client";
import { PlusCircle, Upload, Trash2, Sparkles, RefreshCw, Pencil, X } from "lucide-react";
import Swal from "sweetalert2";

export default function ProductAdmin({ setActiveTab }) {
  const [products, setProducts] = useState([]);
  const [name, setName] = useState("");
  const [priceKrw, setPriceKrw] = useState("");
  const [editingProductId, setEditingProductId] = useState(null);
  
  // State kurs untuk konversi modal KRW ke IDR
  const [liveRate, setLiveRate] = useState(11.8); // Default fallback rate
  const [isLoadingRate, setIsLoadingRate] = useState(true);
  
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    fetchProducts();
    fetchLiveExchangeRate();
  }, []);

  // Fetch Kurs Real-time dari API publik
  const fetchLiveExchangeRate = async () => {
    setIsLoadingRate(true);
    try {
      const res = await fetch("https://open.er-api.com/v6/latest/KRW");
      const data = await res.json();
      if (data && data.rates && data.rates.IDR) {
        setLiveRate(data.rates.IDR);
      }
    } catch (err) {
      console.error("Gagal mengambil kurs otomatis, memakai rate fallback:", err);
    } finally {
      setIsLoadingRate(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await getProducts();
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Upload Gambar dari File Komputer
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result);
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

      //edit product
      const handleEditClick = (product) => {
      setEditingProductId(product.id);
      setName(product.name || "");
      setPriceKrw(String(product.price_krw ?? ""));
      setImageUrl(product.image_url || "");
      setImagePreview(product.image_url || null);
    };

    const handleCancelEdit = () => {
      setEditingProductId(null);
      setName("");
      setPriceKrw("");
      setImageUrl("");
      setImagePreview(null);
    };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !priceKrw) {
      Swal.fire({ title: '🐥 Wajib Diisi!', text: 'Nama dan Harga Korea (KRW) belum diisi ya!', icon: 'warning' });
      return;
    }

    const priceOriginalKrw = Number(priceKrw);
    // Harga IDR dan Fee Jastip dihitung oleh backend, bukan di form ini.

      const productData = {
     name,
     price_krw: priceOriginalKrw, // Harga barang Korea
     exchange_rate: liveRate, // Kurs sebenarnya
     image_url: imageUrl || "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500", // Gambar
    };

try {
  if (editingProductId !== null) {
    await updateProduct(editingProductId, productData); // PUT: update produk lama

    await Swal.fire({
      title: "🐻 Produk Berhasil Diperbarui!",
      text: "Perubahan produk berhasil disimpan.",
      icon: "success",
      confirmButtonColor: "#fbbf24",
    });

  } else {
    await createProduct(productData); // POST: simpan produk baru

    await Swal.fire({
      title: "🐻 Produk Berhasil Ditambah!",
      text: `Kurs Rp ${liveRate.toFixed(2)}. Fee Jastip diatur di Katalog.`, // Jangan kirim markup kedua
      icon: "success",
      confirmButtonColor: "#fbbf24",
    });
  }

  handleCancelEdit(); // Reset form setelah berhasil
  await fetchProducts(); // Refresh daftar produk

  if (setActiveTab) {
    setActiveTab("catalog"); // Pindah ke katalog
  }

} catch (err) {
  const status = err.response?.status; // Ambil status HTTP
  const detail = err.response?.data?.detail; // Ambil detail error FastAPI

  const message = Array.isArray(detail)
    ? detail.map(item => item.msg).join("; ") // Error validasi 422
    : typeof detail === "string"
      ? detail // Pesan error dari backend
      : err.message || "Terjadi kesalahan"; // Error lainnya

  console.error("Gagal menyimpan produk:", err); // Detail di Console browser

  Swal.fire({
    title: "Gagal Menyimpan",
    text: `HTTP ${status ?? "Network"}: ${message}`, // Tampilkan penyebab
    icon: "error",
  });
}
};

  return (
    <div className="space-y-6 relative z-10 font-fredoka">
      {/* Form Tambah Produk Imut */}
      <div className="bg-amber-100/90 border-4 border-amber-300 rounded-3xl p-3 sm:p-6 shadow-md space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-amber-400 p-2.5 rounded-2xl border-2 border-amber-600 text-amber-950">
              <PlusCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-amber-950">
                {editingProductId !== null ? "Edit Produk Jastip ✏️" : "Tambah Produk Jastip Baru 🛍️✨"}
              </h2>
              <p className="text-amber-800 text-xs font-bold">
                Rate konversi terhubung otomatis dengan pasar mata uang real-time!
              </p>
            </div>
          </div>

          {/* Indicator Rate Live */}
          <div className="bg-white/90 border-2 border-amber-300 px-3 py-2 rounded-2xl flex items-center gap-2 text-xs font-bold text-amber-900 shadow-sm">
            <span>🔀 Live Rate: <strong>₩1 = Rp {liveRate.toFixed(2)}</strong></span>
            <button
              type="button"
              onClick={fetchLiveExchangeRate}
              className="p-1 hover:bg-amber-100 rounded-lg transition-all"
              title="Refresh Rate"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-700 ${isLoadingRate ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-3 sm:p-5 rounded-2xl border-2 border-amber-200 space-y-4 shadow-inner">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-amber-900 mb-1">📦 Nama Produk:</label>
              <input
                type="text"
                placeholder="Contoh: Doll Line Friends..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 bg-amber-50 border-2 border-amber-200 rounded-xl text-xs font-bold text-amber-950 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-amber-900 mb-1">₩ Harga Korea (KRW):</label>
              <input
                type="number"
                placeholder="Contoh: 15000"
                value={priceKrw}
                onChange={(e) => setPriceKrw(e.target.value)}
                className="w-full p-2.5 bg-amber-50 border-2 border-amber-200 rounded-xl text-xs font-bold text-amber-950 focus:outline-none focus:border-amber-400"
              />
            </div>

          </div>

          {/* File Upload & URL Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-black text-amber-900 mb-1">📁 Upload Gambar dari File Komputer:</label>
              <div className="flex items-center justify-center border-2 border-dashed border-amber-300 bg-amber-50 p-3 rounded-2xl cursor-pointer hover:bg-amber-100/60 transition-all">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-amber-800">
                  <Upload className="w-4 h-4 text-amber-600" />
                  <span>Pilih File Gambar...</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-amber-900 mb-1">🌐 Atau Paste Link URL Gambar:</label>
              <input
                type="text"
                placeholder="https://..."
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  setImagePreview(e.target.value);
                }}
                className="w-full p-2.5 bg-amber-50 border-2 border-amber-200 rounded-xl text-xs font-bold text-amber-950 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {imagePreview && (
            <div className="flex items-center gap-3 bg-amber-100/50 p-2 rounded-xl border border-amber-300">
              <img src={imagePreview} alt="Preview" className="w-14 h-14 object-cover rounded-lg border border-amber-400" />
              <span className="text-xs font-bold text-emerald-700">🟢 Foto Siap Diupload!</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-amber-400 hover:bg-amber-500 text-amber-950 font-black rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 border-2 border-amber-500 cursor-pointer text-sm"
          >
            <Sparkles className="w-4 h-4" />
            <span>{editingProductId !== null ? "Simpan Perubahan ✨": "Simpan Produk ke Katalog 🐻"}
</span>
          </button>
              {editingProductId !== null && (
      <button
        type="button"
        onClick={handleCancelEdit}
        className="w-full py-2 bg-white border-2 border-amber-300 text-amber-900 font-bold rounded-xl"
      >
        <X className="w-4 h-4 inline mr-2" />
        Batal Edit
      </button>
    )}
            </form>
      </div>

      {/* Tabel Ringkasan */}
      <div className="bg-white rounded-3xl border-4 border-amber-300 p-5 shadow-sm space-y-3">
        <h3 className="font-black text-amber-950 text-base flex items-center gap-2">
          📋 Daftar Ringkasan Produk ({products.length})
        </h3>
        <div className="w-full max-w-full overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-xs font-bold text-amber-950">
            <thead className="bg-amber-100 text-amber-900 rounded-xl">
              <tr>
                <th className="p-3">Produk</th>
                <th className="p-3">Harga KRW</th>
                <th className="p-3">Modal IDR</th>
                <th className="p-3">Rate Live</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100">
              
{products.map((p) => (
  <tr key={p.id} className="hover:bg-amber-50/50">

    {/* Nama dan gambar produk */}
    <td className="p-3">
      <div className="flex items-center gap-3">
        <img
          src={p.image_url}
          alt={p.name}
          className="w-12 h-12 rounded-lg object-cover"
        />
        <span className="font-bold text-amber-950">
          {p.name}
        </span>
      </div>
    </td>

    {/* Harga asli dalam KRW */}
    <td className="p-3 text-center">
      ₩{Number(p.price_krw ?? 0).toLocaleString("ko-KR")}
    </td>

    {/* Modal IDR dari database (fee jastip terpisah di katalog) */}
    <td className="p-3 text-center">
      Rp {Number(p.price_idr ?? 0).toLocaleString("id-ID")}
    </td>

    {/* Kurs yang tersimpan pada produk */}
    <td className="p-3 text-center">
      1 KRW = Rp{" "}
      {Number(p.exchange_rate ?? liveRate).toLocaleString("id-ID")}
    </td>

    {/* Tombol Edit dan Hapus */}
    <td className="p-3 text-center">
      <div className="flex items-center justify-center gap-2">

        <button
          type="button"
          onClick={() => handleEditClick(p)}
          className="p-1.5 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200"
          title="Edit produk"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => deleteProduct(p.id).then(fetchProducts)}
          className="p-1.5 bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-200"
          title="Hapus produk"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>

      </div>
    </td>
  </tr>
))}


                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            }
