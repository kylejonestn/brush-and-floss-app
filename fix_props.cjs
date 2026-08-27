const fs = require('fs');
let file = fs.readFileSync('src/components/Settings.jsx', 'utf8');

file = file.replace(
  /unlockedBackgrounds = \[\]\s*\}\) \{/,
  "unlockedBackgrounds = [],\n  onForcePull,\n  onForcePush\n}) {"
);

fs.writeFileSync('src/components/Settings.jsx', file);
