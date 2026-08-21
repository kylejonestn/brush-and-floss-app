import React, { useState, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import html2pdf from 'html2pdf.js';
import Dashboard from './components/Dashboard';
import Report from './components/Report';
import { initDriveSync, readDriveFile, writeDriveFile } from './utils/driveSync';

function App() {
  const [records, setRecords] = useState([]);
  const [accessToken, setAccessToken] = useState(null);
  const [driveFileId, setDriveFileId] = useState(null);
  const [syncStatus, setSyncStatus] = useState('Not Synced');

  useEffect(() => {
    const cached = localStorage.getItem('brush_records');
    if (cached) {
      try {
        setRecords(JSON.parse(cached));
      } catch (e) {
        console.error("Failed to parse cached records");
      }
    } else {
      // Fallback: load migrated old data on first run
      fetch('/data.json')
        .then(res => res.json())
        .then(data => {
          setRecords(data);
          localStorage.setItem('brush_records', JSON.stringify(data));
        })
        .catch(console.error);
    }
  }, []);

  const login = useGoogleLogin({
    onSuccess: (codeResponse) => {
      setAccessToken(codeResponse.access_token);
      setSyncStatus('Syncing');
    },
    scope: 'https://www.googleapis.com/auth/drive.file',
    onError: (error) => console.log('Login Failed:', error)
  });

  useEffect(() => {
    if (!accessToken) return;

    async function syncData() {
      try {
        setSyncStatus('Syncing');
        const { fileId } = await initDriveSync(accessToken);
        setDriveFileId(fileId);

        const remoteData = await readDriveFile(accessToken, fileId) || [];
        
        const localDataStr = localStorage.getItem('brush_records');
        const localData = localDataStr ? JSON.parse(localDataStr) : [];
        
        const mergedMap = new Map();
        [...remoteData, ...localData].forEach(r => mergedMap.set(r.timestamp, r));
        
        const mergedData = Array.from(mergedMap.values()).sort((a, b) => 
          new Date(a.timestamp) - new Date(b.timestamp)
        );

        setRecords(mergedData);
        localStorage.setItem('brush_records', JSON.stringify(mergedData));

        await writeDriveFile(accessToken, fileId, mergedData);
        setSyncStatus('Synced');
      } catch (e) {
        console.error("Sync error", e);
        setSyncStatus('Error syncing');
      }
    }

    syncData();
  }, [accessToken]);

  const handleLogBrush = async () => {
    const newRecord = {
      timestamp: new Date().toISOString(),
      action: 'brush_and_floss'
    };
    
    const newRecords = [...records, newRecord];
    setRecords(newRecords);
    
    localStorage.setItem('brush_records', JSON.stringify(newRecords));
    
    if (accessToken && driveFileId) {
      setSyncStatus('Syncing');
      try {
        await writeDriveFile(accessToken, driveFileId, newRecords);
        setSyncStatus('Synced');
      } catch (e) {
        console.error("Failed to push to Drive", e);
        setSyncStatus('Error syncing');
      }
    }
  };

  const exportPDF = () => {
    const element = document.getElementById('export-pdf-area');
    if (!element) return;
    const opt = {
      margin:       0.5,
      filename:     'Brush_and_Floss_Report.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white font-sans pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        <div className="flex justify-end items-center mb-4">
          <div className="text-sm text-gray-400 mr-4">
            Status: {syncStatus}
          </div>
          {!accessToken && (
            <button 
              onClick={() => login()}
              className="bg-white text-black px-4 py-2 rounded font-medium text-sm hover:bg-gray-200"
            >
              Sign in to Sync
            </button>
          )}
        </div>

        <Dashboard records={records} onLogBrush={handleLogBrush} />
        
        <div className="mt-20 border-t border-gray-800 pt-12 relative">
          <div className="absolute right-0 top-12">
             <button 
                onClick={exportPDF}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded font-medium text-sm transition-colors"
             >
                Export PDF
             </button>
          </div>
          <Report records={records} />
        </div>
      </div>
    </div>
  );
}

export default App;
