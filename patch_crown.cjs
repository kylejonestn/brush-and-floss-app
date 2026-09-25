const fs = require('fs');
let file = fs.readFileSync('src/components/Dashboard.jsx', 'utf8');

file = file.replace(
  "import { Award, AlertCircle, Target, TrendingUp, Cloud, CloudOff, RefreshCw, History, Sparkles } from 'lucide-react';",
  "import { Award, AlertCircle, Target, TrendingUp, Cloud, CloudOff, RefreshCw, History, Sparkles, Crown } from 'lucide-react';"
);

const oldHighestDiv = '<div key={idx} className={"border-b " + (isHighest ? \'border-emerald-100 bg-emerald-50/50 p-3 -mx-3 rounded-xl shadow-[inset_0_1px_3px_rgba(0,0,0,0.05)]\' : \'border-gray-100\') + " last:border-0 pb-4 last:pb-0"}>';
const newHighestDiv = '<div key={idx} className={"border-b " + (isHighest ? \'border-emerald-100 bg-gradient-to-r from-emerald-50/80 to-teal-50/80 p-4 -mx-4 rounded-xl animate-glow-pulse animate-sweep\' : \'border-gray-100\') + " last:border-0 pb-4 last:pb-0"}>';

const oldSpanLabel = `<span className={"font-semibold " + (isHighest ? 'text-emerald-800 flex items-center gap-2' : 'text-gray-800')}>
                           {p.label}
                           {isHighest && (
                             <div className="flex text-emerald-400">
                               <Sparkles size={14} className="animate-float" />
                               <Sparkles size={10} className="animate-float-delay -ml-1 mt-1 opacity-70" />
                             </div>
                           )}
                         </span>`;

const newSpanLabel = `<span className={"font-semibold " + (isHighest ? 'text-emerald-900 flex items-center gap-2 text-base' : 'text-gray-800')}>
                           {isHighest && <Crown size={18} className="animate-crown drop-shadow-sm" />}
                           {p.label}
                           {isHighest && (
                             <div className="flex text-emerald-400 drop-shadow-sm">
                               <Sparkles size={14} className="animate-float" />
                               <Sparkles size={10} className="animate-float-delay -ml-1 mt-1 opacity-70" />
                             </div>
                           )}
                         </span>`;

file = file.replace(oldHighestDiv, newHighestDiv);
file = file.replace(oldSpanLabel, newSpanLabel);

fs.writeFileSync('src/components/Dashboard.jsx', file);
