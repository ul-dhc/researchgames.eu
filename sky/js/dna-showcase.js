(() => {
  const stages = {
    1: { type: 'video', kicker: 'Opening story', title: 'Enter the DNA gate', copy: 'Begin with the research story, then step inside the molecular mechanism you will investigate.' },
    2: { image: 'assets/dna-gatekeeper-journey/02-meet-molecular-cast.png', kicker: 'Orientation', title: 'Meet the molecular cast', copy: 'Meet Topo IV, DNA, moxifloxacin and the magnesium–water bridge before the investigation begins.' },
    3: { image: 'assets/dna-gatekeeper-journey/03-decode-molecular-team.png', kicker: 'Field guide', title: 'Decode the molecular team', copy: 'Read the scene and identify the job of each molecule, ion and protein in the complex.' },
    4: { image: 'assets/dna-gatekeeper-journey/04-find-cleavage-sites.png', kicker: 'Challenge 01', title: 'Find the two cleavage sites', copy: 'Scan the DNA inside the enzyme and locate the paired distortions where the strands were cut.' },
    5: { image: 'assets/dna-gatekeeper-journey/05-lock-both-moxi-wedges.png', kicker: 'Challenge 02', title: 'Lock both Moxi wedges', copy: 'Rotate and test each molecule until its flat face fits securely into one of the two DNA gaps.' },
    6: { image: 'assets/dna-gatekeeper-journey/05-connect-six-point-bridge.png', kicker: 'Challenge 03', title: 'Connect the six-point bridge', copy: 'Arrange the drug, magnesium, water molecules and protein residues into one stabilising contact path.' },
    7: { image: 'assets/dna-gatekeeper-journey/06-test-hypothesis.png', kicker: 'Challenge 04', title: 'Test the hypothesis', copy: 'Predict whether the DNA break will reseal, run the test and compare the result with your reasoning.' }
  };
  const image = document.querySelector('#dna-stage-image');
  const video = document.querySelector('#dna-stage-video');
  const panel = document.querySelector('#dna-stage-panel');
  const kicker = document.querySelector('#dna-stage-kicker');
  const title = document.querySelector('#dna-stage-title');
  const copy = document.querySelector('#dna-stage-copy');
  const counter = document.querySelector('#dna-stage-counter');
  const progress = document.querySelector('#dna-stage-progress-fill');
  const tabs = [...document.querySelectorAll('.dna-stage-tab')];

  const selectStage = tab => {
    const stageNumber = Number(tab.dataset.stage);
    const stage = stages[stageNumber];
    tabs.forEach(item => {
      const active = item === tab;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-selected', String(active));
      item.tabIndex = active ? 0 : -1;
    });
    panel.setAttribute('aria-labelledby', tab.id);
    panel.classList.add('is-changing');
    video.pause();
    window.setTimeout(() => {
      const isVideo = stage.type === 'video';
      video.hidden = !isVideo;
      image.hidden = isVideo;
      if (isVideo) {
        video.currentTime = 0;
        video.play().catch(() => {});
      }
      if (!isVideo) {
        image.src = stage.image;
        image.alt = `${stage.title} game screen`;
      }
      kicker.textContent = stage.kicker;
      title.textContent = stage.title;
      copy.textContent = stage.copy;
      counter.textContent = `${String(stageNumber).padStart(2, '0')} / 07`;
      progress.style.width = `${(stageNumber / 7) * 100}%`;
      panel.classList.remove('is-changing');
    }, 150);
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectStage(tab));
    tab.addEventListener('keydown', event => {
      if (!['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      let next = index;
      if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else next = (index + (['ArrowDown', 'ArrowRight'].includes(event.key) ? 1 : -1) + tabs.length) % tabs.length;
      tabs[next].focus();
      selectStage(tabs[next]);
    });
  });
})();
