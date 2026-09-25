const fs = require('fs');
let file = fs.readFileSync('src/components/Dashboard.jsx', 'utf8');

const oldBlock = \`        {/* Historical Comparison */}
        {stats.historicalPeriods && stats.historicalPeriods.length > 0 && (
          <div className="bg-white p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
             <div className="flex items-center gap-2 mb-6 text-gray-500">
               <History size={18} />
               <h3 className="font-medium text-sm">Historical Comparison</h3>
             </div>
             
             <div className="space-y-4">
                {stats.historicalPeriods.map((p, idx) => (
                   <div key={idx} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                      <div className="flex justify-between items-end mb-2">
                         <span className="font-semibold text-gray-800">{p.label}</span>
                         <span className={\`text-xs font-bold px-2 py-1 rounded-md \${p.brushedPercent >= 90 ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}\`}>
                            {p.brushedPercent}% Brushed
                         </span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                         <span>3x Goal: <strong className="text-gray-700">{p.goal3xPercent}%</strong></span>
                         <span>Streak: <strong className="text-gray-700">{p.maxStreak}</strong></span>
                         <span>Missed: <strong className="text-gray-700">{p.mostMissed}</strong></span>
                      </div>
                   </div>
                ))}
             </div>
          </div>
        )}\`;

const replacementBlock = \`        {/* Historical Comparison */}
        {stats.historicalPeriods && stats.historicalPeriods.length > 0 && (() => {
          const highestHistoricalPercent = Math.max(...stats.historicalPeriods.map(p => p.brushedPercent), 0);
          return (
          <div className="bg-white p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
             <div className="flex items-center gap-2 mb-6 text-gray-500">
               <History size={18} />
               <h3 className="font-medium text-sm">Historical Comparison</h3>
             </div>
             
             <div className="space-y-4">
                {stats.historicalPeriods.map((p, idx) => {
                   const isHighest = p.brushedPercent === highestHistoricalPercent && highestHistoricalPercent > 0;
                   return (
                   <div key={idx} className={\`border-b \${isHighest ? 'border-emerald-100 bg-emerald-50/50 p-3 -mx-3 rounded-xl shadow-[inset_0_1px_3px_rgba(0,0,0,0.05)]' : 'border-gray-100'} last:border-0 pb-4 last:pb-0\`}>
                      <div className="flex justify-between items-center mb-2">
                         <span className={\`font-semibold \${isHighest ? 'text-emerald-800 flex items-center gap-2' : 'text-gray-800'}\`}>
                           {p.label}
                           {isHighest && (
                             <div className="flex text-emerald-400">
                               <Sparkles size={14} className="animate-float" />
                               <Sparkles size={10} className="animate-float-delay -ml-1 mt-1 opacity-70" />
                             </div>
                           )}
                         </span>
                         <span className={\`text-xs font-bold px-2 py-1 rounded-md \${isHighest ? 'bg-shimmer-emerald shadow-sm border border-emerald-200/50' : p.brushedPercent >= 90 ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}\`}>
                            {p.brushedPercent}% Brushed
                         </span>
                      </div>
                      <div className={\`flex justify-between text-xs \${isHighest ? 'text-emerald-600/80' : 'text-gray-500'}\`}>
                         <span>3x Goal: <strong className={isHighest ? 'text-emerald-700' : 'text-gray-700'}>{p.goal3xPercent}%</strong></span>
                         <span>Streak: <strong className={isHighest ? 'text-emerald-700' : 'text-gray-700'}>{p.maxStreak}</strong></span>
                         <span>Missed: <strong className={isHighest ? 'text-emerald-700' : 'text-gray-700'}>{p.mostMissed}</strong></span>
                      </div>
                   </div>
                   );
                })}
             </div>
          </div>
          );
        })()}\`;

file = file.replace(oldBlock, replacementBlock);
fs.writeFileSync('src/components/Dashboard.jsx', file);
