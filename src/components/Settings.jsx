import React, { useRef, useState } from 'react';
import Papa from 'papaparse';
import { format, parseISO } from 'date-fns';
import { Trash2 } from 'lucide-react';

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
  onClose 
}) {
  const fileInputRef = useRef(null);
  const [importMessage, setImportMessage] = useState('');
  
  const [manualDate, setManualDate] = useState('');
  const [manualTime, setManualTime] = useState('');

  const [reminderTime1, setReminderTime1] = useState('08:00');
  const [reminderTime2, setReminderTime2] = useState('21:00');

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

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        let newRecords = [];
        results.data.forEach(row => {
          const rawDate = row['Timestamp'] || row['Date'] || Object.values(row)[0];
          if (rawDate) {
            try {
              const d = new Date(rawDate);
              if (!isNaN(d.getTime())) {
                newRecords.push({
                  timestamp: d.toISOString(),
                  action: 'brush_and_floss'
                });
              }
            } catch (err) {
              console.warn("Could not parse date:", rawDate);
            }
          }
        });

        if (newRecords.length > 0) {
          onImportData(newRecords);
          setImportMessage(`Successfully imported ${newRecords.length} records!`);
        } else {
          setImportMessage('No valid records found in CSV.');
        }
      },
      error: (error) => {
        setImportMessage(`Error reading CSV: ${error.message}`);
      }
    });
  };

  const handleManualAdd = (e) => {
    e.preventDefault();
    if (!manualDate || !manualTime) return;
    
    // Construct local date time
    const d = new Date(`${manualDate}T${manualTime}`);
    if (!isNaN(d.getTime())) {
      onAddRecord({
        timestamp: d.toISOString(),
        action: 'brush_and_floss'
      });
      setManualDate('');
      setManualTime('');
      setImportMessage('Record added successfully!');
      setTimeout(() => setImportMessage(''), 3000);
    }
  };

  // Show only last 50 records in the list for performance
  const recentRecords = [...records].reverse().slice(0, 50);

  return (
    <div className="bg-white text-black p-6 sm:p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] mx-auto">
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
        <h3 className="text-xl font-semibold mb-3 text-gray-800">Cloud Sync</h3>
        <p className="text-gray-500 text-sm mb-4">
          Connect your Google Drive to securely backup and sync your data across devices.
        </p>
        {accessToken ? (
          <div>
            <p className="text-emerald-600 font-medium mb-4 flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Connected to Google Drive
            </p>
            <button 
              onClick={onLogout}
              className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg font-medium transition-colors text-sm"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button 
            onClick={onLogin}
            className="bg-[#2d3a70] hover:bg-[#3b4b94] text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-md"
          >
            Connect to Google Drive
          </button>
        )}
      </div>

      <div className="mb-8 border-b pb-8">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">Profile</h3>
        <button 
          onClick={() => {
            localStorage.removeItem('brush_profile');
            window.location.reload();
          }}
          className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-medium transition-colors text-sm"
        >
          Change Name (Reset Profile)
        </button>
      </div>

      <div className="mb-8 border-b pb-8">
        <h3 className="text-xl font-semibold mb-3 text-gray-800">Manage Records</h3>
        
        <form onSubmit={handleManualAdd} className="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
           <p className="text-sm text-gray-600 mb-3 font-medium">Add a missed record</p>
           <div className="flex gap-2 mb-3">
              <input 
                 type="date" 
                 value={manualDate} 
                 onChange={e => setManualDate(e.target.value)}
                 className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2d3a70]"
                 required
              />
              <input 
                 type="time" 
                 value={manualTime} 
                 onChange={e => setManualTime(e.target.value)}
                 className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2d3a70]"
                 required
              />
           </div>
           <button type="submit" className="w-full bg-[#2d3a70] text-white py-2 rounded-lg text-sm font-medium">
              Add Record
           </button>
        </form>

        <p className="text-sm text-gray-600 mb-3 font-medium">Recent Records</p>
        <div className="max-h-60 overflow-y-auto pr-2 space-y-2">
           {recentRecords.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No records found.</p>
           ) : (
              recentRecords.map(r => (
                 <div key={r.timestamp} className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-lg">
                    <span className="text-sm text-gray-700">
                       {format(parseISO(r.timestamp), 'MMM d, yyyy - h:mm a')}
                    </span>
                    <button 
                       onClick={() => onDeleteRecord(r.timestamp)}
                       className="text-red-400 hover:text-red-600 p-1"
                       title="Delete record"
                    >
                       <Trash2 size={16} />
                    </button>
                 </div>
              ))
           )}
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

      <div>
        <h3 className="text-xl font-semibold mb-3 text-gray-800">Import CSV</h3>
        <p className="text-gray-500 text-sm mb-4">
          Import your historical data from a CSV file. The file should have a column with dates/timestamps.
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
          className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-medium transition-colors text-sm"
        >
          Select CSV File
        </button>
        
        {importMessage && (
          <p className="mt-4 text-sm font-medium text-emerald-600">{importMessage}</p>
        )}
      </div>
    </div>
  );
}
