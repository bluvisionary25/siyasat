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

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Replace `${'https://siyasat-backend.onrender.com/api'}...` with `https://siyasat-backend.onrender.com/api...` inside template literals.
  content = content.replace(/\$\{'https:\/\/siyasat-backend\.onrender\.com\/api'\}/g, 'https://siyasat-backend.onrender.com/api');
  content = content.replace(/\$\{'https:\/\/siyasat-backend\.onrender\.com'\}/g, 'https://siyasat-backend.onrender.com');
  
  // Clean up any double quotes or backticks if it's completely static now (optional, but requested by user)
  // e.g. `https://siyasat-backend.onrender.com/api/theses` -> 'https://siyasat-backend.onrender.com/api/theses'
  content = content.replace(/`https:\/\/siyasat-backend\.onrender\.com\/api([^$]*?)`/g, "'https://siyasat-backend.onrender.com/api$1'");

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('Fixed syntax: ' + file);
  }
});
