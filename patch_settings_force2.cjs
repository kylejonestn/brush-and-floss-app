const fs = require('fs');
let file = fs.readFileSync('src/components/Settings.jsx', 'utf8');

const targetStr = `                  <p className="text-emerald-800 font-medium text-sm">Connected to Google Drive</p>
                  <p className="text-emerald-600/80 text-xs mt-0.5">Your data is synced safely.</p>
                </div>
                <button 
                  onClick={onLogout}
                  className="text-xs font-bold text-emerald-700 bg-white border border-emerald-200 px-3 py-1.5 rounded-lg shadow-sm hover:bg-emerald-50 transition-colors"
                >
                  Disconnect
                </button>
              </div>`;

const newStr = `                  <p className="text-emerald-800 font-medium text-sm">Connected to Google Drive</p>
                  <p className="text-emerald-600/80 text-xs mt-0.5">Your data is synced safely.</p>
                </div>
                <button 
                  onClick={onLogout}
                  className="text-xs font-bold text-emerald-700 bg-white border border-emerald-200 px-3 py-1.5 rounded-lg shadow-sm hover:bg-emerald-50 transition-colors"
                >
                  Disconnect
                </button>
              </div>
              <div className="mt-4 border-t border-emerald-100 pt-4 flex gap-3">
                <button 
                  onClick={onForcePull}
                  className="flex-1 bg-white border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-wide py-2 px-3 rounded-lg hover:bg-emerald-50 transition-colors"
                >
                  Pull from Cloud
                </button>
                <button 
                  onClick={onForcePush}
                  className="flex-1 bg-white border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-wide py-2 px-3 rounded-lg hover:bg-emerald-50 transition-colors"
                >
                  Push to Cloud
                </button>
              </div>`;

file = file.replace(targetStr, newStr);
fs.writeFileSync('src/components/Settings.jsx', file);
