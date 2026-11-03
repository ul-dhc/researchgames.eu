// Creates a portable folder: node scripts/package.mjs /absolute/output/folder
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (!process.argv[2]) throw new Error('Specify an output folder.');
const out = path.resolve(process.argv[2]);
await fs.mkdir(out, { recursive: true });
await fs.cp(path.join(root, 'assets'), path.join(out, 'assets'), { recursive: true });
const css = await fs.readFile(path.join(root,'style.css'),'utf8');
const js = await fs.readFile(path.join(root,'bundle.js'),'utf8');
let html = await fs.readFile(path.join(root,'index.html'),'utf8');
html = html.replace('<link rel="stylesheet" href="style.css">', `<style>${css}</style>`)
  .replace('<script defer src="bundle.js"></script>','')
  .replace('</body>',`<script>${js}</script>\n</body>`);
await fs.writeFile(path.join(out,'index.html'),html);
console.log(`Portable game saved to ${out}`);
