// Usage: node extract.js [path/to/index.html]  -> writes hc_extracted.js (the HC block) next to this file.
// If hypercars.js is still a standalone file, pass that path instead and it is copied as-is.
const fs=require('fs'),path=require('path');
const src=process.argv[2]||path.join(__dirname,'..','index.html');
const t=fs.readFileSync(src,'utf8').replace(/\r\n/g,'\n');
const a=t.indexOf('const HC = (() => {'),endTag='return { DEFS, laferrari, chiron, jesko };\n})();';
const b=t.indexOf(endTag);
if(a<0||b<0){console.error('HC block not found in',src);process.exit(1)}
fs.writeFileSync(path.join(__dirname,'hc_extracted.js'),t.slice(a,b+endTag.length));
console.log('extracted',b+endTag.length-a,'chars');
