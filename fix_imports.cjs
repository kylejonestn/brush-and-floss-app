const fs = require('fs');
let file = fs.readFileSync('src/components/Dashboard.jsx', 'utf8');

file = file.replace(
  "import React, { useMemo, useState } from 'react';",
  "import React, { useMemo, useState, useEffect } from 'react';"
);

fs.writeFileSync('src/components/Dashboard.jsx', file);
