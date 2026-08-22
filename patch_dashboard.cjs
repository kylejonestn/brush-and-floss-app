const fs = require('fs');
let file = fs.readFileSync('src/components/Dashboard.jsx', 'utf8');

file = file.replace(
  "cloudSyncEnabled = true, unlockedBackgrounds = ['bg1']",
  "cloudSyncEnabled = true, unlockedBackgrounds = ['bg1'], globalCurrentStreak = 0, customBackgroundUrl = ''"
);

const oldBlock = `  const { globalCurrentStreak, activeBackground } = useMemo(() => {
    let streak = 0;
    if (records && records.length > 0) {
       const allDays = new Set(records.map(r => r.timestamp.split('T')[0]));
       let curr = new Date();
       const todayStr = curr.toISOString().split('T')[0];
       curr.setDate(curr.getDate() - 1);
       const yesterdayStr = curr.toISOString().split('T')[0];
       
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
             const dStr = activeDate.toISOString().split('T')[0];
             if (allDays.has(dStr)) {
                streak++;
                activeDate.setDate(activeDate.getDate() - 1);
             } else {
                break;
             }
          }
       }
    }
    
    let activeBg = 'bg1';
    if (streak >= 7 && unlockedBackgrounds.length > 0) {
       const now = new Date();
       const start = new Date(now.getFullYear(), 0, 0);
       const diff = (now - start) + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
       const oneDay = 1000 * 60 * 60 * 24;
       const dayOfYear = Math.floor(diff / oneDay);
       activeBg = unlockedBackgrounds[dayOfYear % unlockedBackgrounds.length];
    }
    
    return { globalCurrentStreak: streak, activeBackground: activeBg };
  }, [records, unlockedBackgrounds]);`;

const newBlock = `  const activeBgStyle = useMemo(() => {
    if (globalCurrentStreak >= 15 && customBackgroundUrl) {
       return { backgroundImage: \`url('\${customBackgroundUrl}')\` };
    }
    
    let activeBg = 'bg1';
    if (globalCurrentStreak >= 7 && unlockedBackgrounds.length > 0) {
       const now = new Date();
       const start = new Date(now.getFullYear(), 0, 0);
       const diff = (now - start) + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
       const oneDay = 1000 * 60 * 60 * 24;
       const dayOfYear = Math.floor(diff / oneDay);
       activeBg = unlockedBackgrounds[dayOfYear % unlockedBackgrounds.length];
    }
    return { backgroundImage: \`url('/backgrounds/\${activeBg}.jpg')\` };
  }, [globalCurrentStreak, unlockedBackgrounds, customBackgroundUrl]);`;

file = file.replace(oldBlock, newBlock);

file = file.replace(
  "style={{ backgroundImage: `url('/backgrounds/${activeBackground}.jpg')` }}",
  "style={activeBgStyle}"
);

fs.writeFileSync('src/components/Dashboard.jsx', file);
