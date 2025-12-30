
import React from 'react';
import { MemeItem, MemeType } from '../types';

interface MemeGalleryProps {
  history: MemeItem[];
  onClear: () => void;
}

const MemeGallery: React.FC<MemeGalleryProps> = ({ history, onClear }) => {
  const handleDownload = (item: MemeItem) => {
    const link = document.createElement('a');
    link.href = item.url;
    link.download = `cat-meme-${item.id}.${item.type === MemeType.PHOTO ? 'png' : 'mp4'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (history.length === 0) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto text-orange-400">
          <i className="fa-solid fa-box-open text-4xl"></i>
        </div>
        <h2 className="text-2xl font-bold text-orange-900">Your Gallery is Empty</h2>
        <p className="text-orange-600/60 max-w-sm mx-auto">Go back to the creator and unleash your creativity. Your awesome cat memes will show up here!</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-orange-900">Your Creations ({history.length})</h2>
        <button 
          onClick={onClear}
          className="text-orange-400 hover:text-red-500 font-medium transition-colors flex items-center gap-2"
        >
          <i className="fa-solid fa-trash-can text-sm"></i>
          Clear All
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {history.map((item) => (
          <div 
            key={item.id} 
            className="bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-all border border-orange-50 group flex flex-col"
          >
            <div className="aspect-video relative bg-gray-100 flex items-center justify-center overflow-hidden">
              {item.type === MemeType.PHOTO ? (
                <img src={item.url} alt={item.prompt} className="w-full h-full object-cover" />
              ) : (
                <video src={item.url} className="w-full h-full object-cover" muted loop onMouseOver={(e) => e.currentTarget.play()} onMouseOut={(e) => e.currentTarget.pause()} />
              )}
              
              <div className="absolute top-3 right-3 px-3 py-1 bg-white/90 backdrop-blur rounded-full text-xs font-bold text-orange-600 shadow-sm">
                {item.type === MemeType.PHOTO ? 'PHOTO' : 'VIDEO'}
              </div>

              {item.type === MemeType.VIDEO && (
                <div className="absolute inset-0 flex items-center justify-center opacity-100 group-hover:opacity-0 transition-opacity pointer-events-none">
                  <div className="w-12 h-12 rounded-full bg-white/30 backdrop-blur flex items-center justify-center text-white">
                    <i className="fa-solid fa-play"></i>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 flex-1 flex flex-col">
              <p className="text-gray-700 font-medium line-clamp-2 mb-4 italic flex-1">
                "{item.prompt}"
              </p>
              
              <div className="flex items-center justify-between pt-4 border-t border-orange-50">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
                <button 
                  onClick={() => handleDownload(item)}
                  className="w-10 h-10 rounded-full bg-orange-100 text-orange-500 hover:bg-orange-500 hover:text-white transition-all flex items-center justify-center"
                >
                  <i className="fa-solid fa-download text-sm"></i>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MemeGallery;
