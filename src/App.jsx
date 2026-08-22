import React, { useState, useEffect } from 'react';
import { useGoogleLogin, googleLogout } from '@react-oauth/google';
import html2pdf from 'html2pdf.js';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import BottomNav from './components/BottomNav';
import Onboarding from './components/Onboarding';
import { initDriveSync, readDriveFile, writeDriveFile } from './utils/driveSync';

function App() {
  const [profile, setProfile] = useState(null);
  const [records, setRecords] = useState([]);
  const [accessToken, setAccessToken] = useState(null);
  const [driveFileId, setDriveFileId] = useState(null);
  const [syncStatus, setSyncStatus] = useState('Not Synced');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    // Load Profile
    const cachedProfile = localStorage.getItem('brush_profile');
    if (cachedProfile) {
      setProfile(JSON.parse(cachedProfile));
    }

    // Load Records
    const cachedRecords = localStorage.getItem('brush_records');
    if (cachedRecords) {
      try {
        setRecords(JSON.parse(cachedRecords));
      } catch (e) {
        console.error("Failed to parse cached records");
      }
    } else {
      fetch('/brush-and-floss-app/data.json')
        .then(res => res.json())
        .then(data => {
          if(Array.isArray(data)) {
             setRecords(data);
             localStorage.setItem('brush_records', JSON.stringify(data));
          }
        })
        .catch(console.error);
    }
  }, []);

  const handleProfileComplete = (newProfile) => {
    setProfile(newProfile);
    localStorage.setItem('brush_profile', JSON.stringify(newProfile));
  };

  const login = useGoogleLogin({
    onSuccess: (codeResponse) => {
      setAccessToken(codeResponse.access_token);
      setSyncStatus('Syncing');
    },
    scope: 'https://www.googleapis.com/auth/drive.file',
    onError: (error) => console.log('Login Failed:', error)
  });

  const logout = () => {
    googleLogout();
    setAccessToken(null);
    setDriveFileId(null);
    setSyncStatus('Not Synced');
  };

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
        const mergedData = Array.from(mergedMap.values()).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        setRecords(mergedData);
        localStorage.setItem('brush_records', JSON.stringify(mergedData));
        await writeDriveFile(accessToken, fileId, mergedData);
        setSyncStatus('Synced');
      } catch (e) {
        setSyncStatus('Error syncing');
      }
    }
    syncData();
  }, [accessToken]);

  const mergeAndSaveData = async (newRecordsToMerge) => {
    const mergedMap = new Map();
    [...records, ...newRecordsToMerge].forEach(r => mergedMap.set(r.timestamp, r));
    const mergedData = Array.from(mergedMap.values()).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    setRecords(mergedData);
    localStorage.setItem('brush_records', JSON.stringify(mergedData));
    
    if (accessToken && driveFileId) {
      setSyncStatus('Syncing');
      try {
        await writeDriveFile(accessToken, driveFileId, mergedData);
        setSyncStatus('Synced');
      } catch (e) {
        setSyncStatus('Error syncing');
      }
    }
  };

  const handleLogBrush = () => {
    const newRecord = {
      timestamp: new Date().toISOString(),
      action: 'brush_and_floss'
    };
    mergeAndSaveData([newRecord]);
  };

  const exportPDF = () => {
    const element = document.getElementById('export-pdf-area');
    if (!element) return;
    const opt = {
      margin: 0.5,
      filename: `${profile?.name || 'My'}_Brush_and_Floss_Report.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  if (!profile) {
    return <Onboarding onComplete={handleProfileComplete} />;
  }

  return (
    <div className="bg-[#f4f7fb] min-h-screen text-[#1a1a1a] font-sans mx-auto max-w-md relative shadow-2xl overflow-hidden" id="export-pdf-area">
      {showSettings ? (
        <div className="pt-12 px-6 pb-32">
           <Settings 
              records={records} 
              accessToken={accessToken} 
              onLogin={login} 
              onLogout={logout} 
              onImportData={mergeAndSaveData}
              onClose={() => setShowSettings(false)}
           />
           <div className="mt-8 bg-white p-6 rounded-2xl shadow-sm text-center">
             <p className="text-gray-500 text-sm mb-4">Need to share your data with your dentist?</p>
             <button onClick={exportPDF} className="bg-[#2d3a70] text-white px-6 py-3 rounded-xl font-medium w-full">
                Export Report PDF
             </button>
           </div>
        </div>
      ) : (
        <Dashboard records={records} userName={profile.name} />
      )}

      {accessToken && syncStatus !== 'Synced' && (
         <div className="absolute top-2 right-2 text-xs text-white bg-black bg-opacity-20 px-2 py-1 rounded-full z-50">
            {syncStatus}
         </div>
      )}

      <BottomNav 
         onLogBrush={handleLogBrush} 
         showSettings={showSettings} 
         onToggleSettings={setShowSettings} 
      />
    </div>
  );
}

export default App;
