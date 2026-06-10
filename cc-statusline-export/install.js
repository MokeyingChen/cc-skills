const fs = require('fs');
const path = require('path');
const os = require('os');

const home = os.homedir();
const claudeDir = path.join(home, '.claude');

// 1. Copy statusline.js
const src = path.join(__dirname, 'statusline.js');
const dest = path.join(claudeDir, 'statusline.js');
fs.copyFileSync(src, dest);
console.log('Copied statusline.js to ' + dest);

// 2. Merge statusLine into settings.json
const settingsPath = path.join(claudeDir, 'settings.json');
let settings = {};
if (fs.existsSync(settingsPath)) {
  settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
}

settings.statusLine = {
  type: 'command',
  command: 'node ' + dest.replace(/\\/g, '/'),
  padding: 0,
};

fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
console.log('Updated settings.json with statusLine config');
console.log('Done! Restart Claude Code to see the status line.');
