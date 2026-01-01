
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import MemeCreator from './components/MemeCreator';
import MemeGallery from './components/MemeGallery';
import { MemeItem } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'create' | 'gallery'>('create');
  const [history, setHistory] = useState<MemeItem[]>([]);

  // Load history from local storage
  useEffect(() => {
    const saved = localStorage.getItem('cat_meme_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  const saveToHistory = (item: MemeItem) => {
    try {
      const newHistory = [item, ...history];
      setHistory(newHistory);
      localStorage.setItem('cat_meme_history', JSON.stringify(newHistory));
    } catch (e: any) {
      console.error("Storage Error:", e);
      if (e.name === 'QuotaExceededError' || e.message?.toLowerCase().includes('quota')) {
        throw new Error("STORAGE_FULL: Your history is full. Please clear some memes.");
      }
      throw e;
    }
  };

  const clearHistory = () => {
    if (window.confirm("Are you sure you want to clear your meme history?")) {
      setHistory([]);
      localStorage.removeItem('cat_meme_history');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
        {activeTab === 'create' ? (
          <MemeCreator onMemeGenerated={saveToHistory} />
        ) : (
          <MemeGallery history={history} onClear={clearHistory} />
        )}
      </main>

      <footer className="py-6 text-center text-orange-800/60 text-sm">
        <p>© 2024 Cat Meme Gen • Powered by Gemini AI • Made with 🐾</p>
      </footer>
    </div>
  );
};

export default App;
