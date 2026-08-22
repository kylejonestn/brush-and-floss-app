const fs = require('fs');
let file = fs.readFileSync('src/App.jsx', 'utf8');

file = file.replace(
  "import { ENCOURAGING_PHRASES } from './utils/phrases';",
  "import { ENCOURAGING_PHRASES } from './utils/phrases';\nimport { format, parseISO } from 'date-fns';"
);

const oldStreakBlock = `  const globalCurrentStreak = useMemo(() => {
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
    return streak;
  }, [records]);`;

const newStreakBlock = `  const globalCurrentStreak = useMemo(() => {
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
  }, [records]);`;

file = file.replace(oldStreakBlock, newStreakBlock);
fs.writeFileSync('src/App.jsx', file);
