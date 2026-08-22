import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell,
  AreaChart, Area
} from 'recharts';
import { parseISO, format, differenceInDays, startOfDay, subDays, isToday, isYesterday } from 'date-fns';
import { Settings, CheckSquare } from 'lucide-react';
import { THEMES } from '../utils/themes';

export default function Dashboard({ records, userName, themeIndex = 0 }) {
  const [timeframe, setTimeframe] = useState('Week');

  const stats = useMemo(() => {
    if (!records || records.length === 0) return null;
    
    const byDay = {};
    records.forEach(r => {
      const dateKey = format(parseISO(r.timestamp), 'yyyy-MM-dd');
      byDay[dateKey] = (byDay[dateKey] || 0) + 1;
    });

    const uniqueDates = Object.keys(byDay).sort();
    const firstDate = parseISO(uniqueDates[0]);
    const lastDate = parseISO(uniqueDates[uniqueDates.length - 1]);
    
    const weekData = [];
    for (let i = 6; i >= 0; i--) {
      const d = subDays(new Date(), i);
      const dateKey = format(d, 'yyyy-MM-dd');
      weekData.push({
        name: format(d, 'EEE').substring(0,1),
        value: byDay[dateKey] || 0
      });
    }

    const monthlyMap = {};
    Object.keys(byDay).forEach(dateKey => {
      if (byDay[dateKey] > 0) {
        const monthKey = format(parseISO(dateKey), 'MMM');
        monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + byDay[dateKey];
      }
    });
    const monthlyData = Object.keys(monthlyMap).map(k => ({ name: k, total: monthlyMap[k] }));

    let current = startOfDay(firstDate);
    const end = startOfDay(lastDate);
    let currentStreak = 0, maxStreak = 0;
    while (current <= end) {
      const dateKey = format(current, 'yyyy-MM-dd');
      if ((byDay[dateKey] || 0) > 0) {
        currentStreak++;
        if (currentStreak > maxStreak) maxStreak = currentStreak;
      } else {
        currentStreak = 0;
      }
      current.setDate(current.getDate() + 1);
    }

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const todaysCount = byDay[todayStr] || 0;

    // Determine the last brush time string
    const lastRecord = records[records.length - 1];
    let lastBrushText = "";
    if (lastRecord) {
      const lastDateObj = parseISO(lastRecord.timestamp);
      const timeStr = format(lastDateObj, 'h:mm a');
      if (isToday(lastDateObj)) {
        lastBrushText = `Today at ${timeStr}`;
      } else if (isYesterday(lastDateObj)) {
        lastBrushText = `Yesterday at ${timeStr}`;
      } else {
        lastBrushText = `${format(lastDateObj, 'MMM d')} at ${timeStr}`;
      }
    }

    return { weekData, monthlyData, maxStreak, todaysCount, totalRecords: records.length, lastBrushText };
  }, [records]);

  if (!stats) return <div className="text-center text-gray-500 mt-20">No data available. Log your first brush!</div>;

  const currentTheme = THEMES[themeIndex % THEMES.length];
  const chartColor = currentTheme.nav.replace('bg-', 'text-'); // rough approx, we'll use a hardcoded fallback
  const barActiveColor = '#2d3a70'; // Keep simple for now or derive it

  return (
    <div className="pb-32 bg-[#f4f7fb] min-h-screen transition-colors duration-500">
      
      <div className={`bg-gradient-to-br ${currentTheme.header} text-white rounded-b-[3rem] px-8 pt-12 pb-16 shadow-lg relative transition-all duration-700`}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-light mb-1">Hi {userName || 'There'}</h1>
            <p className="text-white/80 text-sm">Keep your smile bright</p>
          </div>
          <Settings size={24} className="text-white/80" />
        </div>
        
        <div className="flex flex-col items-center mt-2 animate-fade-in-up">
          <div className="w-24 h-24 rounded-full border-4 border-white overflow-hidden shadow-xl bg-white flex items-center justify-center transition-transform duration-300 hover:scale-105">
            <span className="text-4xl">🦷</span>
          </div>
          <div className="mt-3 text-center">
            <p className="text-xs text-white/70 uppercase tracking-widest font-semibold">Last Logged</p>
            <p className="text-sm font-medium mt-0.5">{stats.lastBrushText}</p>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-8 mt-6 text-sm font-medium text-gray-400">
        {['Week', 'Month', 'Year'].map(t => (
          <button 
            key={t}
            onClick={() => setTimeframe(t)}
            className={`pb-1 px-2 transition-colors ${timeframe === t ? 'text-gray-800 border-b-4 border-gray-800 rounded-sm' : ''}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="px-6 mt-8 space-y-6">
        
        <div className="grid grid-cols-2 gap-4">
          
          <div className="bg-white p-5 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <h3 className="text-gray-500 font-medium text-sm mb-4">Frequency</h3>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.weekData}>
                  <Bar dataKey="value" radius={[10, 10, 10, 10]} barSize={8}>
                    {stats.weekData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.value >= 2 ? '#4b5563' : '#e5e7eb'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-2 font-medium">
              <span>{stats.weekData[0].name}</span>
              <span>Today: {stats.todaysCount}</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between text-center relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5">
               <CheckSquare size={64} />
             </div>
             <div>
                <h3 className="text-gray-500 font-semibold text-lg mb-1">Max Streak</h3>
                <div className="text-4xl font-bold text-gray-800">{stats.maxStreak}</div>
                <p className="text-xs text-gray-400 mt-1">Days in a row</p>
             </div>
             
             <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="text-gray-500 font-medium text-sm mb-1">Total Logs</div>
                <div className="text-xl font-bold text-gray-800">{stats.totalRecords}</div>
             </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <h3 className="text-gray-500 font-medium text-sm mb-6">Monthly Trends</h3>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.monthlyData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9ca3af" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#9ca3af" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Tooltip cursor={false} contentStyle={{borderRadius:'10px', border:'none', boxShadow:'0 4px 20px rgba(0,0,0,0.1)'}}/>
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#9ca3af" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorTotal)" 
                  activeDot={{r: 6, fill: '#4b5563', strokeWidth: 0}}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-4 font-medium px-2">
             {stats.monthlyData.map(d => (
                <span key={d.name}>{d.name}</span>
             ))}
          </div>
        </div>

      </div>
    </div>
  );
}
