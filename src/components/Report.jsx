import React, { useMemo } from 'react';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { parseISO, format, differenceInDays, startOfDay } from 'date-fns';

export default function Report({ records }) {
  const stats = useMemo(() => {
    if (!records || records.length === 0) return null;
    
    // Group records by day
    const byDay = {};
    records.forEach(r => {
      const dateKey = format(parseISO(r.timestamp), 'yyyy-MM-dd');
      byDay[dateKey] = (byDay[dateKey] || 0) + 1;
    });

    const uniqueDates = Object.keys(byDay).sort();
    const firstDate = parseISO(uniqueDates[0]);
    const lastDate = parseISO(uniqueDates[uniqueDates.length - 1]);
    const totalDays = differenceInDays(startOfDay(lastDate), startOfDay(firstDate)) + 1;

    // Frequencies
    let didNotBrush = 0, once = 0, twice = 0, threeTimes = 0;
    
    // Iterate over all days in range to account for missing days (Did Not Brush)
    let current = startOfDay(firstDate);
    const end = startOfDay(lastDate);
    let currentStreak = 0;
    let maxStreak = 0;

    const missedDaysOfWeek = { 0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0 }; // 0 is Sunday
    const hitDaysOfWeek = { 0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0 };

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
    
    // Most missed day
    let mostMissed = 0;
    let mostMissedCount = -1;
    Object.keys(missedDaysOfWeek).forEach(d => {
      if (missedDaysOfWeek[d] > mostMissedCount) {
        mostMissedCount = missedDaysOfWeek[d];
        mostMissed = d;
      }
    });

    // Best day
    let bestDay = 0;
    let bestDayCount = -1;
    Object.keys(hitDaysOfWeek).forEach(d => {
      if (hitDaysOfWeek[d] > bestDayCount) {
        bestDayCount = hitDaysOfWeek[d];
        bestDay = d;
      }
    });

    // Monthly totals for bar chart
    const monthlyMap = {};
    Object.keys(byDay).forEach(dateKey => {
      if (byDay[dateKey] > 0) {
        const monthKey = format(parseISO(dateKey), 'MMM yyyy');
        monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + byDay[dateKey];
      }
    });
    
    const monthlyData = Object.keys(monthlyMap).map(k => ({
      name: k,
      total: monthlyMap[k]
    }));

    const pieData = [
      { name: 'Did Not Brush', value: didNotBrush, color: '#9ca3af' },
      { name: 'Once a day', value: once, color: '#dcfce7' },
      { name: 'Twice a day', value: twice, color: '#86efac' },
      { name: '3x a day', value: threeTimes, color: '#22c55e' }
    ].filter(d => d.value > 0);

    return {
      totalDays,
      totalBrushings: records.length,
      pieData,
      monthlyData,
      counts: { didNotBrush, once, twice, threeTimes },
      maxStreak,
      mostMissed: { name: dayNames[mostMissed], count: mostMissedCount },
      bestDay: { name: dayNames[bestDay], count: bestDayCount },
      startDate: format(firstDate, 'M/d/yyyy'),
      endDate: format(lastDate, 'M/d/yyyy')
    };
  }, [records]);

  if (!stats) return <div className="text-center">No data available for report.</div>;

  return (
    <div className="bg-white text-black p-8 rounded-xl shadow-xl mt-8" id="export-pdf-area">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold mb-2">Kyle's <span className="text-green-600 font-light">Brush & Floss Analysis</span></h2>
        <div className="flex justify-center gap-8 text-gray-600">
          <span>Start Date <span className="font-semibold text-black">{stats.startDate}</span></span>
          <span>End Date <span className="font-semibold text-black">{stats.endDate}</span></span>
          <span className="italic">{stats.totalDays} day period</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Left Column: Stats Table */}
        <div>
          <table className="w-full border-collapse border border-gray-300 text-center">
            <tbody>
              <tr>
                <td className="border border-gray-300 p-2 font-bold text-xl">3x a Day Goal</td>
                <td className="border border-gray-300 p-2 font-bold text-2xl">
                  {Math.round((stats.counts.threeTimes / stats.totalDays) * 100 || 0)}%
                </td>
              </tr>
              <tr className="bg-green-600 text-white font-bold">
                <td colSpan={2} className="p-2">Brush & Floss Count</td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2">Did Not Brush</td>
                <td className="border border-gray-300 p-2 font-bold text-lg">{stats.counts.didNotBrush}</td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2">Once a day</td>
                <td className="border border-gray-300 p-2 font-bold text-lg">{stats.counts.once}</td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2">Twice a day</td>
                <td className="border border-gray-300 p-2 font-bold text-lg">{stats.counts.twice}</td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2">3x a day</td>
                <td className="border border-gray-300 p-2 font-bold text-lg">{stats.counts.threeTimes}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Right Column: Pie Chart */}
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={stats.pieData}
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {stats.pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 text-center mb-12">
        <div>
          <h4 className="font-bold mb-2">Most frequent day missed</h4>
          <p className="text-3xl font-bold text-green-700">{stats.mostMissed.name}</p>
          <p className="text-sm italic">{stats.mostMissed.count} missed</p>
        </div>
        <div>
          <h4 className="font-bold mb-2">best day</h4>
          <p className="text-3xl font-bold text-green-700">{stats.bestDay.name}</p>
        </div>
        <div>
          <h4 className="font-bold mb-2">Longest Streak</h4>
          <p className="text-3xl font-bold text-green-700">{stats.maxStreak} days</p>
          <p className="text-sm italic">consecutive days</p>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="h-[300px] mt-8">
        <h3 className="text-2xl text-gray-500 mb-4">Totals Per Month</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats.monthlyData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" axisLine={true} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} />
            <Tooltip />
            <Bar dataKey="total" fill="#4ade80" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}
