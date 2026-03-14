const fs = require('fs');
const path = require('path');

const uuidFileContent = `export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch (e) { }
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
`;
fs.writeFileSync(path.join(__dirname, 'uuid.ts'), uuidFileContent);

// A helper to replace occurrences and auto-add the import.
function processFile(filePath, isComponent) {
  const ext = path.extname(filePath);
  if (!['.tsx', '.ts'].includes(ext)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('crypto.randomUUID()')) {
    content = content.replace(/crypto\.randomUUID\(\)/g, 'generateUUID()');
    const importPath = isComponent ? '../uuid' : './uuid';
    if (!content.includes('import { generateUUID }')) {
      const importStatement = `import { generateUUID } from '${importPath}';\n`;
      // Put it after the first couple of imports or at line 1
      if (content.indexOf('import') !== -1) {
         content = content.replace(/^(import.*)/m, `${importStatement}$1`);
      } else {
         content = importStatement + content;
      }
    }
    fs.writeFileSync(filePath, content);
    console.log('Updated: ' + filePath);
  }
}

const compsDir = path.join(__dirname, 'components');
const files = fs.readdirSync(compsDir);
for (const file of files) {
   processFile(path.join(compsDir, file), true);
}

processFile(path.join(__dirname, 'seeds.ts'), false);
console.log('Done!');
