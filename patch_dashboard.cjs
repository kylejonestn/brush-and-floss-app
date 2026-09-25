const fs = require('fs');
let file = fs.readFileSync('src/components/Dashboard.jsx', 'utf8');

file = file.replace(
  "  const [timeframe, setTimeframe] = useState('Week');",
  `  const [timeframe, setTimeframe] = useState('Week');
  const [hasAutoSet, setHasAutoSet] = useState(false);

  useEffect(() => {
    if (!hasAutoSet) {
      const hasDates = customDateRange?.start || customDateRange?.end;
      const hasPeriods = customPeriods && customPeriods.length > 0;
      if (hasDates || hasPeriods) {
        setTimeframe('Custom');
        setHasAutoSet(true);
      }
    }
  }, [customDateRange, customPeriods, hasAutoSet]);`
);

// We must also ensure useEffect is imported in Dashboard.jsx!
// Let's check imports.
if (!file.includes("useEffect")) {
  file = file.replace(
    "import React, { useMemo } from 'react';",
    "import React, { useMemo, useEffect, useState } from 'react';"
  );
  // Just in case it imports like this:
  file = file.replace(
    "import { useMemo, useState } from 'react';",
    "import { useMemo, useState, useEffect } from 'react';"
  );
}

fs.writeFileSync('src/components/Dashboard.jsx', file);
