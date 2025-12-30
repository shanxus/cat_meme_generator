
import React from 'react';

interface HeaderProps {
  activeTab: 'create' | 'gallery';
  setActiveTab: (tab: 'create' | 'gallery') => void;
}

const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  return (
    <header className="bg-orange-500 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div 
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => setActiveTab('create')}
        >
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-orange-500 group-hover:rotate-12 transition-transform">
            <i className="fa-solid fa-cat text-xl"></i>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">CatMemeGen</h1>
        </div>

        <nav className="flex gap-1 bg-orange-600 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'create' 
                ? 'bg-white text-orange-500 shadow-sm' 
                : 'hover:bg-orange-500/50 text-orange-100'
            }`}
          >
            <i className="fa-solid fa-plus-circle mr-2"></i>
            Create
          </button>
          <button
            onClick={() => setActiveTab('gallery')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'gallery' 
                ? 'bg-white text-orange-500 shadow-sm' 
                : 'hover:bg-orange-500/50 text-orange-100'
            }`}
          >
            <i className="fa-solid fa-images mr-2"></i>
            Gallery
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
