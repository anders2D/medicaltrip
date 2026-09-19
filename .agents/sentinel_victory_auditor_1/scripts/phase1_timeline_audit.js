const fs = require('fs');
const path = require('path');

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);
  files.forEach(function(file) {
    if (file === '.git' || file === '.bin' || file === 'node_modules') return;
    const fullPath = path.join(dirPath, file);
    try {
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        getAllFiles(fullPath, arrayOfFiles);
      } else {
        arrayOfFiles.push({ path: fullPath, mtime: stat.mtime, size: stat.size, birthtime: stat.birthtime });
      }
    } catch(e) {}
  });
  return arrayOfFiles;
}

const all = getAllFiles('.');
all.sort((a, b) => a.mtime.getTime() - b.mtime.getTime());

console.log('=== PHASE 1: TIMELINE & PROVENANCE FORENSICS ===');
console.log('Total files scanned (excluding .git, .bin):', all.length);

console.log('\n--- Earliest 15 workspace files ---');
all.slice(0, 15).forEach(f => {
  console.log(f.mtime.toISOString() + ' | ' + f.size.toString().padStart(8) + ' B | ' + f.path);
});

console.log('\n--- Latest 30 modified files ---');
all.slice(-30).forEach(f => {
  console.log(f.mtime.toISOString() + ' | ' + f.size.toString().padStart(8) + ' B | ' + f.path);
});

// Group modifications by hour
const hourly = {};
all.forEach(f => {
  const hourKey = f.mtime.toISOString().substring(0, 13);
  hourly[hourKey] = (hourly[hourKey] || 0) + 1;
});

console.log('\n--- File modification distribution by hour ---');
Object.keys(hourly).sort().forEach(h => {
  console.log(h + ':00Z : ' + hourly[h] + ' files');
});
