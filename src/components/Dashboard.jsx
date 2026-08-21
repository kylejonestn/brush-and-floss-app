import React from 'react';
import { isToday, parseISO } from 'date-fns';

export default function Dashboard({ records, onLogBrush }) {
  // Filter for records that happened today
  const todaysCount = records.filter(r => isToday(parseISO(r.timestamp))).length;

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
      <h1 className="text-3xl font-bold text-purple-400 mb-6">Today's Brushing Count</h1>
      
      <div className="text-[12rem] leading-none font-bold text-teal-400 mb-8 font-mono">
        {todaysCount}
      </div>
      
      <button 
        onClick={onLogBrush}
        className="w-full max-w-md bg-purple-400 hover:bg-purple-500 text-black font-semibold py-4 px-8 rounded-xl text-xl transition-colors"
      >
        I Brushed & Flossed
      </button>
      
      <p className="mt-6 text-gray-300">
        {todaysCount === 0 ? "Ready for the first brush of the day!" : `Great job! You've brushed ${todaysCount} time${todaysCount > 1 ? 's' : ''} today.`}
      </p>
    </div>
  );
}
