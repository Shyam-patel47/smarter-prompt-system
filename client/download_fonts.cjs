const fs = require('fs');
const https = require('https');
const path = require('path');

const fontsDir = path.join(__dirname, 'public', 'fonts');
if (!fs.existsSync(fontsDir)) fs.mkdirSync(fontsDir, { recursive: true });

async function downloadFont() {
  const cssUrl = 'https://api.fontshare.com/v2/css?f[]=general-sans@500,600,700&display=swap';
  
  https.get(cssUrl, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const urls = [...data.matchAll(/url\(['"]?(.*?)['"]?\)/g)].map(m => m[1]);
      urls.forEach((url, i) => {
        const absoluteUrl = url.startsWith('//') ? 'https:' + url : url;
        const ext = path.extname(absoluteUrl).split('?')[0] || '.woff2';
        const file = fs.createWriteStream(path.join(fontsDir, `GeneralSans-${i}${ext}`));
        https.get(absoluteUrl, (res2) => {
          res2.pipe(file);
          file.on('finish', () => {
            file.close();
            console.log(`Downloaded ${url}`);
          });
        });
      });
      fs.writeFileSync(path.join(fontsDir, 'fonts.css'), data.replace(/https:\/\/cdn.fontshare.com\/[^)]+\//g, './'));
    });
  });
}

downloadFont();
