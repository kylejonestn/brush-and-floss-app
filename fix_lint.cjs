const fs = require('fs');
let file = fs.readFileSync('src/App.jsx', 'utf8');

file = file.replace(
  `  const deduplicateRecords = (recordsArr) => {
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
  };`,
  ``
);

file = file.replace(
  `function App() {`,
  `const deduplicateRecords = (recordsArr) => {
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

function App() {`
);

fs.writeFileSync('src/App.jsx', file);
