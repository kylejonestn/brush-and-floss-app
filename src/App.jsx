import React, { useState, useEffect, useMemo } from 'react';
import { useGoogleLogin, googleLogout } from '@react-oauth/google';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import BottomNav from './components/BottomNav';
import Onboarding from './components/Onboarding';
import { initDriveSync, readDriveFile, writeDriveFile } from './utils/driveSync';
import { ENCOURAGING_PHRASES } from './utils/phrases';
import { format, parseISO } from 'date-fns';

const deduplicateRecords = (recordsArr) => {
  const cleaned = [];
  for (const record of recordsArr) {
    if (cleaned.length === 0) {
      cleaned.push(record);
    } else {
      const lastRecord = cleaned[cleaned.length - 1];
      const lastTime = new Date(lastRecord.timestamp).getTime();
      const currTime = new Date(record.timestamp).getTime();
      if (currTime - lastTime > 300000) {
        cleaned.push(record);
      }
    }
  }
  return cleaned;
};

function App() {
  const [profile, setProfile] = useState(null);
  const [records, setRecords] = useState([]);
  const [accessToken, setAccessToken] = useState(null);
  const [driveFileId, setDriveFileId] = useState(null);
  const [syncStatus, setSyncStatus] = useState('Not Synced');
  const [showSettings, setShowSettings] = useState(false);
  const [themeIndex, setThemeIndex] = useState(0);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [customPeriods, setCustomPeriods] = useState([]);
  const [cloudSyncEnabled, setCloudSyncEnabled] = useState(true);
  const [unlockedBackgrounds, setUnlockedBackgrounds] = useState(['bg1']);
  const [customBackgroundUrl, setCustomBackgroundUrl] = useState('');

  const globalCurrentStreak = useMemo(() => {
    let streak = 0;
    if (records && records.length > 0) {
       const allDays = new Set(records.map(r => format(parseISO(r.timestamp), 'yyyy-MM-dd')));
       let curr = new Date();
       const todayStr = format(curr, 'yyyy-MM-dd');
       curr.setDate(curr.getDate() - 1);
       const yesterdayStr = format(curr, 'yyyy-MM-dd');
       
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
             const dStr = format(activeDate, 'yyyy-MM-dd');
             if (allDays.has(dStr)) {
                streak++;
                activeDate.setDate(activeDate.getDate() - 1);
             } else {
                break;
             }
          }
       }
    }
    return streak;
  }, [records]);

  useEffect(() => {
    const cachedProfile = localStorage.getItem('brush_profile');
    if (cachedProfile) setProfile(JSON.parse(cachedProfile));

    const cachedTheme = localStorage.getItem('brush_theme_index');
    if (cachedTheme) setThemeIndex(parseInt(cachedTheme, 10));

    const cachedPhrase = localStorage.getItem('brush_phrase_index');
    if (cachedPhrase) setPhraseIndex(parseInt(cachedPhrase, 10));
    else setPhraseIndex(Math.floor(Math.random() * ENCOURAGING_PHRASES.length));

    const cachedDates = localStorage.getItem('brush_custom_dates');
    if (cachedDates) setCustomDateRange(JSON.parse(cachedDates));

    const cachedPeriods = localStorage.getItem('brush_custom_periods');
    if (cachedPeriods) setCustomPeriods(JSON.parse(cachedPeriods));

    let currentBgs = ['bg1'];
    const cachedBackgrounds = localStorage.getItem('brush_unlocked_bgs');
    if (cachedBackgrounds) {
      currentBgs = JSON.parse(cachedBackgrounds);
    }

    const cachedCustomBg = localStorage.getItem('brush_custom_bg_url');
    if (cachedCustomBg) setCustomBackgroundUrl(cachedCustomBg);

    const urlParams = new URLSearchParams(window.location.search);
    const unlock = urlParams.get('unlock');
    if (unlock && /^bg[1-6]$/.test(unlock)) {
      if (!currentBgs.includes(unlock)) {
        currentBgs = [...currentBgs, unlock];
        localStorage.setItem('brush_unlocked_bgs', JSON.stringify(currentBgs));
        setTimeout(() => alert(`🎉 Congratulations! You've unlocked a new background wallpaper!`), 100);
      } else {
        setTimeout(() => alert(`You already have this wallpaper unlocked!`), 100);
      }
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    setUnlockedBackgrounds(currentBgs);

    const cachedSyncEnabled = localStorage.getItem('brush_sync_enabled');
    if (cachedSyncEnabled !== null) setCloudSyncEnabled(cachedSyncEnabled === 'true');

    const cachedToken = localStorage.getItem('brush_access_token');
    const tokenExpiry = localStorage.getItem('brush_token_expiry');
    if (cachedToken && tokenExpiry && Date.now() < parseInt(tokenExpiry, 10)) {
      setAccessToken(cachedToken);
    } else {
      localStorage.removeItem('brush_access_token');
      localStorage.removeItem('brush_token_expiry');
    }

    const cachedRecords = localStorage.getItem('brush_records');
    if (cachedRecords) {
      try {
        setRecords(JSON.parse(cachedRecords));
      } catch (e) {
        console.error("Failed to parse cached records", e);
      }
    }
  }, []);

  const handleProfileComplete = (newProfile) => {
    setProfile(newProfile);
    localStorage.setItem('brush_profile', JSON.stringify(newProfile));
  };

  const triggerSettingsSync = async (dates, periods, recs) => {
    if (!cloudSyncEnabled || !accessToken || !driveFileId) return;
    setSyncStatus('Syncing');
    try {
      const bgsStr = localStorage.getItem('brush_unlocked_bgs');
      const bgs = bgsStr ? JSON.parse(bgsStr) : ['bg1'];
      
      const payload = {
        records: recs,
        settings: {
          customDateRange: dates,
          customPeriods: periods,
          unlockedBackgrounds: bgs,
          customBackgroundUrl: localStorage.getItem('brush_custom_bg_url') || ''
        }
      };
      await writeDriveFile(accessToken, driveFileId, payload);
      setSyncStatus('Synced');
    } catch (e) {
      if (e.message && e.message.includes('401')) logout();
      else setSyncStatus('Error syncing');
    }
  };

  const handleUpdateCustomBackground = (url) => {
    setCustomBackgroundUrl(url);
    localStorage.setItem('brush_custom_bg_url', url);
    triggerSettingsSync(customDateRange, customPeriods, records);
  };

  const updateCustomDates = (newDates) => {
    setCustomDateRange(newDates);
    localStorage.setItem('brush_custom_dates', JSON.stringify(newDates));
    triggerSettingsSync(newDates, customPeriods, records);
  };

  const addCustomPeriod = (period) => {
    const next = [...customPeriods, { ...period, id: Date.now().toString() }];
    setCustomPeriods(next);
    localStorage.setItem('brush_custom_periods', JSON.stringify(next));
    triggerSettingsSync(customDateRange, next, records);
  };

  const removeCustomPeriod = (id) => {
    const next = customPeriods.filter(p => p.id !== id);
    setCustomPeriods(next);
    localStorage.setItem('brush_custom_periods', JSON.stringify(next));
    triggerSettingsSync(customDateRange, next, records);
  };

  const login = useGoogleLogin({
    onSuccess: (codeResponse) => {
      setAccessToken(codeResponse.access_token);
      setSyncStatus('Syncing');
      localStorage.setItem('brush_access_token', codeResponse.access_token);
      localStorage.setItem('brush_token_expiry', (Date.now() + 59 * 60 * 1000).toString());
    },
    scope: 'https://www.googleapis.com/auth/drive.file',
    onError: (error) => console.log('Login Failed:', error)
  });

  const logout = () => {
    googleLogout();
    setAccessToken(null);
    setDriveFileId(null);
    setSyncStatus('Not Synced');
    localStorage.removeItem('brush_access_token');
    localStorage.removeItem('brush_token_expiry');
  };


  const handleForcePull = async () => {
    if (!accessToken || !cloudSyncEnabled) return;
    if (!window.confirm("WARNING: This will completely replace your local data with the data from the cloud. Continue?")) return;
    setSyncStatus('Syncing');
    try {
      let fileId = driveFileId;
      if (!fileId) {
        fileId = await initDriveSync(accessToken);
        setDriveFileId(fileId);
      }
      const fileData = await readDriveFile(accessToken, fileId);
      if (fileData) {
        const remoteRecords = fileData.records || [];
        const remoteSettings = fileData.settings || null;
        
        if (remoteSettings) {
            if (remoteSettings.customDateRange) {
                setCustomDateRange(remoteSettings.customDateRange);
                localStorage.setItem('brush_custom_dates', JSON.stringify(remoteSettings.customDateRange));
            }
            if (remoteSettings.customPeriods) {
                setCustomPeriods(remoteSettings.customPeriods);
                localStorage.setItem('brush_custom_periods', JSON.stringify(remoteSettings.customPeriods));
            }
            if (remoteSettings.unlockedBackgrounds) {
                setUnlockedBackgrounds(remoteSettings.unlockedBackgrounds);
                localStorage.setItem('brush_unlocked_bgs', JSON.stringify(remoteSettings.unlockedBackgrounds));
            }
            if (remoteSettings.customBackgroundUrl !== undefined) {
                setCustomBackgroundUrl(remoteSettings.customBackgroundUrl);
                localStorage.setItem('brush_custom_bg_url', remoteSettings.customBackgroundUrl);
            }
        }
        
        let cleaned = deduplicateRecords(remoteRecords.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)));
        setRecords(cleaned);
        localStorage.setItem('brush_records', JSON.stringify(cleaned));
        setSyncStatus('Synced');
        alert("Success! Replaced local data with Cloud data.");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to pull from cloud.");
      setSyncStatus('Error syncing');
    }
  };

  const handleForcePush = async () => {
    if (!accessToken || !cloudSyncEnabled) return;
    if (!window.confirm("WARNING: This will completely replace the cloud data with your current local data. Continue?")) return;
    setSyncStatus('Syncing');
    try {
      let fileId = driveFileId;
      if (!fileId) {
        fileId = await initDriveSync(accessToken);
        setDriveFileId(fileId);
      }
      const newPayload = {
          records: records,
          settings: {
              customDateRange: customDateRange,
              customPeriods: customPeriods,
              unlockedBackgrounds: unlockedBackgrounds,
              customBackgroundUrl: customBackgroundUrl
          }
      };
      await writeDriveFile(accessToken, fileId, newPayload);
      setSyncStatus('Synced');
      alert("Success! Replaced Cloud data with local data.");
    } catch (e) {
      console.error(e);
      alert("Failed to push to cloud.");
      setSyncStatus('Error syncing');
    }
  };

  const handleToggleCloudSync = (enabled) => {
    setCloudSyncEnabled(enabled);
    localStorage.setItem('brush_sync_enabled', enabled.toString());
    if (!enabled && accessToken) {
      logout();
    }
  };

  useEffect(() => {
    if (!accessToken || !cloudSyncEnabled) return;
    async function syncData() {
      try {
        setSyncStatus('Syncing');
        const { fileId } = await initDriveSync(accessToken);
        setDriveFileId(fileId);

        const remotePayload = await readDriveFile(accessToken, fileId) || [];
        let remoteRecords = [];
        let remoteSettings = null;

        if (Array.isArray(remotePayload)) {
            remoteRecords = remotePayload;
        } else if (remotePayload && typeof remotePayload === 'object' && remotePayload.records) {
            remoteRecords = remotePayload.records;
            remoteSettings = remotePayload.settings;
        }

        const localDataStr = localStorage.getItem('brush_records');
        const localData = localDataStr ? JSON.parse(localDataStr) : [];
        
        const mergedMap = new Map();
        [...remoteRecords, ...localData].forEach(r => {
            const t = new Date(r.timestamp).getTime();
            const key = isNaN(t) ? r.timestamp : t;
            mergedMap.set(key, r);
        });
        let mergedData = Array.from(mergedMap.values()).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        mergedData = deduplicateRecords(mergedData);

        let nextDates = customDateRange;
        let nextPeriods = customPeriods;
        
        const localBgsStr = localStorage.getItem('brush_unlocked_bgs');
        let nextBackgrounds = localBgsStr ? JSON.parse(localBgsStr) : ['bg1'];

        if (remoteSettings) {
            if (remoteSettings.customDateRange) {
                nextDates = remoteSettings.customDateRange;
                setCustomDateRange(nextDates);
                localStorage.setItem('brush_custom_dates', JSON.stringify(nextDates));
            }
            if (remoteSettings.customPeriods) {
                nextPeriods = remoteSettings.customPeriods;
                setCustomPeriods(nextPeriods);
                localStorage.setItem('brush_custom_periods', JSON.stringify(nextPeriods));
            }
            if (remoteSettings.unlockedBackgrounds) {
                const combinedBgs = Array.from(new Set([...nextBackgrounds, ...remoteSettings.unlockedBackgrounds]));
                nextBackgrounds = combinedBgs;
                setUnlockedBackgrounds(combinedBgs);
                localStorage.setItem('brush_unlocked_bgs', JSON.stringify(combinedBgs));
            }
            if (remoteSettings.customBackgroundUrl !== undefined) {
                setCustomBackgroundUrl(remoteSettings.customBackgroundUrl);
                localStorage.setItem('brush_custom_bg_url', remoteSettings.customBackgroundUrl);
            }
        }

        setRecords(mergedData);
        localStorage.setItem('brush_records', JSON.stringify(mergedData));
        
        const newPayload = {
            records: mergedData,
            settings: {
                customDateRange: nextDates,
                customPeriods: nextPeriods,
                unlockedBackgrounds: nextBackgrounds,
                customBackgroundUrl: localStorage.getItem('brush_custom_bg_url') || ''
            }
        };
        await writeDriveFile(accessToken, fileId, newPayload);
        setSyncStatus('Synced');
      } catch (e) {
        console.error(e);
        if (e.message && e.message.includes('401')) logout();
        else setSyncStatus('Error syncing');
      }
    }
    syncData();
  }, [accessToken, cloudSyncEnabled]);



  const saveAndSyncRecords = async (newRecordsArray) => {
    setRecords(newRecordsArray);
    localStorage.setItem('brush_records', JSON.stringify(newRecordsArray));
    await triggerSettingsSync(customDateRange, customPeriods, newRecordsArray);
  };

  const mergeAndSaveData = async (newRecordsToMerge) => {
    const mergedMap = new Map();
    [...records, ...newRecordsToMerge].forEach(r => {
      const t = new Date(r.timestamp).getTime();
      const key = isNaN(t) ? r.timestamp : t;
      mergedMap.set(key, r);
    });
    let mergedData = Array.from(mergedMap.values()).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    mergedData = deduplicateRecords(mergedData);
    saveAndSyncRecords(mergedData);
  };

  const handleLogBrush = () => {
    const newRecord = {
      timestamp: new Date().toISOString(),
      action: 'brush_and_floss'
    };
    mergeAndSaveData([newRecord]);
    const nextTheme = (themeIndex + 1) % 7;
    setThemeIndex(nextTheme);
    localStorage.setItem('brush_theme_index', nextTheme.toString());

    const nextPhrase = (phraseIndex + 1) % ENCOURAGING_PHRASES.length;
    setPhraseIndex(nextPhrase);
    localStorage.setItem('brush_phrase_index', nextPhrase.toString());
  };

  const handleDeleteRecords = (timestampsToRemove) => {
    const updatedRecords = records.filter(r => !timestampsToRemove.includes(r.timestamp));
    saveAndSyncRecords(updatedRecords);
  };

  const exportPDF = () => {
    setShowSettings(false);
    // Give it a split second to mount the Dashboard, then open native print dialog
    setTimeout(() => {
      window.print();
    }, 800);
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
              onAddRecord={(rec) => mergeAndSaveData([rec])}
              onDeleteRecords={handleDeleteRecords}
              customDateRange={customDateRange}
              updateCustomDates={updateCustomDates}
              customPeriods={customPeriods}
              addCustomPeriod={addCustomPeriod}
              removeCustomPeriod={removeCustomPeriod}
              cloudSyncEnabled={cloudSyncEnabled}
              onToggleCloudSync={handleToggleCloudSync}
              onClose={() => setShowSettings(false)}
              globalCurrentStreak={globalCurrentStreak}
              customBackgroundUrl={customBackgroundUrl}
              onUpdateCustomBackground={handleUpdateCustomBackground}
              unlockedBackgrounds={unlockedBackgrounds}
              onForcePull={handleForcePull}
              onForcePush={handleForcePush}
           />
           <div className="mt-8 bg-white p-6 rounded-2xl shadow-sm text-center">
             <p className="text-gray-500 text-sm mb-4">Need to share your data with your dentist?</p>
             <button onClick={exportPDF} className="bg-[#2d3a70] text-white px-6 py-3 rounded-xl font-medium w-full">
                Export Report PDF
             </button>
           </div>
        </div>
      ) : (
        <Dashboard 
          records={records} 
          userName={profile.name} 
          themeIndex={themeIndex}
          phraseIndex={phraseIndex} 
          syncStatus={syncStatus} 
          onLogin={login}
          customDateRange={customDateRange}
          customPeriods={customPeriods}
          cloudSyncEnabled={cloudSyncEnabled}
          unlockedBackgrounds={unlockedBackgrounds}
          globalCurrentStreak={globalCurrentStreak}
          customBackgroundUrl={customBackgroundUrl}
        />
      )}

      <BottomNav 
         onLogBrush={handleLogBrush} 
         showSettings={showSettings} 
         onToggleSettings={setShowSettings}
         themeIndex={themeIndex}
          phraseIndex={phraseIndex}
      />
    </div>
  );
}

export default App;
