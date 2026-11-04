(() => {
// Keep secondary information available without crowding the mobile game cards.
const mobileCatalog = matchMedia('(max-width: 700px)');
const isLatvian = document.documentElement.lang === 'lv';
const cardDetails = [...document.querySelectorAll('.home-catalog .catalog-game, .catalog-unified .unified-card')].map(card => {
 const home = card.closest('.home-catalog');
 const nodes = [...card.querySelectorAll('.rg-topics, .access-note, .research-origin')];
 const details = document.createElement('details');
 details.className = 'mobile-card-details';
 const summary = document.createElement('summary');
 summary.textContent = isLatvian ? (home ? 'Tēmas un informācija' : 'Tēmas un pētījums') : (home ? 'Topics and information' : 'Topics and research');
 details.append(summary);
 const body = document.createElement('div');
 body.className = 'mobile-card-details-body';
 details.append(body);
 const positions = nodes.map(node => {
  const marker = document.createComment('catalog information position');
  node.before(marker);
  return {node, marker};
 });
 return {card, home, details, body, positions};
});
function updateCatalogDetails() {
 for (const {card, home, details, body, positions} of cardDetails) {
  if (mobileCatalog.matches) {
   for (const {node} of positions) body.append(node);
   (home ? card.querySelector('.catalog-row') : card).append(details);
  } else {
   for (const {node, marker} of positions) marker.after(node);
   details.remove();
  }
 }
}
updateCatalogDetails();
mobileCatalog.addEventListener('change', updateCatalogDetails);

})();
