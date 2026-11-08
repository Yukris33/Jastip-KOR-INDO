import React from 'react';

const Navbar = ({ activeTab, setActiveTab }) => {
  return (
    <header className="bg-amber-100 border-b-2 border-amber-800 shadow-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-2 py-2 sm:px-4 sm:py-3 flex flex-col md:flex-row items-center justify-between gap-2 sm:gap-4">
        {/* Logo & Info */}
        <div className="flex items-center gap-3">
          <span className="text-3xl">🍀</span>
          <div>
            <h1 className="text-xl font-bold text-amber-900 tracking-wide">
              Jastip Line & Friends 🍀
            </h1>
            <p className="text-xs text-amber-700">
              Dashboard Pengelolaan Internal & Kalkulator Tax (Privat Mode)
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="grid w-full grid-cols-3 gap-2 md:w-auto">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`min-w-0 px-2 py-2 rounded-xl text-xs sm:px-4 sm:text-sm font-semibold transition-all border-2 ${
              activeTab === 'catalog'
                ? 'bg-amber-300 border-amber-800 text-amber-950 shadow-sm'
                : 'bg-white/80 border-amber-700/30 text-amber-800 hover:bg-amber-200/50'
            }`}
          >
            🛍️ Katalog & Tax
          </button>

          <button
            onClick={() => setActiveTab('add-product')}
            className={`min-w-0 px-2 py-2 rounded-xl text-xs sm:px-4 sm:text-sm font-semibold transition-all border-2 ${
              activeTab === 'add-product'
                ? 'bg-amber-300 border-amber-800 text-amber-950 shadow-sm'
                : 'bg-white/80 border-amber-700/30 text-amber-800 hover:bg-amber-200/50'
            }`}
          >
            ➕ Tambah Produk
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`min-w-0 px-2 py-2 rounded-xl text-xs sm:px-4 sm:text-sm font-semibold transition-all border-2 ${
              activeTab === 'orders'
                ? 'bg-amber-300 border-amber-800 text-amber-950 shadow-sm'
                : 'bg-white/80 border-amber-700/30 text-amber-800 hover:bg-amber-200/50'
            }`}
          >
            📋 Status Pembayaran
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;