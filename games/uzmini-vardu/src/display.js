/* Display-only Latvian casing; source records and save objects stay unchanged. */
(function(root){'use strict';
function definition(value){return String(value??'').replace(/\p{L}/u,letter=>letter.toLocaleUpperCase('lv'))}
const api={definition};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.RGDisplay=api;
})(typeof globalThis==='undefined'?this:globalThis);
