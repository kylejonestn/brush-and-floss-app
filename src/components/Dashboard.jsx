import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis 
} from 'recharts';
import { parseISO, format, differenceInDays, startOfDay, endOfDay, subDays, isToday, isYesterday, isAfter, isBefore } from 'date-fns';
import { Award, AlertCircle, Target, TrendingUp, Cloud, CloudOff, RefreshCw, History } from 'lucide-react';
import { THEMES } from '../utils/themes';
import { ENCOURAGING_PHRASES } from '../utils/phrases';

export default function Dashboard({ records, userName, themeIndex = 0, phraseIndex = 0, syncStatus, onLogin, customDateRange, customPeriods, cloudSyncEnabled = true, unlockedBackgrounds = ['bg1'] }) {
  const [timeframe, setTimeframe] = useState('Week');

  const { globalCurrentStreak, activeBackground } = useMemo(() => {
    let streak = 0;
    if (records && records.length > 0) {
       const allDays = new Set(records.map(r => r.timestamp.split('T')[0]));
       let curr = new Date();
       const todayStr = curr.toISOString().split('T')[0];
       curr.setDate(curr.getDate() - 1);
       const yesterdayStr = curr.toISOString().split('T')[0];
       
       let activeDate = new Date();
       if (allDays.has(todayStr)) {
          // brushed today
       } else if (allDays.has(yesterdayStr)) {
          activeDate.setDate(activeDate.getDate() - 1);
       } else {
          activeDate = null;
       }
       
       if (activeDate) {
          while (true) {
             const dStr = activeDate.toISOString().split('T')[0];
             if (allDays.has(dStr)) {
                streak++;
                activeDate.setDate(activeDate.getDate() - 1);
             } else {
                break;
             }
          }
       }
    }
    
    let activeBg = 'bg1';
    if (streak >= 7 && unlockedBackgrounds.length > 0) {
       const now = new Date();
       const start = new Date(now.getFullYear(), 0, 0);
       const diff = (now - start) + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
       const oneDay = 1000 * 60 * 60 * 24;
       const dayOfYear = Math.floor(diff / oneDay);
       activeBg = unlockedBackgrounds[dayOfYear % unlockedBackgrounds.length];
    }
    
    return { globalCurrentStreak: streak, activeBackground: activeBg };
  }, [records, unlockedBackgrounds]);

  const stats = useMemo(() => {
    if (!records || records.length === 0) return null;
    
    const now = new Date();
    let startDate;
    let endDate = endOfDay(now);

    if (timeframe === 'Week') {
      startDate = startOfDay(subDays(now, 6));
    } else if (timeframe === 'Month') {
      startDate = startOfDay(subDays(now, 29));
    } else if (timeframe === 'Custom') {
      if (customDateRange?.start) startDate = startOfDay(parseISO(customDateRange.start));
      if (customDateRange?.end) endDate = endOfDay(parseISO(customDateRange.end));
      if (endDate > endOfDay(now)) endDate = endOfDay(now);
    }
    
    const filteredRecords = records.filter(r => {
      const d = parseISO(r.timestamp);
      let ok = true;
      if (startDate) ok = ok && d >= startDate;
      if (endDate) ok = ok && d <= endDate;
      return ok;
    });

    const byDay = {};
    const allByDay = {}; 
    records.forEach(r => {
      const dateKey = format(parseISO(r.timestamp), 'yyyy-MM-dd');
      allByDay[dateKey] = (allByDay[dateKey] || 0) + 1;
    });
    
    filteredRecords.forEach(r => {
      const dateKey = format(parseISO(r.timestamp), 'yyyy-MM-dd');
      byDay[dateKey] = (byDay[dateKey] || 0) + 1;
    });

    const uniqueDates = Object.keys(byDay).sort();
    
    let firstDate = startDate;
    if (!firstDate && uniqueDates.length > 0) {
      firstDate = parseISO(uniqueDates[0]);
    }
    let lastDate = endDate;
    if (!lastDate) {
      lastDate = startOfDay(now);
    }
    
    const totalDays = differenceInDays(startOfDay(lastDate), startOfDay(firstDate)) + 1;

    let didNotBrush = 0, once = 0, twice = 0, threeTimes = 0;
    let currentStreak = 0, maxStreak = 0;
    const missedDaysOfWeek = { 0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0 };
    const hitDaysOfWeek = { 0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0 };

    if (filteredRecords.length > 0) {
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
    }

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const shortDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
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
      { name: '0x', value: didNotBrush, color: 'url(#pattern-0x)' },
      { name: '1x', value: once, color: 'url(#pattern-1x)' },
      { name: '2x', value: twice, color: 'url(#pattern-2x)' },
      { name: '3x+', value: threeTimes, color: 'url(#pattern-3x)' }
    ].filter(d => d.value > 0);

    const goal3xPercent = Math.round((threeTimes / totalDays) * 100) || 0;
    const brushedPercent = Math.round(((totalDays - didNotBrush) / totalDays) * 100) || 0;

    const todayStr = format(now, 'yyyy-MM-dd');
    const todaysCount = allByDay[todayStr] || 0;

    const weekData = [];
    for (let i = 6; i >= 0; i--) {
      const d = subDays(now, i);
      const dateKey = format(d, 'yyyy-MM-dd');
      weekData.push({
        name: format(d, 'EEE').substring(0, 1),
        value: allByDay[dateKey] || 0
      });
    }

    const lastRecord = records[records.length - 1]; 
    let lastBrushText = "";
    if (lastRecord) {
      const lastDateObj = parseISO(lastRecord.timestamp);
      const timeStr = format(lastDateObj, 'h:mm a');
      if (isToday(lastDateObj)) lastBrushText = `Today at ${timeStr}`;
      else if (isYesterday(lastDateObj)) lastBrushText = `Yesterday at ${timeStr}`;
      else lastBrushText = `${format(lastDateObj, 'MMM d')} at ${timeStr}`;
    }

    const historicalPeriods = [];
    const allUniqueDates = Object.keys(allByDay).sort();
    
    // Process User-Defined Custom Periods First
    if (customPeriods && customPeriods.length > 0) {
      customPeriods.forEach(p => {
        const pStart = startOfDay(parseISO(p.start));
        let pEnd = endOfDay(parseISO(p.end));
        if (pEnd > endOfDay(now)) pEnd = endOfDay(now);
        
        let pTotalDays = differenceInDays(pEnd, pStart) + 1;
        
        if (pTotalDays > 0) {
          let pDidNotBrush = 0, pThreeTimes = 0;
          let pMaxStreak = 0, pCurrentStreak = 0;
          const pMissedDays = { 0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0 };

          let curr = new Date(pStart);
          while (curr <= pEnd) {
            const dateKey = format(curr, 'yyyy-MM-dd');
            const count = allByDay[dateKey] || 0;
            const dayOfWeek = curr.getDay();

            if (count === 0) {
              pDidNotBrush++;
              pCurrentStreak = 0;
              pMissedDays[dayOfWeek]++;
            } else {
              if (count >= 3) pThreeTimes++;
              pCurrentStreak++;
              if (pCurrentStreak > pMaxStreak) pMaxStreak = pCurrentStreak;
            }
            curr.setDate(curr.getDate() + 1);
          }

          let pMostMissed = 0, pMostMissedCount = -1;
          Object.keys(pMissedDays).forEach(d => {
            if (pMissedDays[d] > pMostMissedCount) {
              pMostMissedCount = pMissedDays[d];
              pMostMissed = d;
            }
          });

          const pBrushedPercent = Math.round(((pTotalDays - pDidNotBrush) / pTotalDays) * 100) || 0;
          const pGoalPercent = Math.round((pThreeTimes / pTotalDays) * 100) || 0;

          historicalPeriods.push({
             label: p.label,
             brushedPercent: pBrushedPercent,
             goal3xPercent: pGoalPercent,
             maxStreak: pMaxStreak,
             mostMissed: pMostMissedCount > 0 ? shortDayNames[pMostMissed] : 'None',
             isCustom: true,
             endDateValue: pEnd.getTime()
          });
        }
      });
    }

    // Auto-Generate Half-Year Chunks
    if (allUniqueDates.length > 0) {
      const earliest = parseISO(allUniqueDates[0]);
      let currentYear = earliest.getFullYear();
      let currentHalf = earliest.getMonth() < 6 ? 1 : 2;
      const latestYear = now.getFullYear();
      const latestHalf = now.getMonth() < 6 ? 1 : 2;

      while (currentYear < latestYear || (currentYear === latestYear && currentHalf <= latestHalf)) {
        const pStartMonth = currentHalf === 1 ? 0 : 6;
        const pEndMonth = currentHalf === 1 ? 5 : 11;
        
        const periodStart = new Date(currentYear, pStartMonth, 1);
        const periodEnd = new Date(currentYear, pEndMonth + 1, 0, 23, 59, 59, 999);
        
        let calcEnd = periodEnd > now ? now : periodEnd;
        let pTotalDays = differenceInDays(startOfDay(calcEnd), startOfDay(periodStart)) + 1;

        if (pTotalDays > 0) {
            let pDidNotBrush = 0, pThreeTimes = 0;
            let pMaxStreak = 0, pCurrentStreak = 0;
            const pMissedDays = { 0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0 };

            let curr = startOfDay(periodStart);
            const pEnd = startOfDay(calcEnd);

            while (curr <= pEnd) {
              const dateKey = format(curr, 'yyyy-MM-dd');
              const count = allByDay[dateKey] || 0;
              const dayOfWeek = curr.getDay();

              if (count === 0) {
                pDidNotBrush++;
                pCurrentStreak = 0;
                pMissedDays[dayOfWeek]++;
              } else {
                if (count >= 3) pThreeTimes++;
                pCurrentStreak++;
                if (pCurrentStreak > pMaxStreak) pMaxStreak = pCurrentStreak;
              }
              curr.setDate(curr.getDate() + 1);
            }

            let pMostMissed = 0, pMostMissedCount = -1;
            Object.keys(pMissedDays).forEach(d => {
              if (pMissedDays[d] > pMostMissedCount) {
                pMostMissedCount = pMissedDays[d];
                pMostMissed = d;
              }
            });

            const label = currentHalf === 1 ? `Jan-Jun ${currentYear}` : `Jul-Dec ${currentYear}`;
            const pBrushedPercent = Math.round(((pTotalDays - pDidNotBrush) / pTotalDays) * 100) || 0;
            const pGoalPercent = Math.round((pThreeTimes / pTotalDays) * 100) || 0;

            historicalPeriods.push({
               label,
               brushedPercent: pBrushedPercent,
               goal3xPercent: pGoalPercent,
               maxStreak: pMaxStreak,
               mostMissed: pMostMissedCount > 0 ? shortDayNames[pMostMissed] : 'None',
               isCustom: false,
               endDateValue: calcEnd.getTime()
            });
        }

        if (currentHalf === 1) {
          currentHalf = 2;
        } else {
          currentHalf = 1;
          currentYear++;
        }
      }
    }

    // Sort combined periods by end date descending
    historicalPeriods.sort((a, b) => b.endDateValue - a.endDateValue);

    return { 
      empty: filteredRecords.length === 0,
      pieData, monthlyData, weekData, maxStreak, todaysCount, 
      totalRecords: filteredRecords.length, lastBrushText,
      mostMissed: { name: dayNames[mostMissed], count: mostMissedCount },
      bestDay: { name: dayNames[bestDay], count: bestDayCount },
      goal3xPercent, brushedPercent, totalDays,
      counts: { didNotBrush, once, twice, threeTimes },
      historicalPeriods: historicalPeriods
    };
  }, [records, timeframe, customDateRange, customPeriods]);

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
         return (
           <div className="relative flex items-center justify-center w-8 h-8">
             <Cloud size={24} className="text-white/90 transition-all duration-300" />
           </div>
         );
      case 'Syncing':
         return (
           <div className="relative flex items-center justify-center w-8 h-8">
             <RefreshCw size={24} className="text-white/90 animate-spin transition-all duration-300" />
           </div>
         );
      default:
         return (
           <div className="relative flex items-center justify-center w-8 h-8">
             <div className={`absolute inset-0 rounded-full ${currentTheme.nav} animate-ping opacity-75`}></div>
             <CloudOff size={24} className="relative z-10 text-white transition-all duration-300" />
           </div>
         );
    }
  };

  return (
    <div className="pb-32 bg-[#f4f7fb] min-h-screen transition-colors duration-500">
      <svg width="0" height="0" className="absolute pointer-events-none">
        <defs>
          <pattern id="pattern-0x" width="6" height="6" patternUnits="userSpaceOnUse">
            <rect width="6" height="6" fill="#fca5a5" />
            <circle cx="3" cy="3" r="1.5" fill="#ef4444" />
          </pattern>
          <pattern id="pattern-1x" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" fill="#fde047" />
            <line x1="0" y1="0" x2="0" y2="6" stroke="#eab308" strokeWidth="2" />
          </pattern>
          <pattern id="pattern-2x" width="8" height="8" patternUnits="userSpaceOnUse">
            <rect width="8" height="8" fill="#86efac" />
            <path d="M 0 0 L 8 8 M 8 0 L 0 8" stroke="#22c55e" strokeWidth="1.5" />
          </pattern>
          <pattern id="pattern-3x" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
            <rect width="6" height="6" fill="#93c5fd" />
            <line x1="0" y1="0" x2="0" y2="6" stroke="#3b82f6" strokeWidth="2" />
          </pattern>
        </defs>
      </svg>

      <div className="relative rounded-b-[3rem] shadow-lg overflow-hidden transition-all duration-700">
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center grayscale mix-blend-multiply opacity-20"
          style={{ backgroundImage: `url('/backgrounds/${activeBackground}.jpg')` }}
        />
        <div className={`absolute inset-0 z-10 bg-gradient-to-br ${currentTheme.header} opacity-90`} />
        
        <div className="relative z-20 px-8 pt-12 pb-16 text-white">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-light mb-1">Hi {userName || 'There'}</h1>
            <p className="text-white/80 text-sm">{ENCOURAGING_PHRASES[phraseIndex] || "Keep your smile bright"}</p>
          </div>
          {cloudSyncEnabled && (
            <button 
              onClick={handleCloudClick}
              title={syncStatus === 'Not Synced' || syncStatus === 'Error syncing' ? 'Click to reconnect to Google Drive' : `Cloud Status: ${syncStatus}`}
              className={`group focus:outline-none ${(syncStatus === 'Not Synced' || syncStatus === 'Error syncing') ? 'cursor-pointer' : 'cursor-default'}`}
            >
              {renderSyncIcon()}
            </button>
          )}
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
    </div>

      <div className="flex justify-center gap-6 mt-6 text-sm font-medium text-gray-400">
        {['Week', 'Month', 'All Time', 'Custom'].map(t => (
          <button 
            key={t}
            onClick={() => setTimeframe(t)}
            className={`pb-1 px-1 transition-colors ${timeframe === t ? 'text-gray-800 border-b-4 border-gray-800 rounded-sm' : ''}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="px-6 mt-8 space-y-6">
        
        {/* 7-Day Frequency Bar Chart (always visible regardless of timeframe filter) */}
        <div className="bg-white p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-gray-500 font-medium text-sm">Recent Activity</h3>
            <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded-full">Last 7 Days</span>
          </div>
          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.weekData}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} dy={5} />
                <Bar dataKey="value" radius={[10, 10, 10, 10]} barSize={16}>
                  {stats.weekData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.value >= 3 ? '#374151' : (entry.value === 2 ? '#4b5563' : (entry.value === 1 ? '#9ca3af' : '#e5e7eb'))} 
                    />
                  ))}
                </Bar>
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius:'10px', border:'none', boxShadow:'0 4px 20px rgba(0,0,0,0.1)'}} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {stats.empty ? (
           <div className="text-center py-12 text-gray-400 bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
             No data for this timeframe. {timeframe === 'Custom' && "Check your Custom Timeframe in Settings."}
           </div>
        ) : (
           <>
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
                   <div className="flex justify-between items-center"><span className="flex items-center gap-2"><svg width="12" height="12" className="rounded-sm shadow-sm"><rect width="12" height="12" fill="url(#pattern-3x)"/></svg>3x+</span> <span className="font-semibold">{stats.counts.threeTimes}</span></div>
                   <div className="flex justify-between items-center"><span className="flex items-center gap-2"><svg width="12" height="12" className="rounded-sm shadow-sm"><rect width="12" height="12" fill="url(#pattern-2x)"/></svg>2x</span> <span className="font-semibold">{stats.counts.twice}</span></div>
                   <div className="flex justify-between items-center"><span className="flex items-center gap-2"><svg width="12" height="12" className="rounded-sm shadow-sm"><rect width="12" height="12" fill="url(#pattern-1x)"/></svg>1x</span> <span className="font-semibold">{stats.counts.once}</span></div>
                   <div className="flex justify-between items-center"><span className="flex items-center gap-2"><svg width="12" height="12" className="rounded-sm shadow-sm"><rect width="12" height="12" fill="url(#pattern-0x)"/></svg>0x</span> <span className="font-semibold text-gray-400">{stats.counts.didNotBrush}</span></div>
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
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.monthlyData} margin={{ top: 20, right: 15, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#9ca3af" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#9ca3af" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#9ca3af', fontWeight: 500}} dy={10} height={30} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} width={35} />
                      <Tooltip cursor={false} contentStyle={{borderRadius:'10px', border:'none', boxShadow:'0 4px 20px rgba(0,0,0,0.1)'}}/>
                      <Area 
                        type="monotone" 
                        dataKey="total" 
                        stroke="#9ca3af" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorTotal)" 
                        activeDot={{r: 6, fill: '#4b5563', strokeWidth: 0}}
                        label={{ fill: '#6b7280', fontSize: 10, position: 'top', dy: -5 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
           </>
        )}

        {/* Historical Comparison */}
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
                         <span className={`text-xs font-bold px-2 py-1 rounded-md ${p.brushedPercent >= 90 ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
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
        )}

      </div>
    </div>
  );
}
