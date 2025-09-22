import fs from 'fs';
import path from 'path';

const DIRECTORIES = ['app', 'components', 'pages', 'public', 'styles', 'lib'];
const ALLOWED_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.json', '.css', '.html', '.md', '.svg']);
const BLOCKLIST = [/\bCabbie\b/i, /\bCabby\b/i];

function collectFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    if (entry.name === 'node_modules' || entry.name === '.next') continue;
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectFiles(fullPath));
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();
    if (ALLOWED_EXTENSIONS.has(ext)) {
      files.push(fullPath);
    }
  }

  return files;
}

describe('Brand name consistency', () => {
  it('does not contain legacy brand references', () => {
    const offenders: Array<{ file: string; match: string }> = [];

    for (const dir of DIRECTORIES) {
      const absoluteDir = path.join(process.cwd(), dir);
      if (!fs.existsSync(absoluteDir)) continue;
      const files = collectFiles(absoluteDir);

      for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        for (const pattern of BLOCKLIST) {
          const match = content.match(pattern);
          if (match) {
            offenders.push({ file: path.relative(process.cwd(), file), match: match[0] });
          }
        }
      }
    }

    expect(offenders).toEqual([]);
  });
});
