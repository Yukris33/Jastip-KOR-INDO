
import React, { useState, useEffect, useCallback } from "react";
import {
  getOrders,
  updateOrderStatus,
  getProducts,
  editOrder,
} from "../api/client";
import Swal from "sweetalert2";

// ==========================================
// SWEETALERT THEME
// ==========================================
const lineSwal = Swal.mixin({
  customClass: {
    popup:
      "rounded-3xl border-4 border-amber-300 shadow-2xl bg-amber-50 font-sans",
    title:
      "text-amber-950 font-black text-xl flex items-center justify-center gap-2",
    htmlContainer:
      "text-amber-900 font-semibold text-sm",
    confirmButton:
      "bg-amber-400 hover:bg-amber-500 text-amber-950 font-black px-6 py-2.5 rounded-2xl shadow-md border-2 border-amber-500 mx-1 cursor-pointer",
    cancelButton:
      "bg-rose-200 hover:bg-rose-300 text-rose-900 font-black px-6 py-2.5 rounded-2xl shadow-md border-2 border-rose-300 mx-1 cursor-pointer",
  },
  buttonsStyling: false,
});

// ==========================================
// ORDER ADMIN COMPONENT
// ==========================================
export default function OrderAdmin() {

  // ========================================
  // STATE DATA ORDER
  // ========================================
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [productNames, setProductNames] = useState({});

  // ========================================
  // STATE EDIT ORDER
  // ========================================
  const [editingOrder, setEditingOrder] = useState(null);
  const [editStatus, setEditStatus] = useState("PENDING");
  const [editNotes, setEditNotes] = useState("");

  // State kontak customer
  const [editContactPlatform, setEditContactPlatform] = useState("");
  const [editContactValue, setEditContactValue] = useState("");

  // Cegah tombol simpan ditekan berkali-kali
  const [isSaving, setIsSaving] = useState(false);

  // ========================================
  // FETCH ORDERS DARI FASTAPI
  // ========================================
  const fetchOrders = useCallback(async (silent = false) => {
    try {
      const res = await getOrders(); // GET /orders/

      if (!Array.isArray(res.data)) {
        throw new Error("Format data order tidak valid");
      }

      setOrders(res.data); // Update daftar order di React
      return true;

    } catch (err) {
      console.error("Gagal mengambil order:", err);

      if (!silent) {
        const detail = err.response?.data?.detail;

        await lineSwal.fire({
          title: "Gagal Memuat Order",
          text:
            typeof detail === "string"
              ? detail
              : err.message || "Koneksi backend bermasalah",
          icon: "error",
        });
      }

      return false;
    }
  }, []);

  // ========================================
  // FETCH NAMA PRODUK
  // ========================================
  const fetchProductNames = useCallback(async () => {
    try {
      const res = await getProducts(); // GET /products/

      if (!Array.isArray(res.data)) {
        throw new Error("Data produk bukan array");
      }

      const names = Object.fromEntries(
        res.data.map((p) => [p.id, p.name])
      );

      setProductNames(names);

    } catch (err) {
      console.error("Gagal mengambil nama produk:", err);
    }
  }, []);

  // ========================================
  // AUTO REFRESH DATABASE
  // ========================================
  useEffect(() => {

    fetchOrders(); // Ambil data saat halaman dibuka
    fetchProductNames(); // Ambil nama produk

    // Setiap 5 detik mengambil ulang data dari API
    const interval = setInterval(() => { //setInterval bawaan JS yg menjalnkan callback secara ulang
      fetchOrders(true);
    }, 5000);

    // Hentikan interval ketika komponen ditutup
    return () => clearInterval(interval);

  }, [fetchOrders, fetchProductNames]);

  // ========================================
  // MEMBUKA MODAL EDIT ORDER
  // ========================================
  const openEditor = (order) => {

    setEditingOrder(order); // Simpan order yang dipilih

    setEditStatus(order.status); // Status sebelumnya

    setEditNotes(order.notes ?? ""); // Notes sebelumnya

    // Ambil data kontak dari backend
    setEditContactPlatform(
      (order.contact_platform ?? "").toLowerCase()
    );

    setEditContactValue(
      order.contact_value ?? ""
    );
  };

  // ========================================
  // MENYIMPAN PERUBAHAN ORDER
  // ========================================
  const saveOrder = async () => {

    if (!editingOrder || isSaving) return;

    // Bersihkan nilai kontak
    const platform = editContactPlatform || null;
    const contact = editContactValue.trim() || null;

    // Validasi platform dan nomor harus terisi bersama
    if (Boolean(platform) !== Boolean(contact)) {

      await lineSwal.fire({
        title: "Kontak Tidak Lengkap",
        text:
          "Pilih platform dan isi nomor/username, atau kosongkan keduanya.",
        icon: "warning",
      });

      return;
    }

    setIsSaving(true);

    try {

      // PATCH /orders/{id}
      // Mengirim perubahan ke FastAPI
      await editOrder(editingOrder.id, {

        status: editStatus, // Status terbaru

        notes: editNotes, // Catatan terbaru

        contact_platform: platform, // Platform kontak

        contact_value: contact, // Nomor/username

      });

      // Ambil ulang data terbaru dari PostgreSQL
      const refreshed = await fetchOrders(true);

      // Tutup modal setelah PATCH berhasil
      setEditingOrder(null);

      if (refreshed) {
        await lineSwal.fire({
          title: "Berhasil! 🎉",
          text: "Perubahan order berhasil disimpan.",
          icon: "success",
        });
      } else {
        await lineSwal.fire({
          title: "Tersimpan",
          text:
            "Perubahan berhasil dikirim, tetapi daftar order belum berhasil dimuat ulang.",
          icon: "warning",
        });
      }

    } catch (err) {

      console.error("Gagal mengedit order:", err);

      const detail = err.response?.data?.detail;

      await lineSwal.fire({
        title: "Gagal Menyimpan",
        text:
          typeof detail === "string"
            ? detail
            : err.message || "Terjadi kesalahan saat menyimpan.",
        icon: "error",
      });

    } finally {

      setIsSaving(false); // Aktifkan kembali tombol Simpan

    }
  };

  // ========================================
  // QUICK ACTION: COMPLETE ORDER
  // ========================================
  const handleStatusChange = async (id, newStatus) => {

    const result = await lineSwal.fire({
      title: "🐻 Ubah Status Pesanan?",
      text: `Ubah status order ini menjadi "${newStatus}"?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Ubah! ✨",
      cancelButtonText: "Batal 🐰",
    });

    if (!result.isConfirmed) return;

    try {

      await updateOrderStatus(id, newStatus); // PATCH status

      await fetchOrders(true); // Ambil ulang order

      await lineSwal.fire({
        title: "🎉 Berhasil Diubah!",
        text: "Status pesanan berhasil diperbarui!",
        icon: "success",
      });

    } catch (err) {

      console.error("Gagal memperbarui status:", err);

      await lineSwal.fire({
        title: "Oops...",
        text: "Gagal memperbarui status order.",
        icon: "error",
      });
    }
  };

  // ========================================
  // FILTER ORDER BERDASARKAN STATUS
  // ========================================
  const filteredOrders = orders.filter((o) => {

    if (filter === "ALL") return true;

    return o.status === filter;

  });

  // ========================================
  // STATUS BADGE COLOR
  // ========================================
  const getStatusColor = (status) => {

    switch (status) {

      case "PAID":
        return "bg-emerald-100 text-emerald-900 border-emerald-300";

      case "SHIPPED":
        return "bg-purple-100 text-purple-900 border-purple-300";

      case "COMPLETED":
        return "bg-blue-100 text-blue-900 border-blue-300";

      case "PENDING":
        return "bg-amber-100 text-amber-900 border-amber-300";

      case "CANCELLED":
        return "bg-rose-100 text-rose-900 border-rose-300";

      default:
        return "bg-gray-100 text-gray-900 border-gray-300";
    }
  };

  // ========================================
  // RENDER HALAMAN
  // ========================================
  return (

    <div className="space-y-6 font-sans">

      {/* ====================================
          HEADER DAN FILTER STATUS
      ==================================== */}
      <div className="bg-amber-100/90 border-4 border-amber-300 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">

        <div>

          <h1 className="text-2xl font-black text-amber-950 flex items-center gap-2">
            Manajemen Order 🐻📋
          </h1>

          <p className="text-amber-800 text-xs font-semibold mt-0.5">
            Kelola dan perbarui pesanan pelanggan dengan mudah! ✨
          </p>

        </div>

        {/* Filter status */}
        <div className="grid w-full grid-cols-2 gap-2 bg-white p-2 rounded-2xl border-2 border-amber-200 shadow-sm sm:flex sm:w-auto sm:flex-wrap">

          {[
            "ALL",
            "PENDING",
            "PAID",
            "SHIPPED",
            "COMPLETED",
            "CANCELLED",
          ].map((st) => (

            <button
              key={st}
              type="button"
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                filter === st
                  ? "bg-amber-400 text-amber-950 border-2 border-amber-500 shadow-xs"
                  : "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200"
              }`}
            >
              {st}
            </button>

          ))}

        </div>

      </div>

      {/* ====================================
          TABEL ORDER
      ==================================== */}
      <div className="bg-white rounded-3xl border-4 border-amber-800/20 overflow-hidden shadow-md">

        <div className="overflow-x-auto">

          <table className="w-full min-w-[750px] text-left border-collapse">

            <thead>

              <tr className="bg-amber-100/60 border-b-2 border-amber-200 text-amber-950 text-xs font-black">

                <th className="p-4">ID / Customer</th>
                <th className="p-4">Items</th>
                <th className="p-4">Total IDR</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Quick Action</th>

              </tr>

            </thead>

            <tbody className="divide-y divide-amber-100 text-xs font-bold text-amber-950">

              {filteredOrders.length === 0 ? (

                <tr>

                  <td
                    colSpan={5}
                    className="text-center p-8 text-amber-700 font-semibold"
                  >
                    🐻 Belum ada data order untuk status ini!
                  </td>

                </tr>

              ) : (

                filteredOrders.map((o) => (

                  <tr
                    key={o.id}
                    className="hover:bg-amber-50/50 transition-colors"
                  >

                    {/* ======================
                        CUSTOMER
                    ====================== */}
                    <td className="p-4">

                      <div className="font-black text-sm text-amber-950">
                        #{o.id} - {o.customer_name}
                      </div>

                      {/* Tanggal */}
                      <div className="text-[10px] text-amber-600 font-semibold">

                        {o.created_at
                          ? new Date(o.created_at).toLocaleDateString("id-ID")
                          : "-"}

                      </div>

                      {/* Kontak customer */}
                      {o.contact_platform && o.contact_value ? (

                        <div className="text-xs text-amber-800 mt-1">

                          <span className="font-bold">
                            {o.contact_platform.toUpperCase()}:
                          </span>

                          {" "}

                          {o.contact_value}

                        </div>

                      ) : (

                        <div className="text-xs text-gray-400 mt-1">
                          Kontak belum tercatat
                        </div>

                      )}

                      {/* Notes customer */}
                      {o.notes?.trim() ? (

                        <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">

                          <span className="font-bold text-amber-900">
                            📝 Notes:
                          </span>

                          <p className="text-xs text-amber-800 whitespace-pre-wrap break-words">
                            {o.notes}
                          </p>

                        </div>

                      ) : (

                        <div className="text-xs text-gray-400 mt-1">
                          Tidak ada catatan
                        </div>

                      )}

                    </td>

                    {/* ======================
                        ITEMS
                    ====================== */}
                    <td className="p-4 text-amber-800 font-medium">

                      {o.items?.length > 0 ? (

                        o.items.map((item, idx) => (

                          <div key={item.id ?? idx}>

                            {productNames[item.product_id] ||
                              `Produk ID ${item.product_id}`}

                            {" × "}

                            {item.quantity}

                          </div>

                        ))

                      ) : (

                        "Tidak ada item"

                      )}

                    </td>

                    {/* ======================
                        TOTAL IDR
                    ====================== */}
                    <td className="p-4 font-black text-amber-600 text-sm">

                      Rp{" "}

                      {o.total_idr != null
                        ? Number(o.total_idr).toLocaleString("id-ID")
                        : "0"}

                    </td>

                    {/* ======================
                        STATUS ORDER
                    ====================== */}
                    <td className="p-4">

                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${getStatusColor(o.status)}`}
                      >
                        {o.status}
                      </span>

                    </td>

                    {/* ======================
                        QUICK ACTION
                    ====================== */}
                    <td className="p-4 text-center">

                      <div className="flex justify-center gap-2">

                        {/* Tombol Edit */}
                        <button
                          type="button"
                          onClick={() => openEditor(o)}
                          className="bg-amber-400 hover:bg-amber-500 text-amber-950 px-3 py-1.5 rounded-xl font-black border border-amber-500 cursor-pointer"
                        >
                          ✏️ Edit
                        </button>

                        {/* Tombol Complete */}
                        {o.status !== "COMPLETED" &&
                          o.status !== "CANCELLED" && (

                          <button
                            type="button"
                            onClick={() =>
                              handleStatusChange(o.id, "COMPLETED")
                            }
                            className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-xl font-black border border-emerald-600 cursor-pointer"
                          >
                            Complete ✨
                          </button>

                        )}

                      </div>

                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* ====================================
          MODAL EDIT ORDER
      ==================================== */}
      {editingOrder && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="w-full min-w-0 max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto space-y-4 rounded-3xl border-4 border-amber-300 bg-amber-50 p-3 sm:p-6 shadow-2xl">

            {/* Judul modal */}
            <h2 className="text-xl font-black text-amber-950">
              ✏️ Edit Order #{editingOrder.id}
            </h2>

            <p className="text-sm text-amber-800">
              Customer: {editingOrder.customer_name}
            </p>

            {/* ============================
                EDIT STATUS
            ============================ */}
            <div>

              <label
                htmlFor="edit-order-status"
                className="mb-2 block text-sm font-bold text-amber-900"
              >
                Status Order
              </label>

              <select
                id="edit-order-status"
                value={editStatus}
                onChange={(e) =>
                  setEditStatus(e.target.value)
                }
                className="w-full rounded-xl border-2 border-amber-300 bg-white p-3 text-amber-950"
              >

                <option value="PENDING">PENDING</option>
                <option value="PAID">PAID</option>
                <option value="SHIPPED">SHIPPED</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>

              </select>

              <p className="mt-1 text-xs text-amber-700">
                Pilih PAID hanya setelah pembayaran diverifikasi.
              </p>

            </div>

            {/* ============================
                EDIT NOTES
            ============================ */}
            <div>

              <label
                htmlFor="edit-order-notes"
                className="mb-2 block text-sm font-bold text-amber-900"
              >
                Notes Customer
              </label>

              <textarea
                id="edit-order-notes"
                value={editNotes}
                onChange={(e) =>
                  setEditNotes(e.target.value)
                }
                rows={4}
                maxLength={2000}
                placeholder="Contoh: size L, warna hitam"
                className="w-full resize-y rounded-xl border-2 border-amber-300 bg-white p-3 text-amber-950"
              />

            </div>

            {/* ============================
                EDIT PLATFORM KONTAK
            ============================ */}
            <div>

              <label
                htmlFor="edit-contact-platform"
                className="mb-2 block text-sm font-bold text-amber-900"
              >
                Platform Kontak
              </label>

              <select
                id="edit-contact-platform"
                value={editContactPlatform}
                onChange={(e) => {

                  const platform = e.target.value;

                  setEditContactPlatform(platform);

                  // Kosongkan nomor jika platform dihapus
                  if (!platform) {
                    setEditContactValue("");
                  }

                }}
                className="w-full rounded-xl border-2 border-amber-300 bg-white p-3 text-amber-950"
              >

                <option value="">Tidak ada kontak</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="instagram">Instagram</option>
                <option value="line">LINE</option>
                <option value="tiktok">TikTok</option>

              </select>

            </div>

            {/* ============================
                EDIT NOMOR / USERNAME
            ============================ */}
            <div>

              <label
                htmlFor="edit-contact-value"
                className="mb-2 block text-sm font-bold text-amber-900"
              >
                Nomor / Username Customer
              </label>

              <input
                id="edit-contact-value"
                type="text"
                value={editContactValue}
                onChange={(e) =>
                  setEditContactValue(e.target.value)
                }
                disabled={!editContactPlatform}
                maxLength={100}
                placeholder="08123456789 atau @username"
                className="w-full rounded-xl border-2 border-amber-300 bg-white p-3 text-amber-950 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />

            </div>

            {/* ============================
                TOMBOL SIMPAN DAN BATAL
            ============================ */}
            <div className="flex justify-end gap-3 pt-2">

              <button
                type="button"
                onClick={() => setEditingOrder(null)}
                disabled={isSaving}
                className="rounded-xl bg-gray-200 px-4 py-2 font-bold text-gray-800 hover:bg-gray-300 disabled:opacity-50"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={saveOrder}
                disabled={isSaving}
                className="rounded-xl bg-amber-400 px-4 py-2 font-black text-amber-950 hover:bg-amber-500 disabled:opacity-50"
              >

                {isSaving
                  ? "Menyimpan..."
                  : "Simpan Perubahan"}

              </button>

            </div>

          </div>

        </div>

      )}

    </div>

  );
}
