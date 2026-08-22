const fs = require('fs');
let file = fs.readFileSync('src/components/Settings.jsx', 'utf8');

file = file.replace(
  "import BulkManager from './BulkManager';",
  "import BulkManager from './BulkManager';\nimport { Lock, Image as ImageIcon } from 'lucide-react';"
);

const customWallpaperHTML = `
      <div className="mb-8 border-b pb-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <ImageIcon size={20} className="text-[#3b82f6]" />
            Custom Wallpaper
          </h3>
          {globalCurrentStreak >= 15 ? (
            <span className="bg-emerald-100 text-emerald-700 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">Unlocked</span>
          ) : (
            <span className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1"><Lock size={12}/> Locked</span>
          )}
        </div>

        {globalCurrentStreak >= 15 ? (
          <div className="animate-fade-in-up">
            <p className="text-sm text-gray-600 mb-4">
              You maintained a 15-day streak! Paste a URL to an image or GIF to use as your custom background.
            </p>
            <input 
              type="text" 
              placeholder="https://example.com/image.gif" 
              value={customBackgroundUrl}
              onChange={(e) => onUpdateCustomBackground(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#2d3a70] shadow-sm transition-all"
            />
          </div>
        ) : (
          <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200"></div>
            <p className="text-sm text-gray-600">Reach a <strong className="text-gray-800">15-day streak</strong> to unlock custom wallpapers and GIFs.</p>
            <p className="text-xs text-gray-400 mt-2 font-medium tracking-wide uppercase">Current Streak: {globalCurrentStreak} days</p>
          </div>
        )}
      </div>

      <div className="mb-8 border-b pb-8">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-xl font-semibold text-gray-800">Cloud Sync</h3>`;

file = file.replace(
  `      <div className="mb-8 border-b pb-8">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-xl font-semibold text-gray-800">Cloud Sync</h3>`,
  customWallpaperHTML
);

fs.writeFileSync('src/components/Settings.jsx', file);
