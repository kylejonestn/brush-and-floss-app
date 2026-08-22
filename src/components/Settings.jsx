import React, { useRef, useState } from 'react';
import Papa from 'papaparse';
import { parse } from 'date-fns';

export default function Settings({ 
  records, 
  accessToken, 
  onLogin, 
  onLogout, 
  onImportData, 
  onClose 
}) {
  const fileInputRef = useRef(null);
  const [importMessage, setImportMessage] = useState('');

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        let newRecords = [];
        results.data.forEach(row => {
          // Assuming CSV has a 'Timestamp' column from the old Excel
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

  return (
    <div className="bg-white text-black p-8 rounded-xl shadow-xl mt-8 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold">Settings</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-black">
          Close
        </button>
      </div>

      <div className="mb-8 border-b pb-8">
        <h3 className="text-xl font-semibold mb-4">Cloud Sync</h3>
        <p className="text-gray-600 mb-4">
          Connect your Google Drive to securely backup and sync your data across devices.
        </p>
        {accessToken ? (
          <div>
            <p className="text-green-600 font-medium mb-4">✓ Connected to Google Drive</p>
            <button 
              onClick={onLogout}
              className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded font-medium transition-colors"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button 
            onClick={onLogin}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium transition-colors"
          >
            Connect to Google Drive
          </button>
        )}
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-4">Import Data</h3>
        <p className="text-gray-600 mb-4">
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
          className="bg-gray-200 hover:bg-gray-300 text-black px-4 py-2 rounded font-medium transition-colors"
        >
          Select CSV File
        </button>
        
        {importMessage && (
          <p className="mt-4 text-sm font-medium text-purple-600">{importMessage}</p>
        )}
      </div>
    </div>
  );
}
