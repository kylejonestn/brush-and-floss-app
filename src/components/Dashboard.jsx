import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, Tooltip 
} from 'recharts';
import { parseISO, format, differenceInDays, startOfDay, subDays, isToday, isYesterday, isAfter } from 'date-fns';
import { Award, AlertCircle, Target, TrendingUp, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { THEMES } from '../utils/themes';

export default function Dashboard({ records, userName, themeIndex = 0, syncStatus, onLogin }) {
  const [timeframe, setTimeframe] = useState('Week');

  const stats = useMemo(() => {
    if (!records || records.length === 0) return null;
    
    const now = new Date();
    let startDate;
    if (timeframe === 'Week') startDate = subDays(now, 7);
    else if (timeframe === 'Month') startDate = subDays(now, 30);
    
    const filteredRecords = startDate 
      ? records.filter(r => isAfter(parseISO(r.timestamp), startDate))
      : records;

    if (filteredRecords.length === 0) return { empty: true };

    const byDay = {};
    filteredRecords.forEach(r => {
      const dateKey = format(parseISO(r.timestamp), 'yyyy-MM-dd');
      byDay[dateKey] = (byDay[dateKey] || 0) + 1;
    });

    const uniqueDates = Object.keys(byDay).sort();
    let firstDate = parseISO(uniqueDates[0]);
    if (timeframe === 'Week') firstDate = startOfDay(subDays(now, 6));
    if (timeframe === 'Month') firstDate = startOfDay(subDays(now, 29));
    const lastDate = startOfDay(now);
    
    const totalDays = differenceInDays(lastDate, firstDate) + 1;

    let didNotBrush = 0, once = 0, twice = 0, threeTimes = 0;
    let currentStreak = 0, maxStreak = 0;
    const missedDaysOfWeek = { 0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0 };
    const hitDaysOfWeek = { 0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0 };

    let current = startOfDay(firstDate);
    const end = startOfDay(lastDate);

    while (current <= end) {
      const dateKey = format(current, 'yyyy-MM-dd');
      const count = byDay[dateKey] || 0;
      const dayOfWeek = current.getDay();

      if (count === 0) {
        didNotBrush++;
        currentStreak = 0;
        missedDaysOfWeek[dayOfWeek]++;
      } else {
        if (count === 1) once++;
        if (count === 2) twice++;
        if (count >= 3) threeTimes++;
        
        currentStreak++;
        if (currentStreak > maxStreak) maxStreak = currentStreak;
        hitDaysOfWeek[dayOfWeek]++;
      }
      current.setDate(current.getDate() + 1);
    }

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    let mostMissed = 0, mostMissedCount = -1;
    Object.keys(missedDaysOfWeek).forEach(d => {
      if (missedDaysOfWeek[d] > mostMissedCount) {
        mostMissedCount = missedDaysOfWeek[d];
        mostMissed = d;
      }
    });

    let bestDay = 0, bestDayCount = -1;
    Object.keys(hitDaysOfWeek).forEach(d => {
      if (hitDaysOfWeek[d] > bestDayCount) {
        bestDayCount = hitDaysOfWeek[d];
        bestDay = d;
      }
    });

    const monthlyMap = {};
    Object.keys(byDay).forEach(dateKey => {
      if (byDay[dateKey] > 0) {
        const monthKey = format(parseISO(dateKey), 'MMM');
        monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + byDay[dateKey];
      }
    });
    const monthlyData = Object.keys(monthlyMap).map(k => ({ name: k, total: monthlyMap[k] }));

    const pieData = [
      { name: '0x', value: didNotBrush, color: '#e5e7eb' },
      { name: '1x', value: once, color: '#9ca3af' },
      { name: '2x', value: twice, color: '#6b7280' },
      { name: '3x+', value: threeTimes, color: '#374151' }
    ].filter(d => d.value > 0);

    const goal3xPercent = Math.round((threeTimes / totalDays) * 100) || 0;
    const brushedPercent = Math.round(((totalDays - didNotBrush) / totalDays) * 100) || 0;

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const todaysCount = byDay[todayStr] || 0;

    const lastRecord = records[records.length - 1]; 
    let lastBrushText = "";
    if (lastRecord) {
      const lastDateObj = parseISO(lastRecord.timestamp);
      const timeStr = format(lastDateObj, 'h:mm a');
      if (isToday(lastDateObj)) lastBrushText = `Today at ${timeStr}`;
      else if (isYesterday(lastDateObj)) lastBrushText = `Yesterday at ${timeStr}`;
      else lastBrushText = `${format(lastDateObj, 'MMM d')} at ${timeStr}`;
    }

    return { 
      pieData, monthlyData, maxStreak, todaysCount, 
      totalRecords: filteredRecords.length, lastBrushText,
      mostMissed: { name: dayNames[mostMissed], count: mostMissedCount },
      bestDay: { name: dayNames[bestDay], count: bestDayCount },
      goal3xPercent, brushedPercent, totalDays,
      counts: { didNotBrush, once, twice, threeTimes }
    };
  }, [records, timeframe]);

  if (!stats) return <div className="text-center text-gray-500 mt-20">No data available. Log your first brush!</div>;

  const currentTheme = THEMES[themeIndex % THEMES.length];

  const handleCloudClick = () => {
    if (syncStatus === 'Not Synced' || syncStatus === 'Error syncing') {
      if (onLogin) onLogin();
    }
  };

  const renderSyncIcon = () => {
    switch(syncStatus) {
      case 'Synced':
         return <Cloud size={24} className="text-white/80 transition-all duration-300" />;
      case 'Syncing':
         return <RefreshCw size={24} className="text-white/80 animate-spin transition-all duration-300" />;
      default: // 'Not Synced' or 'Error syncing'
         return <CloudOff size={24} className="text-white/50 transition-all duration-300 group-hover:text-white" />;
    }
  };

  return (
    <div className="pb-32 bg-[#f4f7fb] min-h-screen transition-colors duration-500">
      
      <div className={`bg-gradient-to-br ${currentTheme.header} text-white rounded-b-[3rem] px-8 pt-12 pb-16 shadow-lg relative transition-all duration-700`}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-light mb-1">Hi {userName || 'There'}</h1>
            <p className="text-white/80 text-sm">Keep your smile bright</p>
          </div>
          <button 
             onClick={handleCloudClick}
             title={syncStatus === 'Not Synced' || syncStatus === 'Error syncing' ? 'Click to reconnect to Google Drive' : `Cloud Status: ${syncStatus}`}
             className={`group focus:outline-none ${(syncStatus === 'Not Synced' || syncStatus === 'Error syncing') ? 'cursor-pointer hover:scale-110 active:scale-95 transition-transform' : 'cursor-default'}`}
          >
             {renderSyncIcon()}
          </button>
        </div>
        
        <div className="flex flex-col items-center mt-2 animate-fade-in-up">
          <div className="w-24 h-24 rounded-full border-4 border-white overflow-hidden shadow-xl bg-white flex items-center justify-center transition-transform duration-300 hover:scale-105">
            <span className="text-4xl">🦷</span>
          </div>
          <div className="mt-3 text-center">
            <p className="text-xs text-white/70 uppercase tracking-widest font-semibold">Last Logged</p>
            <p className="text-sm font-medium mt-0.5">{stats.lastBrushText || 'Never'}</p>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-8 mt-6 text-sm font-medium text-gray-400">
        {['Week', 'Month', 'All Time'].map(t => (
          <button 
            key={t}
            onClick={() => setTimeframe(t)}
            className={`pb-1 px-2 transition-colors ${timeframe === t ? 'text-gray-800 border-b-4 border-gray-800 rounded-sm' : ''}`}
          >
            {t}
          </button>
        ))}
      </div>

      {stats.empty ? (
         <div className="text-center mt-12 text-gray-400">No data for this timeframe.</div>
      ) : (
        <div className="px-6 mt-8 space-y-6">
          
          <div className="bg-white p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-gray-500 font-medium text-sm">Habit Breakdown</h3>
              <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{stats.totalDays} Days</span>
            </div>
            
            <div className="flex items-center">
              <div className="w-1/2 h-32 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.pieData}
                      innerRadius={35}
                      outerRadius={55}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {stats.pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{borderRadius:'10px', border:'none', boxShadow:'0 4px 20px rgba(0,0,0,0.1)'}} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                  <span className="text-xl font-bold text-gray-800">{stats.brushedPercent}%</span>
                </div>
              </div>
              
              <div className="w-1/2 pl-2 space-y-2 text-sm">
                 <div className="flex justify-between items-center"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#374151]"></span>3x</span> <span className="font-semibold">{stats.counts.threeTimes}</span></div>
                 <div className="flex justify-between items-center"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#6b7280]"></span>2x</span> <span className="font-semibold">{stats.counts.twice}</span></div>
                 <div className="flex justify-between items-center"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#9ca3af]"></span>1x</span> <span className="font-semibold">{stats.counts.once}</span></div>
                 <div className="flex justify-between items-center"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#e5e7eb]"></span>0x</span> <span className="font-semibold text-gray-400">{stats.counts.didNotBrush}</span></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            
            <div className="bg-white p-5 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between relative overflow-hidden">
               <Target size={48} className="absolute -top-2 -right-2 text-gray-100 opacity-50" />
               <h3 className="text-gray-400 font-medium text-xs uppercase tracking-wider mb-2">3x a Day Goal</h3>
               <div className="text-3xl font-bold text-gray-800">{stats.goal3xPercent}%</div>
               <p className="text-xs text-gray-400 mt-1">Days hit target</p>
            </div>

            <div className="bg-white p-5 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between relative overflow-hidden">
               <TrendingUp size={48} className="absolute -top-2 -right-2 text-gray-100 opacity-50" />
               <h3 className="text-gray-400 font-medium text-xs uppercase tracking-wider mb-2">Max Streak</h3>
               <div className="text-3xl font-bold text-gray-800">{stats.maxStreak}</div>
               <p className="text-xs text-gray-400 mt-1">Days in a row</p>
            </div>

            <div className="bg-white p-5 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between relative overflow-hidden">
               <Award size={48} className="absolute -top-2 -right-2 text-emerald-50 opacity-50" />
               <h3 className="text-emerald-600/70 font-medium text-xs uppercase tracking-wider mb-2">Best Day</h3>
               <div className="text-xl font-bold text-emerald-700">{stats.bestDay.name}</div>
               <p className="text-xs text-emerald-600/70 mt-1">{stats.bestDay.count} hit</p>
            </div>

            <div className="bg-white p-5 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between relative overflow-hidden">
               <AlertCircle size={48} className="absolute -top-2 -right-2 text-rose-50 opacity-50" />
               <h3 className="text-rose-400 font-medium text-xs uppercase tracking-wider mb-2">Most Missed</h3>
               <div className="text-xl font-bold text-rose-600">{stats.mostMissed.name}</div>
               <p className="text-xs text-rose-400 mt-1">{stats.mostMissed.count} missed</p>
            </div>

          </div>

          {stats.monthlyData.length > 1 && (
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
          )}

        </div>
      )}
    </div>
  );
}
