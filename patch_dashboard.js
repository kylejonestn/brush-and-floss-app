const fs = require('fs');
const file = fs.readFileSync('src/components/Dashboard.jsx', 'utf8');

// Add the signature
let newFile = file.replace(
  "cloudSyncEnabled = true }",
  "cloudSyncEnabled = true, unlockedBackgrounds = ['bg1'] }"
);

// Add the streak and background hook right under state
const hookCode = `
  const { globalCurrentStreak, activeBackground } = useMemo(() => {
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
  }, [records, unlockedBackgrounds]);
`;
newFile = newFile.replace("const [timeframe, setTimeframe] = useState('Week');", "const [timeframe, setTimeframe] = useState('Week');\n" + hookCode);

// Add the background layer behind the gradient. 
// Look for className={\`bg-gradient-to-br \${currentTheme.header}
// Wait, the user said "background image behind the top gradient rounded rectangle. grayscale and 20% opaque and the theme color is still over top of it".
const searchTarget = "<div className={`bg-gradient-to-br ${currentTheme.header} text-white rounded-b-[3rem] px-8 pt-12 pb-16 shadow-lg relative transition-all duration-700`}>";
const replacement = \`<div className="relative rounded-b-[3rem] shadow-lg overflow-hidden transition-all duration-700">
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center grayscale mix-blend-multiply opacity-20"
          style={{ backgroundImage: \\\`url('/backgrounds/\${activeBackground}.jpg')\\\` }}
        />
        <div className={\\\`absolute inset-0 z-10 bg-gradient-to-br \${currentTheme.header} mix-blend-normal opacity-90\\\`} />
        
        <div className="relative z-20 px-8 pt-12 pb-16 text-white">\`;
newFile = newFile.replace(searchTarget, replacement);

fs.writeFileSync('src/components/Dashboard.jsx', newFile);
