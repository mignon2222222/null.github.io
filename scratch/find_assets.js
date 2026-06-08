const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const regex = /src=["']\.\/(assets\/[^"']+)["']|src=["'](assets\/[^"']+)["']|url\(["']\.\/(assets\/[^"']+)["']\)|url\(["'](assets\/[^"']+)["']\)/g;
let match;
const found = new Set();
while ((match = regex.exec(html)) !== null) {
  const asset = match[1] || match[2] || match[3] || match[4];
  if (asset) found.add(asset);
}

console.log('Assets used in HTML:', Array.from(found));
