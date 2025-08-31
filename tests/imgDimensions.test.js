import fs from 'fs';
import path from 'path';
// Scan source files for raw <img> usage without width & height attributes (or style aspect-ratio)
// Allow next/image usage (handled separately) and SVG/ icon data URIs.
describe('Raw <img> elements have explicit dimensions', () => {
    const root = path.join(__dirname, '..');
    const targets = [];
    function walk(dir) {
        for (const entry of fs.readdirSync(dir)) {
            if (entry.startsWith('.next') || entry === 'node_modules')
                continue;
            const full = path.join(dir, entry);
            const stat = fs.statSync(full);
            if (stat.isDirectory())
                walk(full);
            else if (/\.(tsx|jsx|js|ts)$/.test(entry))
                targets.push(full);
        }
    }
    walk(root);
    const offenders = [];
    const imgTagRe = /<img\s+[^>]*>/gim;
    targets.forEach(file => {
        const txt = fs.readFileSync(file, 'utf8');
        const matches = txt.match(imgTagRe) || [];
        matches.forEach(tag => {
            // ignore width/height or style with aspect-ratio or data-next-image
            const hasW = /\bwidth=/.test(tag);
            const hasH = /\bheight=/.test(tag);
            const hasAR = /aspect-ratio/.test(tag);
            if (!(hasW && hasH) && !hasAR) {
                offenders.push({ file, snippet: tag.trim().slice(0, 120) });
            }
        });
    });
    test('no <img> without dimensions', () => {
        if (offenders.length) {
            const list = offenders.map(o => `- ${path.relative(root, o.file)} :: ${o.snippet}`).join('\n');
            throw new Error(`Found <img> without width/height or aspect-ratio:\n${list}`);
        }
    });
});
