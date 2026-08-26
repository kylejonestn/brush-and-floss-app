const fs = require('fs');
let file = fs.readFileSync('src/App.jsx', 'utf8');

const dedupFunction = `  const deduplicateRecords = (recordsArr) => {
    const cleaned = [];
    for (const record of recordsArr) {
      if (cleaned.length === 0) {
        cleaned.push(record);
      } else {
        const lastRecord = cleaned[cleaned.length - 1];
        const lastTime = new Date(lastRecord.timestamp).getTime();
        const currTime = new Date(record.timestamp).getTime();
        // If the record is within 5 minutes (300,000 ms) of the previous one, consider it a duplicate and drop it
        if (currTime - lastTime > 300000) {
          cleaned.push(record);
        }
      }
    }
    return cleaned;
  };
`;

file = file.replace(
  "  const saveAndSyncRecords = async (newRecordsArray) => {",
  dedupFunction + "\n  const saveAndSyncRecords = async (newRecordsArray) => {"
);

// Apply it inside syncData
file = file.replace(
  `        const mergedData = Array.from(mergedMap.values()).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));`,
  `        let mergedData = Array.from(mergedMap.values()).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        mergedData = deduplicateRecords(mergedData);`
);

// Apply it inside mergeAndSaveData
file = file.replace(
  `    const mergedData = Array.from(mergedMap.values()).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    saveAndSyncRecords(mergedData);`,
  `    let mergedData = Array.from(mergedMap.values()).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    mergedData = deduplicateRecords(mergedData);
    saveAndSyncRecords(mergedData);`
);

fs.writeFileSync('src/App.jsx', file);
