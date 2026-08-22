import React, { useRef, useState } from 'react';
import Papa from 'papaparse';
import { parseISO, format, isValid } from 'date-fns';

export default function Settings({ 
  records, 
  accessToken, 
  onLogin, 
  onLogout, 
  onImportData, 
  onAddRecord,
  onDeleteRecord,
  customDateRange,
  updateCustomDates,
  customPeriods,
  addCustomPeriod,
  removeCustomPeriod,
  onClose 
}) {
  const fileInputRef = useRef(null);
  const [importMessage, setImportMessage] = useState('');
  
  const [manualDate, setManualDate] = useState('');
  const [manualTime, setManualTime] = useState('');

  const [reminderTime1, setReminderTime1] = useState('08:00');
  const [reminderTime2, setReminderTime2] = useState('21:00');

  const [periodLabel, setPeriodLabel] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');

  const handleCreateReminders = () => {
    const generateEvent = (time) => {
      if (!time) return '';
      const [hours, minutes] = time.split(':');
      
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      
      const dtstart = `${yyyy}${mm}${dd}T${hours}${minutes}00`;
      
      const endDate = new Date(now);
      endDate.setHours(parseInt(hours, 10));
      endDate.setMinutes(parseInt(minutes, 10) + 15);
      const endHours = String(endDate.getHours()).padStart(2, '0');
      const endMinutes = String(endDate.getMinutes()).padStart(2, '0');
      const dtend = `${yyyy}${mm}${dd}T${endHours}${endMinutes}00`;

      return `BEGIN:VEVENT
SUMMARY:🦷 Time to Brush & Floss!
DESCRIPTION:Keep that streak alive! Log your brush here: https://kylejonestn.github.io/brush-and-floss-app/
RRULE:FREQ=DAILY
DTSTART:${dtstart}
DTEND:${dtend}
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:Time to Brush & Floss!
TRIGGER:-PT0M
END:VALARM
END:VEVENT
`;
    };

    const icsData = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Brush and Floss App//EN
${generateEvent(reminderTime1)}${generateEvent(reminderTime2)}END:VCALENDAR`;

    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'Brushing_Reminders.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddCustomPeriod = () => {
    if (!periodLabel || !periodStart || !periodEnd) return;
    addCustomPeriod({ label: periodLabel, start: periodStart, end: periodEnd });
    setPeriodLabel('');
    setPeriodStart('');
    setPeriodEnd('');
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedRecords = [];
        results.data.forEach(row => {
          let dateStr = row['Date'] || row['date'];
          let timeStr = row['Time'] || row['time'];
          
          if (dateStr && timeStr) {
            try {
              const dt = new Date(`${dateStr} ${timeStr}`);
              if (isValid(dt)) {
                parsedRecords.push({
                  timestamp: dt.toISOString(),
                  action: 'brush_and_floss'
                });
              }
            } catch (err) {}
          }
        });
        
        if (parsedRecords.length > 0) {
          onImportData(parsedRecords);
          setImportMessage(`Successfully imported ${parsedRecords.length} records!`);
        } else {
          setImportMessage('No valid records found. Please ensure CSV has "Date" and "Time" columns.');
        }
      }
    });
  };

  const handleManualAdd = () => {
    if (manualDate && manualTime) {
      const dt = new Date(`${manualDate}T${manualTime}`);
      if (isValid(dt)) {
        onAddRecord({
          timestamp: dt.toISOString(),
          action: 'brush_and_floss'
        });
        setManualDate('');
        setManualTime('');
      }
    }
  };

  return (
    <div className="animate-fade-in-up">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-[#2d3a70]">Settings</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-black font-medium">
          Close
        </button>
      </div>

      <div className="mb-8 border-b pb-8">
        <h3 className="text-xl font-semibold mb-3 text-gray-800">Custom Timeframe</h3>
        <p className="text-sm text-gray-600 mb-4">
          Set a custom date range (e.g., between dentist visits) for your Dashboard's "Custom" tab.
        </p>
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex gap-4 mb-4">
           <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
              <input 
                 type="date" 
                 value={customDateRange?.start || ''} 
                 onChange={e => updateCustomDates({ ...customDateRange, start: e.target.value })}
                 className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2d3a70]"
              />
           </div>
           <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">End Date</label>
              <input 
                 type="date" 
                 value={customDateRange?.end || ''} 
                 onChange={e => updateCustomDates({ ...customDateRange, end: e.target.value })}
                 className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2d3a70]"
              />
           </div>
        </div>
      </div>

      <div className="mb-8 border-b pb-8">
        <h3 className="text-xl font-semibold mb-3 text-gray-800">Advanced Historical Periods</h3>
        <p className="text-sm text-gray-600 mb-4">
          Define custom chunks of time for the Historical Comparison list (overriding the 6-month defaults).
        </p>
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-4 space-y-3">
           <input 
              type="text" 
              placeholder="Label (e.g., Before Braces)" 
              value={periodLabel} 
              onChange={e => setPeriodLabel(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2d3a70]"
           />
           <div className="flex gap-4">
             <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Start</label>
                <input 
                   type="date" 
                   value={periodStart} 
                   onChange={e => setPeriodStart(e.target.value)}
                   className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2d3a70]"
                />
             </div>
             <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">End</label>
                <input 
                   type="date" 
                   value={periodEnd} 
                   onChange={e => setPeriodEnd(e.target.value)}
                   className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2d3a70]"
                />
             </div>
           </div>
           <button 
             onClick={handleAddCustomPeriod}
             className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg text-sm font-medium transition-colors"
           >
              Add Custom Period
           </button>
        </div>

        {customPeriods && customPeriods.length > 0 && (
          <div className="space-y-2 mt-4">
             {customPeriods.map(p => (
                <div key={p.id} className="flex justify-between items-center bg-white border border-gray-100 p-3 rounded-lg shadow-sm">
                   <div>
                     <p className="text-sm font-medium text-gray-800">{p.label}</p>
                     <p className="text-xs text-gray-500">{p.start} to {p.end}</p>
                   </div>
                   <button onClick={() => removeCustomPeriod(p.id)} className="text-red-500 text-xs font-medium px-2 py-1 bg-red-50 rounded-md">
                     Delete
                   </button>
                </div>
             ))}
          </div>
        )}
      </div>

      <div className="mb-8 border-b pb-8">
        <h3 className="text-xl font-semibold mb-3 text-gray-800">Cloud Sync</h3>
        <p className="text-gray-500 text-sm mb-4">
          Connect your Google Drive to securely backup and sync your data across devices.
        </p>
        
        {accessToken ? (
          <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-emerald-800 font-medium text-sm">Connected to Google Drive</p>
              <p className="text-emerald-600/80 text-xs mt-0.5">Your data is synced safely.</p>
            </div>
            <button 
              onClick={onLogout}
              className="text-emerald-700 hover:bg-emerald-100 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button 
            onClick={() => onLogin()}
            className="w-full bg-[#2d3a70] hover:bg-[#3b4b94] text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            Connect to Google Drive
          </button>
        )}
      </div>

      <div className="mb-8 border-b pb-8">
        <h3 className="text-xl font-semibold mb-3 text-gray-800">Manual Entry</h3>
        <p className="text-sm text-gray-600 mb-4">
          Forgot to log a brush? Add it manually below.
        </p>
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
           <div className="flex gap-4 mb-4">
              <div className="flex-1">
                 <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
                 <input 
                    type="date" 
                    value={manualDate} 
                    onChange={e => setManualDate(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2d3a70]"
                 />
              </div>
              <div className="flex-1">
                 <label className="block text-xs font-medium text-gray-500 mb-1">Time</label>
                 <input 
                    type="time" 
                    value={manualTime} 
                    onChange={e => setManualTime(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2d3a70]"
                 />
              </div>
           </div>
           <button 
             onClick={handleManualAdd}
             className="w-full bg-[#2d3a70] hover:bg-[#3b4b94] text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
           >
              Add Record
           </button>
        </div>
      </div>

      <div className="mb-8 border-b pb-8">
        <h3 className="text-xl font-semibold mb-3 text-gray-800">Daily Reminders</h3>
        <p className="text-sm text-gray-600 mb-4">
          Set up daily notifications on your phone using your native calendar app.
        </p>
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-4">
           <div className="flex gap-4 mb-4">
              <div className="flex-1">
                 <label className="block text-xs font-medium text-gray-500 mb-1">Morning</label>
                 <input 
                    type="time" 
                    value={reminderTime1} 
                    onChange={e => setReminderTime1(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2d3a70]"
                 />
              </div>
              <div className="flex-1">
                 <label className="block text-xs font-medium text-gray-500 mb-1">Evening</label>
                 <input 
                    type="time" 
                    value={reminderTime2} 
                    onChange={e => setReminderTime2(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2d3a70]"
                 />
              </div>
           </div>
           <button 
             onClick={handleCreateReminders}
             className="w-full bg-[#2d3a70] hover:bg-[#3b4b94] text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
           >
              Create Calendar Reminders
           </button>
        </div>
      </div>

      <div className="mb-8 border-b pb-8">
        <h3 className="text-xl font-semibold mb-3 text-gray-800">Import CSV</h3>
        <p className="text-gray-500 text-sm mb-4">
          Import your historical data from an Excel or CSV file. Ensure it has "Date" and "Time" columns.
        </p>
        <input 
          type="file" 
          accept=".csv" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleImport} 
        />
        <button 
          onClick={() => fileInputRef.current.click()}
          className="w-full bg-white border-2 border-gray-200 text-gray-700 hover:border-gray-300 py-3 rounded-xl font-medium transition-colors mb-3 shadow-sm"
        >
          Choose CSV File
        </button>
        {importMessage && <p className="text-sm text-center text-gray-600 font-medium">{importMessage}</p>}
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-3 text-red-600">Danger Zone</h3>
        <div className="bg-red-50 p-4 rounded-xl border border-red-100">
           <p className="text-sm text-red-800 mb-4">
             Recently logged records. You can delete them if you made a mistake.
           </p>
           <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
             {records.slice().reverse().slice(0, 10).map(r => {
               const dt = parseISO(r.timestamp);
               return (
                 <div key={r.timestamp} className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm">
                   <div>
                     <p className="text-sm font-medium text-gray-800">{format(dt, 'MMM d, yyyy')}</p>
                     <p className="text-xs text-gray-500">{format(dt, 'h:mm a')}</p>
                   </div>
                   <button 
                     onClick={() => {
                        if(window.confirm('Delete this record?')) onDeleteRecord(r.timestamp);
                     }}
                     className="text-red-500 text-xs font-medium px-3 py-1.5 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                   >
                     Delete
                   </button>
                 </div>
               )
             })}
           </div>
        </div>
      </div>
    </div>
  );
}
