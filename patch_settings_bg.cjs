const fs = require('fs');
let file = fs.readFileSync('src/components/Settings.jsx', 'utf8');

const unlockedStatsHTML = `
      <div className="mb-8 border-b pb-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-semibold text-gray-800">
            QR Wallpapers
          </h3>
          <span className="bg-[#3b82f6]/10 text-[#3b82f6] text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">
            {unlockedBackgrounds.length} / 6 Unlocked
          </span>
        </div>
        <p className="text-sm text-gray-600">
           Scan QR codes from your dentist to collect new backgrounds! Maintain a 7-day streak to see a new one every day.
        </p>
      </div>

      <div className="mb-8 border-b pb-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
`;

file = file.replace(
  `      <div className="mb-8 border-b pb-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <ImageIcon size={20} className="text-[#3b82f6]" />
            Custom Wallpaper`,
  unlockedStatsHTML + `            <ImageIcon size={20} className="text-[#3b82f6]" />
            Custom Wallpaper`
);

fs.writeFileSync('src/components/Settings.jsx', file);
