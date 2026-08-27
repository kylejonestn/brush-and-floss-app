const fs = require('fs');
let file = fs.readFileSync('src/App.jsx', 'utf8');

const forceFunctions = `
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
`;

file = file.replace(
  `  const handleToggleCloudSync = (enabled) => {`,
  forceFunctions + `\n  const handleToggleCloudSync = (enabled) => {`
);

file = file.replace(
  `onUpdateCustomBackground={handleUpdateCustomBackground}
              unlockedBackgrounds={unlockedBackgrounds}`,
  `onUpdateCustomBackground={handleUpdateCustomBackground}
              unlockedBackgrounds={unlockedBackgrounds}
              onForcePull={handleForcePull}
              onForcePush={handleForcePush}`
);

fs.writeFileSync('src/App.jsx', file);
