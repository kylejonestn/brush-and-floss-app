const fs = require('fs');
let file = fs.readFileSync('src/components/Settings.jsx', 'utf8');

const pasteState = `  const [periodEnd, setPeriodEnd] = useState('');
  const [pastedData, setPastedData] = useState('');`;

file = file.replace(`  const [periodEnd, setPeriodEnd] = useState('');`, pasteState);

const pasteHandler = `
  const handlePasteImport = () => {
    if (!pastedData.trim()) return;
    const lines = pastedData.split('\\n');
    const parsedRecords = [];
    let count = 0;
    for (let line of lines) {
      line = line.trim();
      if (!line) continue;
      const dt = new Date(line);
      if (!isNaN(dt.getTime())) {
        parsedRecords.push({
          timestamp: dt.toISOString(),
          action: 'brush_and_floss'
        });
        count++;
      }
    }
    
    if (parsedRecords.length > 0) {
      onImportData(parsedRecords);
      setImportMessage(\`Successfully imported \${parsedRecords.length} records from paste!\`);
      setPastedData('');
    } else {
      setImportMessage('No valid timestamps found in the pasted text.');
    }
  };
`;

file = file.replace(
  `  const handleImport = (e) => {`,
  pasteHandler + `\n  const handleImport = (e) => {`
);

const importSection = `      <div className="mb-8 border-b pb-8">
        <h3 className="text-xl font-semibold mb-3 text-gray-800">Import Data</h3>
        
        <div className="mb-6">
          <p className="text-gray-500 text-sm mb-3">
            Paste a list of timestamps (like 7/11/2026 22:57:48). Your browser will automatically detect and apply your local timezone!
          </p>
          <textarea
            value={pastedData}
            onChange={(e) => setPastedData(e.target.value)}
            placeholder="7/11/2026 22:57:48&#10;7/12/2026 21:46:28"
            className="w-full h-32 bg-white border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-[#2d3a70] shadow-sm mb-3 font-mono text-gray-600"
          />
          <button 
            onClick={handlePasteImport}
            className="w-full bg-[#2d3a70] text-white py-3 rounded-xl font-medium transition-colors shadow-sm"
          >
            Import Pasted Timestamps
          </button>
        </div>

        <div className="relative flex py-2 items-center mb-6">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-bold uppercase tracking-wider">OR CSV</span>
            <div className="flex-grow border-t border-gray-200"></div>
        </div>

        <p className="text-gray-500 text-sm mb-4">
          Import historical data from an Excel or CSV file. Ensure it has "Date" and "Time" columns.
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
          className="w-full bg-white border-2 border-gray-200 text-gray-700 hover:border-gray-300 py-3 rounded-xl font-medium transition-colors mb-3 shadow-sm"
        >
          Choose CSV File
        </button>
        {importMessage && <p className="text-sm text-center text-[#2d3a70] font-bold mt-2">{importMessage}</p>}
      </div>`;

file = file.replace(
  /<div className="mb-8 border-b pb-8">\s*<h3 className="text-xl font-semibold mb-3 text-gray-800">Import CSV<\/h3>[\s\S]*?\{importMessage && <p className="text-sm text-center text-gray-600 font-medium">\{importMessage\}<\/p>\}\s*<\/div>/,
  importSection
);

fs.writeFileSync('src/components/Settings.jsx', file);
