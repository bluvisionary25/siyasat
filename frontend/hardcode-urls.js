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
const HARDCODED_BASE = "'https://siyasat-backend.onrender.com/api'";
const HARDCODED_BACKEND_ROOT = "'https://siyasat-backend.onrender.com'";

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  content = content.replace(/\(process\.env\.REACT_APP_API_URL \|\| 'https:\/\/siyasat-backend\.onrender\.com'\) \+ '\/api'/g, HARDCODED_BASE);
  content = content.replace(/\(process\.env\.REACT_APP_API_URL \|\| 'https:\/\/siyasat-backend\.onrender\.com\/api'\)/g, HARDCODED_BASE);
  content = content.replace(/\(process\.env\.REACT_APP_BACKEND_URL \|\| 'https:\/\/siyasat-backend\.onrender\.com'\)/g, HARDCODED_BACKEND_ROOT);
  
  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('Hardcoded: ' + file);
  }
});
