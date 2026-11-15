// Keep the partner-facing game URL on the same shared dashboard template.
import {readFile,writeFile} from 'node:fs/promises';
const source=new URL('../latgalian.html',import.meta.url);
const target=new URL('../../games/muna-teiruma/stats/index.html',import.meta.url);
const html=(await readFile(source,'utf8')).replace(/(href|src)="\.\//g,'$1="/stats/');
await writeFile(target,html);
console.log('Built /games/muna-teiruma/stats/ from the shared series dashboard.');
