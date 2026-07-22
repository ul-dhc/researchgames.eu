(() => {
  const stages = {
    1: ['assets/dna-gatekeeper-showcase/02-stage-1-meet-the-gate.png', 'Meet the gate', 'Activate the enzyme cycle and see why an open, cut DNA gate is the crucial moment for intervention.'],
    2: ['assets/dna-gatekeeper-showcase/03-stage-2-find-the-gap.png', 'Find the gap', 'Inspect alternative DNA breaks and identify the four-base-pair staggered opening.'],
    3: ['assets/dna-gatekeeper-showcase/04-stage-3-wedge-it-in.png', 'Wedge it in', 'Rotate and slide moxifloxacin into the tilted four-base-pair break.'],
    4: ['assets/dna-gatekeeper-showcase/05-stage-4-bridge-the-ion.png', 'Bridge the ion', 'Position water molecules and magnesium to complete the bridge that stabilises the drug-DNA complex.'],
    5: ['assets/dna-gatekeeper-showcase/06-stage-5-diagnose-and-jam.png', 'Diagnose resistance', 'Compare the working and mutated sites, then identify the contact that resistance has broken.'],
    6: ['assets/dna-gatekeeper-showcase/07-stage-6-read-the-structure.png', 'Read the structure', 'Reconstruct the evidence chain from molecular shape to bridge contacts and resistance.']
  };
  const image = document.querySelector('#dna-stage-image');
  const kicker = document.querySelector('#dna-stage-kicker');
  const title = document.querySelector('#dna-stage-title');
  const copy = document.querySelector('#dna-stage-copy');
  document.querySelectorAll('.dna-stage-tab').forEach(tab => tab.addEventListener('click', () => {
    const stage = tab.dataset.stage;
    document.querySelectorAll('.dna-stage-tab').forEach(item => { item.classList.toggle('is-active', item === tab); item.setAttribute('aria-selected', String(item === tab)); });
    image.classList.add('is-changing');
    window.setTimeout(() => { image.src = stages[stage][0]; image.alt = `Stage ${stage}: ${stages[stage][1]}`; kicker.textContent = `Stage ${stage}`; title.textContent = stages[stage][1]; copy.textContent = stages[stage][2]; image.classList.remove('is-changing'); }, 170);
  }));
})();
