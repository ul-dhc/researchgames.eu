// Local Lucide assets, ISC license in ../lucide-LICENSE.txt.
// Settings SVG: https://github.com/lucide-icons/lucide/blob/main/icons/settings.svg
import { updateIcons as sharedIcons } from './shared-icons.js?v=bacterial-6';
const settings='<svg aria-hidden="true" focusable="false" class="lucide lucide-settings" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"/><circle cx="12" cy="12" r="3"/></svg>';
const chevrons={
 'chevron-left':'<path d="m15 18-6-6 6-6"/>',
 'chevron-right':'<path d="m9 18 6-6-6-6"/>'
};
export function updateIcons(root=document){root.querySelectorAll('[data-icon="chevron-left"],[data-icon="chevron-right"]').forEach(node=>{const name=node.dataset.icon;node.outerHTML=`<svg aria-hidden="true" focusable="false" class="lucide lucide-${name}" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${chevrons[name]}</svg>`;});root.querySelectorAll('[data-icon="settings"]').forEach(node=>node.outerHTML=settings);sharedIcons(root);}
