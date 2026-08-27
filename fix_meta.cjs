const fs = require('fs');
let file = fs.readFileSync('index.html', 'utf8');
file = file.replace(
  '<meta name="apple-mobile-web-app-capable" content="yes">',
  '<meta name="mobile-web-app-capable" content="yes">\n    <meta name="apple-mobile-web-app-capable" content="yes">'
);
fs.writeFileSync('index.html', file);
