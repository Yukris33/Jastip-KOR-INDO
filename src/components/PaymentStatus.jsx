import React, { useState, useEffect } from 'react';

export default function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Fetch daftar order dari backend FastAPI
  useEffect(() => {
    fetchOrders();
  }, [selectedStatus]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let url = 'http://127.0.0.1:8000/orders/';
      if (selectedStatus !== 'ALL') {
        url += `?status_filter=${selectedStatus}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('Gagal mengambil data order:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk update status order (PATCH /orders/{id}/status)
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {                                                                         
      const response = await fetch(`http://127.0.0.1:8000/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchOrders(); // Refresh daftar order
      } else {
        alert('Gagal memperbarui status order');
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Fungsi untuk hapus order (DELETE /orders/{id})
  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Yakin ingin menghapus order ini?')) return;

    try {
      const response = await fetch(`http://127.0.0.1:8000/orders/${orderId}`, {
        method: 'DELETE',
      });

      if (response.status === 204) {
        fetchOrders(); // Refresh daftar order
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-amber-100 border-4 border-amber-300 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-amber-950 flex items-center gap-2">
            Manajemen Order 🐻📋
          </h2>
          <p className="text-xs text-amber-800">
            Kelola dan perbarui status pesanan pelanggan dengan mudah! ✨
          </p>
        </div>

        {/* Filter Status Buttons */}
        <div className="flex flex-wrap gap-2 bg-amber-50/50 p-2 rounded-2xl border-2 border-amber-200">
          {['ALL', 'PENDING', 'PAID', 'COMPLETED', 'CANCELLED'].map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedStatus === status
                  ? 'bg-amber-400 text-amber-950 shadow-sm'
                  : 'bg-white text-amber-900 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Table Order */}
      <div className="bg-amber-50 border-4 border-amber-200 rounded-3xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-amber-100/60 text-amber-950 border-b-2 border-amber-200 text-xs font-bold">
              <th className="p-4">ID / Customer</th>
              <th className="p-4">Items</th>
              <th className="p-4">Total IDR</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-center">Quick Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-amber-200 text-xs font-semibold text-amber-950">
            {loading ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-amber-800">
                  Memuat data order dari database...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-amber-800">
                  🐻 Belum ada data order untuk status ini!
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-amber-100/40 transition-colors">
                  {/* ID & Customer Name */}
                  <td className="p-4">
                    <span className="font-bold text-amber-900">#{order.id}</span> - {order.customer_name}
                  </td>

                  {/* Items list */}
                  <td className="p-4">
                    {order.items && order.items.length > 0 ? (
                      <ul className="list-disc list-inside space-y-0.5">
                        {order.items.map((item, idx) => (
                          <li key={idx}>
                            Product ID: {item.product_id} x {item.quantity}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-gray-400 italic">Tidak ada detail item</span>
                    )}
                  </td>

                  {/* Total IDR */}
                  <td className="p-4 font-bold text-emerald-800">
                    Rp {(order.total_idr || 0).toLocaleString('id-ID')}
                  </td>

                  {/* Status Badge */}
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-bold ${
                        order.status === 'PAID'
                          ? 'bg-green-100 text-green-800 border border-green-300'
                          : order.status === 'COMPLETED'
                          ? 'bg-blue-100 text-blue-800 border border-blue-300'
                          : order.status === 'CANCELLED'
                          ? 'bg-red-100 text-red-800 border border-red-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>

                  {/* Quick Actions */}
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-1.5">
                      {order.status === 'PENDING' && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'PAID')}
                          className="bg-green-500 hover:bg-green-600 text-white font-bold px-2 py-1 rounded-lg text-[10px]"
                        >
                          Mark PAID
                        </button>
                      )}
                      {order.status === 'PAID' && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'COMPLETED')}
                          className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-2 py-1 rounded-lg text-[10px]"
                        >
                          Complete
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteOrder(order.id)}
                        className="bg-red-100 hover:bg-red-200 text-red-700 font-bold px-2 py-1 rounded-lg text-[10px] border border-red-300"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}