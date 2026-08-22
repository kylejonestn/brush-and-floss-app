import React from 'react';
import { User, Settings, Droplet, LayoutDashboard, FileText } from 'lucide-react';
import { THEMES } from '../utils/themes';

export default function BottomNav({ onLogBrush, onToggleSettings, showSettings, themeIndex = 0 }) {
  const currentTheme = THEMES[themeIndex % THEMES.length];

  return (
    <div className={`fixed bottom-0 w-full max-w-md ${currentTheme.nav} text-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] px-6 py-4 flex justify-between items-center z-50 transition-colors duration-700`}>
      
      <button 
        onClick={() => onToggleSettings(false)}
        className={`flex flex-col items-center p-2 transition-colors ${!showSettings ? 'text-white' : 'text-white/50'}`}
      >
        <LayoutDashboard size={24} />
      </button>

      <div className="w-16"></div>

      <div className="absolute left-1/2 -translate-x-1/2 -top-6">
        <button 
          onClick={onLogBrush}
          className={`${currentTheme.nav} text-white p-5 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.3)] border-[6px] border-white active:scale-95 transition-all duration-300 hover:scale-105`}
        >
          <Droplet size={32} />
        </button>
      </div>

      <button 
        onClick={() => onToggleSettings(true)}
        className={`flex flex-col items-center p-2 transition-colors ${showSettings ? 'text-white' : 'text-white/50'}`}
      >
        <Settings size={24} />
      </button>

    </div>
  );
}
