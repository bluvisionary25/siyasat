const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      if (dirFile.endsWith('.js') || dirFile.endsWith('.jsx')) {
        filelist.push(dirFile);
      }
    }
  });
  return filelist;
};

const files = walkSync('./src');
const NEW_BASE = "(process.env.REACT_APP_API_URL || 'https://siyasat-backend.onrender.com')";

let updatedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  content = content.replace(/\(process\.env\.REACT_APP_API_URL \|\| 'https:\/\/siyasat-backend\.onrender\.com\/api'\)/g, 
                            NEW_BASE + " + '/api'");

  // Also replace old BACKEND_URL cases if they use the same variable but shouldn't have `/api`
  // Actually, since I'm just correcting the API_BASE_URL to fallback to Render root, `NEW_BASE + '/api'` will work.
  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('Updated: ' + file);
    updatedCount++;
  }
});
console.log('Total files updated: ' + updatedCount);
