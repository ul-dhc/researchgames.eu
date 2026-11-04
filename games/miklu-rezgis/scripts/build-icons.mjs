import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url);
export async function buildIcons({check=false}={}){
 const manifest=JSON.parse(await readFile(new URL('assets/lucide/manifest.json',root),'utf8'));
 for(const [page,{prefix,icons}] of Object.entries(manifest.pages)){
  const symbols=[];
  for(const [id,name] of Object.entries(icons)){
   const svg=await readFile(new URL(`assets/lucide/${name}.svg`,root),'utf8');
   if(createHash('sha256').update(svg).digest('hex')!==manifest.sha256[`${name}.svg`])throw new Error(`Lucide SVG changed: ${name}`);
   if(!svg.includes(`@license lucide-static v${manifest.version}`))throw new Error(`Unverified Lucide source: ${name}`);
   const body=svg.match(/<svg\b[^>]*>([\s\S]*?)<\/svg>/)?.[1].trim();
   if(!body)throw new Error(`Invalid Lucide SVG: ${name}`);
   symbols.push(`<symbol id="${prefix}${id}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n${body}\n</symbol>`);
  }
  const sprite=`<svg class="icon-sprite" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" style="position:absolute;width:0;height:0;overflow:hidden"><defs>\n${symbols.join('\n')}\n</defs></svg>`;
  const path=new URL(page,root),html=await readFile(path,'utf8');
  const pattern=/<svg\b[^>]*>\s*<defs>[\s\S]*?<\/defs>\s*<\/svg>/;
  if(!pattern.test(html))throw new Error(`Missing icon sprite in ${page}`);
  const updated=html.replace(pattern,sprite);
  if(check&&updated!==html)throw new Error(`Icons in ${page} differ from official Lucide sources; run scripts/build-icons.mjs`);
  if(!check&&updated!==html)await writeFile(path,updated);
 }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await buildIcons({check:process.argv.includes('--check')});
