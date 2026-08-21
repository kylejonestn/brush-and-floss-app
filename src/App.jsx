import React, { useState, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import Dashboard from './components/Dashboard';
import { initDriveSync, readDriveFile, writeDriveFile } from './utils/driveSync';

function App() {
  const [records, setRecords] = useState([]);
  const [accessToken, setAccessToken] = useState(null);
  const [driveFileId, setDriveFileId] = useState(null);
  const [syncStatus, setSyncStatus] = useState('Not Synced'); // Not Synced, Syncing, Synced

  // 1. Load from local cache immediately on mount
  useEffect(() => {
    const cached = localStorage.getItem('brush_records');
    if (cached) {
      try {
        setRecords(JSON.parse(cached));
      } catch (e) {
        console.error("Failed to parse cached records");
      }
    }
  }, []);

  // 2. Setup Google Login
  const login = useGoogleLogin({
    onSuccess: (codeResponse) => {
      setAccessToken(codeResponse.access_token);
      setSyncStatus('Syncing');
    },
    scope: 'https://www.googleapis.com/auth/drive.file',
    onError: (error) => console.log('Login Failed:', error)
  });

  // 3. Background Sync Process (when token is acquired)
  useEffect(() => {
    if (!accessToken) return;

    async function syncData() {
      try {
        setSyncStatus('Syncing');
        // Find or create the Drive file
        const { fileId } = await initDriveSync(accessToken);
        setDriveFileId(fileId);

        // Read the remote data
        const remoteData = await readDriveFile(accessToken, fileId) || [];
        
        // Simple merge: we assume we just want to combine local and remote uniquely
        // In a real app we might need better conflict resolution, but for now we merge by timestamp
        const localDataStr = localStorage.getItem('brush_records');
        const localData = localDataStr ? JSON.parse(localDataStr) : [];
        
        const mergedMap = new Map();
        [...remoteData, ...localData].forEach(r => mergedMap.set(r.timestamp, r));
        
        // Sort by timestamp
        const mergedData = Array.from(mergedMap.values()).sort((a, b) => 
          new Date(a.timestamp) - new Date(b.timestamp)
        );

        // Update state and local cache with merged data
        setRecords(mergedData);
        localStorage.setItem('brush_records', JSON.stringify(mergedData));

        // Overwrite Google Drive file with merged data
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
    
    // Save to local cache instantly
    localStorage.setItem('brush_records', JSON.stringify(newRecords));
    
    // Push to Google Drive in background if authenticated
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

  return (
    <div className="min-h-screen bg-[#121212] text-white font-sans">
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
        
        <div className="mt-20 border-t border-gray-800 pt-12">
          {/* We will build the Report component next */}
          <h2 className="text-3xl font-light text-center mb-8">Kyle's <span className="text-green-400 font-bold">Brush & Floss Analysis</span></h2>
          <div className="text-center text-gray-500">
            <p>Report section is under construction...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
