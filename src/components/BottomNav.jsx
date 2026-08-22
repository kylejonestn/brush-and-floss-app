import React from 'react';
import { User, Settings, Droplet, LayoutDashboard, FileText } from 'lucide-react';

export default function BottomNav({ onLogBrush, onToggleSettings, showSettings }) {
  return (
    <div className="fixed bottom-0 w-full max-w-md bg-[#2d3a70] text-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] px-6 py-4 flex justify-between items-center z-50">
      
      {/* Dashboard Button */}
      <button 
        onClick={() => onToggleSettings(false)}
        className={`flex flex-col items-center p-2 transition-colors ${!showSettings ? 'text-white' : 'text-indigo-300'}`}
      >
        <LayoutDashboard size={24} />
      </button>

      {/* spacer for center button */}
      <div className="w-16"></div>

      {/* Center Big Log Button */}
      <div className="absolute left-1/2 -translate-x-1/2 -top-6">
        <button 
          onClick={onLogBrush}
          className="bg-[#2d3a70] text-white p-5 rounded-full shadow-[0_8px_30px_rgba(45,58,112,0.5)] border-[6px] border-white active:scale-95 transition-transform"
        >
          <Droplet size={32} />
        </button>
      </div>

      {/* Settings Button */}
      <button 
        onClick={() => onToggleSettings(true)}
        className={`flex flex-col items-center p-2 transition-colors ${showSettings ? 'text-white' : 'text-indigo-300'}`}
      >
        <Settings size={24} />
      </button>

    </div>
  );
}
