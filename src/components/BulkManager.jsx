import React, { useState } from 'react';
import { parseISO, format, isValid, differenceInDays } from 'date-fns';

export default function BulkManager({ records, onDeleteRecords, onAddRecords, onClose }) {
  const [selectedIds, setSelectedIds] = useState(new Set());
  
  const [bulkAddStart, setBulkAddStart] = useState('');
  const [bulkAddEnd, setBulkAddEnd] = useState('');
  const [bulkAddTime, setBulkAddTime] = useState('08:00');

  const sortedRecords = records.slice().reverse();

  const handleToggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(new Set(records.map(r => r.timestamp)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleRow = (timestamp) => {
    const next = new Set(selectedIds);
    if (next.has(timestamp)) next.delete(timestamp);
    else next.add(timestamp);
    setSelectedIds(next);
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedIds.size} records?`)) {
      onDeleteRecords(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  const handleDeleteAll = () => {
    if (records.length === 0) return;
    if (window.confirm('WARNING: Are you absolutely sure you want to completely WIPE all your brushing data? This cannot be undone.')) {
      onDeleteRecords(records.map(r => r.timestamp));
      setSelectedIds(new Set());
    }
  };

  const handleBulkAdd = () => {
    if (!bulkAddStart || !bulkAddEnd || !bulkAddTime) {
      alert("Please fill in start date, end date, and time.");
      return;
    }

    const start = new Date(`${bulkAddStart}T${bulkAddTime}`);
    const end = new Date(`${bulkAddEnd}T${bulkAddTime}`);

    if (!isValid(start) || !isValid(end)) {
      alert("Invalid dates.");
      return;
    }

    if (start > end) {
      alert("Start date must be before end date.");
      return;
    }

    const days = differenceInDays(end, start);
    if (days > 365) {
      alert("Please limit bulk add to 1 year at a time to prevent mistakes.");
      return;
    }

    const newRecs = [];
    let curr = new Date(start);
    while (curr <= end) {
      newRecs.push({
        timestamp: curr.toISOString(),
        action: 'brush_and_floss'
      });
      curr.setDate(curr.getDate() + 1);
    }

    if (newRecs.length > 0) {
      if (window.confirm(`Add ${newRecs.length} records daily at ${bulkAddTime}?`)) {
        onAddRecords(newRecs);
        setBulkAddStart('');
        setBulkAddEnd('');
      }
    }
  };

  return (
    <div className="animate-fade-in-up bg-[#f4f7fb] min-h-screen pb-32">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-[#2d3a70]">Data Manager</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-black font-medium text-sm">
          Back
        </button>
      </div>

      <div className="mb-8 border-b border-gray-200 pb-8">
        <h3 className="text-lg font-semibold mb-2 text-gray-800">Bulk Add Records</h3>
        <p className="text-sm text-gray-500 mb-4">
          Quickly populate missing data across a date range.
        </p>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
           <div className="flex gap-3 mb-4">
              <div className="flex-1">
                 <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
                 <input 
                    type="date" 
                    value={bulkAddStart} 
                    onChange={e => setBulkAddStart(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-[#2d3a70]"
                 />
              </div>
              <div className="flex-1">
                 <label className="block text-xs font-medium text-gray-500 mb-1">End Date</label>
                 <input 
                    type="date" 
                    value={bulkAddEnd} 
                    onChange={e => setBulkAddEnd(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-[#2d3a70]"
                 />
              </div>
           </div>
           <div className="mb-4">
              <label className="block text-xs font-medium text-gray-500 mb-1">Time of Day</label>
              <input 
                 type="time" 
                 value={bulkAddTime} 
                 onChange={e => setBulkAddTime(e.target.value)}
                 className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2d3a70]"
              />
           </div>
           <button 
             onClick={handleBulkAdd}
             className="w-full bg-[#2d3a70] hover:bg-[#3b4b94] text-white py-2 rounded-lg text-sm font-medium transition-colors"
           >
              Add to Range
           </button>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-end mb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Bulk Manage</h3>
            <p className="text-sm text-gray-500">{records.length} total records</p>
          </div>
          <div className="flex gap-2">
            <button 
               onClick={handleDeleteSelected}
               disabled={selectedIds.size === 0}
               className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${selectedIds.size > 0 ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
            >
               Delete Selected ({selectedIds.size})
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
           <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center font-medium text-xs text-gray-500 uppercase tracking-wider">
             <div className="w-10">
               <input 
                 type="checkbox" 
                 checked={records.length > 0 && selectedIds.size === records.length}
                 onChange={handleToggleSelectAll}
                 className="rounded border-gray-300 text-[#2d3a70] focus:ring-[#2d3a70]"
               />
             </div>
             <div className="flex-1">Date</div>
             <div className="w-24 text-right">Time</div>
           </div>
           
           <div className="max-h-96 overflow-y-auto">
             {sortedRecords.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">No records found.</div>
             ) : (
                sortedRecords.map((r, i) => {
                  const dt = parseISO(r.timestamp);
                  const isSelected = selectedIds.has(r.timestamp);
                  return (
                    <div 
                      key={r.timestamp} 
                      onClick={() => handleToggleRow(r.timestamp)}
                      className={`flex items-center px-4 py-3 border-b border-gray-50 cursor-pointer transition-colors hover:bg-blue-50 ${isSelected ? 'bg-blue-50/50' : ''}`}
                    >
                      <div className="w-10">
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => {}} // handled by parent div click
                          className="rounded border-gray-300 text-[#2d3a70] focus:ring-[#2d3a70]"
                        />
                      </div>
                      <div className="flex-1 text-sm font-medium text-gray-700">
                         {format(dt, 'MMM d, yyyy')}
                      </div>
                      <div className="w-24 text-right text-xs text-gray-500">
                         {format(dt, 'h:mm a')}
                      </div>
                    </div>
                  );
                })
             )}
           </div>
        </div>

        <div className="mt-6 flex justify-center">
           <button 
             onClick={handleDeleteAll}
             className="text-xs font-medium text-red-500 hover:text-red-700 hover:underline"
           >
             Danger: Delete ALL Records
           </button>
        </div>
      </div>
    </div>
  );
}
