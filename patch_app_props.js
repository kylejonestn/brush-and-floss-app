const fs = require('fs');
let file = fs.readFileSync('src/App.jsx', 'utf8');

file = file.replace(
  'cloudSyncEnabled={cloudSyncEnabled}',
  'cloudSyncEnabled={cloudSyncEnabled}\n              globalCurrentStreak={globalCurrentStreak}\n              customBackgroundUrl={customBackgroundUrl}\n              onUpdateCustomBackground={handleUpdateCustomBackground}'
);

file = file.replace(
  'unlockedBackgrounds={unlockedBackgrounds}',
  'unlockedBackgrounds={unlockedBackgrounds}\n          globalCurrentStreak={globalCurrentStreak}\n          customBackgroundUrl={customBackgroundUrl}'
);

fs.writeFileSync('src/App.jsx', file);
