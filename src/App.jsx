import React, { useState } from 'react';
import Navbar from './components/Navbar';
import CustomerCatalog from './components/CustomerCatalog';
import ProductAdmin from './components/ProductAdmin';
import OrderAdmin from './components/OrderAdmin';
import FallingLeaves from './components/FallingLeaves';

function App() {
  const [activeTab, setActiveTab] = useState('catalog');
  const [currentChar, setCurrentChar] = useState('Brown');

  return (
    <div className="min-h-screen bg-[#FFFDF0] text-amber-950 font-sans pb-12">
      {/* Navbar Header */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content View */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 mt-6">
        {activeTab === 'catalog' && <CustomerCatalog character={currentChar} setCharacter={setCurrentChar} />}
        {activeTab === 'add-product' && <ProductAdmin setActiveTab={setActiveTab} />}
        {activeTab === 'orders' && <OrderAdmin />}
      </main>
      <FallingLeaves character={currentChar} />
    </div>
  );
}

export default App;