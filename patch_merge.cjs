const fs = require('fs');
let file = fs.readFileSync('src/App.jsx', 'utf8');

// Patch 1: inside syncData
file = file.replace(
  `        const mergedMap = new Map();
        [...remoteRecords, ...localData].forEach(r => mergedMap.set(r.timestamp, r));
        const mergedData = Array.from(mergedMap.values()).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));`,
  `        const mergedMap = new Map();
        [...remoteRecords, ...localData].forEach(r => {
            const t = new Date(r.timestamp).getTime();
            const key = isNaN(t) ? r.timestamp : t;
            mergedMap.set(key, r);
        });
        const mergedData = Array.from(mergedMap.values()).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));`
);

// Patch 2: inside mergeAndSaveData
file = file.replace(
  `    const mergedMap = new Map();
    [...records, ...newRecordsToMerge].forEach(r => mergedMap.set(r.timestamp, r));
    const mergedData = Array.from(mergedMap.values()).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));`,
  `    const mergedMap = new Map();
    [...records, ...newRecordsToMerge].forEach(r => {
      const t = new Date(r.timestamp).getTime();
      const key = isNaN(t) ? r.timestamp : t;
      mergedMap.set(key, r);
    });
    const mergedData = Array.from(mergedMap.values()).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));`
);

fs.writeFileSync('src/App.jsx', file);
