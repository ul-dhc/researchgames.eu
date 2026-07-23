(() => {
  const section = document.querySelector('#constellation');
  const svg = document.querySelector('#research-network');
  const card = document.querySelector('#network-card');
  const closeButton = document.querySelector('#network-card-close');
  const pinButton = document.querySelector('#network-card-pin');
  const zoomInButton = document.querySelector('#network-zoom-in');
  const zoomOutButton = document.querySelector('#network-zoom-out');
  const resetButton = document.querySelector('#network-reset');
  const introHint = section?.querySelector('.network-intro span');
  const ideas = window.RESEARCH_GAME_IDEAS || [];
  const NS = 'http://www.w3.org/2000/svg';
  if (!section || !svg || !card || !ideas.length) return;
  const defaultHint = introHint?.textContent || '';
  const setHint = value => { if (introHint) introHint.textContent = value; };
  svg.setAttribute('viewBox', '0 0 1000 700');

  const disciplines = {
    humanities: { label: 'Humanities', collection: 'Human Worlds', color: '#f0a044', terms: ['Language','Memory','History','Archives','Culture','Stories','Heritage'] },
    social: { label: 'Social sciences', collection: 'Society in Motion', color: '#d64fce', terms: ['Society','Cities','Inequality','Migration','Democracy','Work','Community'] },
    natural: { label: 'Natural sciences', collection: 'Planet and Matter', color: '#3984ff', terms: ['Climate','Nature','Oceans','Matter','Energy','Mathematics','Space'] },
    life: { label: 'Life sciences', collection: 'Living Systems', color: '#4ed79d', terms: ['DNA','Proteins','Cells','Microbes','Brain','Evolution','Ecology'] },
    engineering: { label: 'Engineering and technology', collection: 'Designed Futures', color: '#8b66ff', terms: ['AI','Robotics','Networks','Materials','Design','Sensors','Infrastructure'] }
  };
  const disciplineOrder = Object.keys(disciplines);
  const centers = [[13,35],[31,65],[50,34],[69,65],[87,35]];
  const grouped = Object.fromEntries(disciplineOrder.map(key => [key, []]));
  const digitalHumanitiesIdea = ideas.find(idea => idea.name === 'Hidden Archives: Lab');
  if (digitalHumanitiesIdea) {
    digitalHumanitiesIdea.name = 'AI Archive Detective';
    digitalHumanitiesIdea.description = 'Use AI-assisted pattern recognition to trace people, places and recurring motifs across a cultural archive. Adjust the model and compare what it reveals or overlooks.';
  }
  const livonianIdea = ideas.find(idea => idea.name === 'Vanishing Languages: Lab');
  if (livonianIdea) {
    Object.assign(livonianIdea, {
      name: 'Livonian Place Names',
      description: 'Match Livonian and Latvian place names, reveal their locations on the map, and explore how language, landscape and cultural memory connect.',
      displayMechanic: 'Matching and mapping',
      status: 'Playable now',
      url: 'https://ul-dhc.github.io/libiesu-vietvardu-spele'
    });
  }
  const dnaIdea = ideas.find(idea => idea.name === 'Protein Fold: Lab');
  if (dnaIdea) {
    Object.assign(dnaIdea, {
      name: 'DNA Gatekeeper',
      description: 'Manipulate proteins, DNA and antibiotic molecules to discover how bacterial DNA is untangled and how resistance can emerge.',
      displayMechanic: 'Molecular puzzle',
      status: 'In progress'
    });
  }
  ideas.forEach(idea => grouped[idea.discipline]?.push(idea));

  const points = [];
  disciplineOrder.forEach((discipline, groupIndex) => {
    grouped[discipline].forEach((idea, localIndex) => {
      const angle = (localIndex * 137.508 + groupIndex * 19) * Math.PI / 180;
      const radius = 2.3 + Math.sqrt(localIndex) * 2.62;
      points.push({
        idea, groupIndex, localIndex,
        x: centers[groupIndex][0] + Math.cos(angle) * radius * 1.08,
        y: centers[groupIndex][1] + Math.sin(angle) * radius * .86
      });
    });
  });

  const terms = [];
  disciplineOrder.forEach((discipline, groupIndex) => {
    disciplines[discipline].terms.forEach((name, index) => {
      const angle = (index * 360 / 7 - 90 + groupIndex * 9) * Math.PI / 180;
      terms.push({
        name, discipline, groupIndex,
        x: centers[groupIndex][0] + Math.cos(angle) * 9.7,
        y: centers[groupIndex][1] + Math.sin(angle) * 8.2
      });
    });
  });
  const sharedTerms = [
    { name: 'Evidence', x: 43, y: 48 },
    { name: 'Systems', x: 50, y: 54 },
    { name: 'Reconstruction', x: 57, y: 48 }
  ];
  sharedTerms.forEach(term => terms.push({ ...term, discipline: 'shared', groupIndex: -1 }));

  const camera = document.createElementNS(NS, 'g');
  camera.classList.add('network-camera');
  const drift = document.createElementNS(NS, 'g');
  drift.classList.add('network-drift');
  const lines = document.createElementNS(NS, 'g');
  lines.classList.add('network-lines');
  const termLayer = document.createElementNS(NS, 'g');
  termLayer.classList.add('network-terms');
  const dots = document.createElementNS(NS, 'g');
  dots.classList.add('network-points');
  drift.append(lines, termLayer, dots);
  camera.append(drift);
  svg.append(camera);
  let scale = 1;
  let panX = 0;
  let panY = 0;
  let dragging = false;
  let wasDragged = false;
  let dragStart = null;
  let draggedNode = null;
  let cardDragging = false;
  let cardPinned = false;
  let cardPointer = null;
  let cardDragStart = null;
  const pinnedCards = new Map();

  const updateCamera = () => camera.setAttribute('transform', `translate(${panX} ${panY}) scale(${scale})`);
  const zoomAt = (nextScale, centerX = 500, centerY = 350) => {
    const bounded = Math.min(2.7, Math.max(.65, nextScale));
    panX = centerX - (centerX - panX) * bounded / scale;
    panY = centerY - (centerY - panY) * bounded / scale;
    scale = bounded;
    updateCamera();
    closeCard();
  };

  const linked = new Set();
  const drawLine = (x1, y1, x2, y2, className, data = {}) => {
    const line = document.createElementNS(NS, 'line');
    line.setAttribute('x1', x1 * 10); line.setAttribute('y1', y1 * 7);
    line.setAttribute('x2', x2 * 10); line.setAttribute('y2', y2 * 7);
    line.classList.add(className);
    Object.entries(data).forEach(([key, value]) => { line.dataset[key] = value; });
    lines.append(line);
    return line;
  };
  const connectIdeas = (a, b, crossDiscipline = false) => {
    const key = a < b ? `${a}-${b}` : `${b}-${a}`;
    if (linked.has(key) || a === b) return;
    linked.add(key);
    const line = drawLine(points[a].x, points[a].y, points[b].x, points[b].y, 'idea-connection', { a, b });
    line.style.setProperty('--line', disciplines[points[a].idea.discipline].color);
    if (crossDiscipline) line.classList.add('cross-discipline');
  };

  points.forEach((point, index) => {
    const distances = points.map((candidate, candidateIndex) => ({
      candidateIndex,
      sameGroup: candidate.groupIndex === point.groupIndex,
      distance: Math.hypot(candidate.x - point.x, candidate.y - point.y)
    })).filter(candidate => candidate.candidateIndex !== index).sort((a, b) => a.distance - b.distance);
    distances.filter(candidate => candidate.sameGroup).slice(0, 2).forEach(candidate => connectIdeas(index, candidate.candidateIndex));
    if (index % 9 === 0) {
      const neighbour = distances.find(candidate => !candidate.sameGroup);
      if (neighbour) connectIdeas(index, neighbour.candidateIndex, true);
    }

    const disciplineTermIndex = point.groupIndex * 7 + point.localIndex % 7;
    const mechanicTermIndex = 35 + ['Evidence Trail','Systems Lab','Reconstruction'].indexOf(point.idea.mechanic);
    point.termIndexes = [disciplineTermIndex, mechanicTermIndex];
    if (point.idea.name === 'AI Archive Detective') point.termIndexes.push(28);
    if (point.idea.name === 'Livonian Place Names' && !point.termIndexes.includes(0)) point.termIndexes.push(0);
    if (point.idea.name === 'DNA Gatekeeper') [21,22].forEach(termIndex => { if (!point.termIndexes.includes(termIndex)) point.termIndexes.push(termIndex); });
    point.termIndexes.forEach(termIndex => {
      const term = terms[termIndex];
      const line = drawLine(point.x, point.y, term.x, term.y, 'term-connection', { idea: index, term: termIndex });
      line.style.setProperty('--line', disciplines[point.idea.discipline].color);
    });
  });

  [[2,24],[4,34],[7,28],[13,25],[17,33],[20,30],[23,31],[26,36],[29,37],[32,19]].forEach(([a,b]) => {
    drawLine(terms[a].x, terms[a].y, terms[b].x, terms[b].y, 'term-bridge', { termA: a, termB: b });
  });

  terms.forEach((term, index) => {
    const group = document.createElementNS(NS, 'g');
    group.classList.add('term-group');
    group.dataset.term = index;
    const color = term.discipline === 'shared' ? '#b9b3d4' : disciplines[term.discipline].color;
    const circle = document.createElementNS(NS, 'circle');
    circle.classList.add('term-node');
    circle.setAttribute('cx', term.x * 10); circle.setAttribute('cy', term.y * 7); circle.setAttribute('r', term.discipline === 'shared' ? '5.2' : '4.7');
    circle.setAttribute('fill', '#080b15'); circle.setAttribute('stroke', color); circle.style.setProperty('--dot', color);
    const label = document.createElementNS(NS, 'text');
    label.setAttribute('x', term.x * 10); label.setAttribute('y', term.y * 7);
    label.setAttribute('dx', '8'); label.setAttribute('dy', '-7');
    label.textContent = term.name;
    group.append(circle, label);
    term.group = group; term.circle = circle; term.label = label;
    group.setAttribute('tabindex', '0'); group.setAttribute('role', 'button');
    group.setAttribute('aria-label', `${term.name}, research theme`);
    const revealTerm = event => { event.stopPropagation(); showTerm(index, group); };
    circle.addEventListener('click', revealTerm);
    group.addEventListener('click', revealTerm);
    group.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); showTerm(index, group); }
    });
    termLayer.append(group);
  });

  points.forEach((point, index) => {
    const idea = point.idea;
    const discipline = disciplines[idea.discipline];
    const circle = document.createElementNS(NS, 'circle');
    circle.classList.add('idea-node');
    if (idea.status === 'Playable now') circle.classList.add('game-playable');
    if (idea.status === 'In progress') circle.classList.add('game-progress');
    circle.setAttribute('cx', point.x * 10); circle.setAttribute('cy', point.y * 7); circle.setAttribute('r', '2.65');
    circle.setAttribute('fill', discipline.color); circle.style.setProperty('--dot', discipline.color);
    circle.dataset.index = index; circle.setAttribute('tabindex', '0'); circle.setAttribute('role', 'button');
    circle.setAttribute('aria-label', `${idea.name}, ${discipline.label}, ${idea.status || idea.displayMechanic || idea.mechanic}`);
    const open = event => { event.stopPropagation(); showPoint(index, circle); };
    circle.addEventListener('click', open);
    circle.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(event); }
    });
    const label = document.createElementNS(NS, 'text');
    label.classList.add('idea-label');
    label.setAttribute('x', point.x * 10); label.setAttribute('y', point.y * 7);
    label.setAttribute('dx', '7'); label.setAttribute('dy', '-7');
    const shortTitle = idea.name.length > 30 ? `${idea.name.slice(0, 28).trim()}…` : idea.name;
    label.textContent = `${shortTitle}  ↗`;
    label.setAttribute('role', 'button');
    label.setAttribute('tabindex', '-1');
    label.setAttribute('aria-hidden', 'true');
    label.setAttribute('aria-label', `Open full game idea: ${idea.name}`);
    label.addEventListener('click', event => { event.stopPropagation(); showPoint(index, circle); });
    label.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopPropagation(); showPoint(index, circle); }
    });
    point.label = label;
    point.element = circle;
    dots.append(circle, label);
  });

  points.forEach((point, index) => Object.assign(point, { x: point.x * 10, y: point.y * 7, homeX: point.x * 10, homeY: point.y * 7, vx: Math.sin(index * 2.17) * .17, vy: Math.cos(index * 1.73) * .17, phase: index * .73, pinned: false }));
  terms.forEach((term, index) => Object.assign(term, { x: term.x * 10, y: term.y * 7, homeX: term.x * 10, homeY: term.y * 7, vx: Math.cos(index * 1.41) * .13, vy: Math.sin(index * 1.91) * .13, phase: index * .91 + 2, pinned: false }));
  const physicsNodes = [...points, ...terms];
  const physicsEdges = [...svg.querySelectorAll('line')].map(line => {
    let source, target;
    if (line.dataset.a !== undefined) { source = points[+line.dataset.a]; target = points[+line.dataset.b]; }
    else if (line.dataset.idea !== undefined) { source = points[+line.dataset.idea]; target = terms[+line.dataset.term]; }
    else { source = terms[+line.dataset.termA]; target = terms[+line.dataset.termB]; }
    return { line, source, target, rest: Math.hypot(target.x - source.x, target.y - source.y) * 1.1 };
  });
  let selectedPointIndex = null;
  let animationFrame = 0;
  let lastPhysicsFrame = 0;

  const updateGraph = () => {
    points.forEach(point => {
      point.element.setAttribute('cx', point.x); point.element.setAttribute('cy', point.y);
      point.label.setAttribute('x', point.x); point.label.setAttribute('y', point.y);
    });
    terms.forEach(term => {
      term.circle.setAttribute('cx', term.x); term.circle.setAttribute('cy', term.y);
      term.label.setAttribute('x', term.x); term.label.setAttribute('y', term.y);
    });
    physicsEdges.forEach(edge => {
      edge.line.setAttribute('x1', edge.source.x); edge.line.setAttribute('y1', edge.source.y);
      edge.line.setAttribute('x2', edge.target.x); edge.line.setAttribute('y2', edge.target.y);
    });
  };

  const simulate = time => {
    if (time - lastPhysicsFrame < 32) { requestAnimationFrame(simulate); return; }
    lastPhysicsFrame = time;
    physicsEdges.forEach(edge => {
      const dx = edge.target.x - edge.source.x;
      const dy = edge.target.y - edge.source.y;
      const distance = Math.max(1, Math.hypot(dx, dy));
      const force = (distance - edge.rest) * .00012;
      const fx = dx / distance * force;
      const fy = dy / distance * force;
      if (!edge.source.pinned) { edge.source.vx += fx; edge.source.vy += fy; }
      if (!edge.target.pinned) { edge.target.vx -= fx; edge.target.vy -= fy; }
    });
    for (let a = 0; a < physicsNodes.length; a++) {
      const node = physicsNodes[a];
      if (node.pinned) continue;
      node.vx += Math.sin(time * .00108 + node.phase) * .0062 + (node.homeX - node.x) * .000002;
      node.vy += Math.cos(time * .00086 + node.phase) * .0062 + (node.homeY - node.y) * .000002;
      for (let b = a + 1; b < physicsNodes.length; b++) {
        const other = physicsNodes[b];
        const dx = other.x - node.x;
        const dy = other.y - node.y;
        const distance = Math.max(1, Math.hypot(dx, dy));
        if (distance < 24) {
          const push = (24 - distance) * .00072;
          node.vx -= dx / distance * push; node.vy -= dy / distance * push;
          if (!other.pinned) { other.vx += dx / distance * push; other.vy += dy / distance * push; }
        }
      }
      node.vx = Math.max(-.92, Math.min(.92, node.vx * .995));
      node.vy = Math.max(-.92, Math.min(.92, node.vy * .995));
      node.x += node.vx; node.y += node.vy;
    }
    updateGraph();
    if (selectedPointIndex !== null && animationFrame++ % 3 === 0) positionCard(points[selectedPointIndex].element);
    requestAnimationFrame(simulate);
  };
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) requestAnimationFrame(simulate);

  function positionCard(circle) {
    if (cardPinned) return;
    const pointRect = circle.getBoundingClientRect();
    const sectionRect = section.getBoundingClientRect();
    const screenX = pointRect.left - sectionRect.left + pointRect.width / 2;
    const rawScreenY = pointRect.top - sectionRect.top + pointRect.height / 2;
    const halfCardHeight = Math.max(120, card.offsetHeight / 2);
    const screenY = Math.max(halfCardHeight + 14, Math.min(sectionRect.height - halfCardHeight - 14, rawScreenY));
    card.style.setProperty('--card-x', `${screenX}px`); card.style.setProperty('--card-y', `${screenY}px`);
    card.classList.toggle('card-left', screenX > sectionRect.width * .62);
  }

  function highlightedIndexes(activeIndex = selectedPointIndex) {
    const indexes = new Set(pinnedCards.keys());
    if (activeIndex !== null) indexes.add(activeIndex);
    return indexes;
  }

  function applyProjectHighlights(activeIndex = selectedPointIndex) {
    const indexes = highlightedIndexes(activeIndex);
    const neighbours = new Set();
    const relatedTerms = new Set();
    indexes.forEach(index => {
      points[index].termIndexes.forEach(termIndex => relatedTerms.add(termIndex));
      svg.querySelectorAll('.idea-connection').forEach(line => {
        if (+line.dataset.a === index) neighbours.add(+line.dataset.b);
        if (+line.dataset.b === index) neighbours.add(+line.dataset.a);
      });
    });
    svg.querySelectorAll('.idea-node').forEach((dot, index) => {
      dot.classList.toggle('selected', indexes.has(index));
      dot.classList.toggle('network-neighbour', !indexes.has(index) && neighbours.has(index));
    });
    svg.querySelectorAll('line').forEach(line => line.classList.toggle('connected', [...indexes].some(index =>
      +line.dataset.a === index || +line.dataset.b === index || +line.dataset.idea === index
    )));
    svg.querySelectorAll('.term-group').forEach(group => group.classList.toggle('related', relatedTerms.has(+group.dataset.term)));
    section.classList.toggle('has-open-card', indexes.size > 0);
  }

  function populateCard(target, index) {
    const point = points[index];
    const idea = point.idea;
    const discipline = disciplines[idea.discipline];
    target.querySelector('.network-card-field').textContent = discipline.label;
    target.querySelector('.network-card-field').style.color = discipline.color;
    target.querySelector('h3').textContent = idea.name;
    target.querySelector('.network-card-description').textContent = idea.description;
    target.querySelector('.network-card-collection').textContent = discipline.collection;
    target.querySelector('.network-card-tag').textContent = `#${terms[point.termIndexes[0]].name.replace(/\s+/g, '')}`;
    target.querySelector('.network-card-availability').textContent = idea.status || 'Future game idea';
    target.querySelector('.network-card-availability').className = `network-card-availability ${idea.status === 'Playable now' ? 'is-playable' : idea.status === 'In progress' ? 'is-progress' : ''}`;
    target.querySelector('.network-card-status').textContent = idea.displayMechanic || idea.mechanic;
    const action = target.querySelector('.network-card-action');
    action.hidden = !idea.url;
    if (idea.url) { action.href = idea.url; action.setAttribute('aria-label', `Play ${idea.name}`); }
    target.style.setProperty('--idea-color', discipline.color);
  }

  function showPoint(index, circle) {
    const point = points[index];
    const idea = point.idea;
    const existingNote = pinnedCards.get(index);
    if (existingNote) {
      existingNote.classList.remove('note-attention');
      requestAnimationFrame(() => existingNote.classList.add('note-attention'));
      applyProjectHighlights();
      return;
    }
    cardPinned = false;
    card.classList.remove('card-dragged','card-dragging');
    section.classList.remove('has-term-selection');
    svg.querySelectorAll('.idea-label.visible').forEach(element => { element.classList.remove('visible'); element.setAttribute('tabindex', '-1'); element.setAttribute('aria-hidden', 'true'); });
    populateCard(card, index);
    selectedPointIndex = index;
    applyProjectHighlights(index);
    card.hidden = false;
    positionCard(circle);
    setHint(`${idea.name} connects through ${point.termIndexes.map(termIndex => terms[termIndex].name).join(' and ')}.`);
  }

  function showTerm(index, group) {
    closeCard();
    const pinnedIndexes = new Set(pinnedCards.keys());
    const pinnedTerms = new Set();
    pinnedIndexes.forEach(pointIndex => points[pointIndex].termIndexes.forEach(termIndex => pinnedTerms.add(termIndex)));
    const allConnected = points.map((point, pointIndex) => ({ point, pointIndex })).filter(item => item.point.termIndexes.includes(index));
    const byDiscipline = new Map(disciplineOrder.map(key => [key, []]));
    allConnected.forEach(item => byDiscipline.get(item.point.idea.discipline).push(item.pointIndex));
    const focused = [];
    while (focused.length < Math.min(10, allConnected.length)) {
      let added = false;
      disciplineOrder.forEach(key => {
        const bucket = byDiscipline.get(key);
        if (bucket.length && focused.length < 10) { focused.push(bucket.shift()); added = true; }
      });
      if (!added) break;
    }
    const connectedIdeas = new Set(focused);
    svg.querySelectorAll('.term-group').forEach(termGroup => termGroup.classList.toggle('related', termGroup === group || pinnedTerms.has(+termGroup.dataset.term)));
    svg.querySelectorAll('.idea-node').forEach((dot, pointIndex) => {
      dot.classList.toggle('selected', pinnedIndexes.has(pointIndex));
      dot.classList.toggle('network-neighbour', !pinnedIndexes.has(pointIndex) && connectedIdeas.has(pointIndex));
    });
    points.forEach((point, pointIndex) => {
      const visible = connectedIdeas.has(pointIndex);
      point.label.classList.toggle('visible', visible);
      point.label.setAttribute('tabindex', visible ? '0' : '-1');
      point.label.setAttribute('aria-hidden', visible ? 'false' : 'true');
    });
    svg.querySelectorAll('line').forEach(line => line.classList.toggle('connected',
      (+line.dataset.term === index && connectedIdeas.has(+line.dataset.idea)) || +line.dataset.termA === index || +line.dataset.termB === index ||
      [...pinnedIndexes].some(pointIndex => +line.dataset.a === pointIndex || +line.dataset.b === pointIndex || +line.dataset.idea === pointIndex)
    ));
    setHint(allConnected.length > focused.length
      ? `${terms[index].name} connects many ideas. Showing ${focused.length}; select a game title ↗ to open the full idea.`
      : `${terms[index].name} connects ${focused.length} possible games. Select a game title ↗ to open the full idea.`);
    section.classList.add('has-term-selection');
  }

  function closeCard() {
    cardDragging = false;
    cardPinned = false;
    cardPointer = null;
    card.classList.remove('card-dragged','card-dragging');
    card.hidden = true;
    selectedPointIndex = null;
    section.classList.remove('has-term-selection');
    svg.querySelectorAll('.selected,.connected,.related').forEach(element => element.classList.remove('selected','connected','related'));
    svg.querySelectorAll('.network-neighbour').forEach(element => element.classList.remove('network-neighbour'));
    svg.querySelectorAll('.idea-label.visible').forEach(element => { element.classList.remove('visible'); element.setAttribute('tabindex', '-1'); element.setAttribute('aria-hidden', 'true'); });
    applyProjectHighlights(null);
    setHint(defaultHint);
  }
  closeButton.addEventListener('click', closeCard);

  let noteLayer = 10;
  function enablePinnedNote(note, index) {
    let moving = false;
    let pointer = null;
    let start = null;
    const noteClose = note.querySelector('.network-card-close');
    const notePin = note.querySelector('.network-card-pin');
    noteClose.removeAttribute('id');
    notePin.removeAttribute('id');
    notePin.classList.add('is-pinned');
    notePin.setAttribute('aria-pressed', 'true');
    notePin.setAttribute('aria-label', `${points[index].idea.name} is pinned to the board`);
    notePin.disabled = true;
    noteClose.setAttribute('aria-label', `Remove ${points[index].idea.name} from the board`);
    noteClose.addEventListener('click', event => {
      event.stopPropagation();
      note.remove();
      pinnedCards.delete(index);
      applyProjectHighlights();
    });
    note.addEventListener('pointerdown', event => {
      const handle = event.target.closest?.('.network-card-field, .network-card h3');
      if (!handle || event.target.closest('button,a') || window.innerWidth <= 700) return;
      event.preventDefault();
      event.stopPropagation();
      const noteRect = note.getBoundingClientRect();
      const sectionRect = section.getBoundingClientRect();
      moving = true;
      pointer = event.pointerId;
      start = { pointerX:event.clientX, pointerY:event.clientY, left:noteRect.left - sectionRect.left, top:noteRect.top - sectionRect.top };
      note.style.zIndex = `${++noteLayer}`;
      note.classList.add('card-dragging');
      note.setPointerCapture(pointer);
    });
    note.addEventListener('pointermove', event => {
      if (!moving || event.pointerId !== pointer) return;
      const sectionRect = section.getBoundingClientRect();
      const noteRect = note.getBoundingClientRect();
      const left = Math.max(12, Math.min(sectionRect.width - noteRect.width - 12, start.left + event.clientX - start.pointerX));
      const top = Math.max(12, Math.min(sectionRect.height - noteRect.height - 12, start.top + event.clientY - start.pointerY));
      note.style.setProperty('--card-x', `${left}px`);
      note.style.setProperty('--card-y', `${top}px`);
    });
    const stop = event => {
      if (!moving || (event?.pointerId != null && event.pointerId !== pointer)) return;
      moving = false;
      note.classList.remove('card-dragging');
      if (pointer != null && note.hasPointerCapture(pointer)) note.releasePointerCapture(pointer);
      pointer = null;
    };
    note.addEventListener('pointerup', stop);
    note.addEventListener('pointercancel', stop);
    note.addEventListener('lostpointercapture', () => stop());
  }

  function pinCurrentCard() {
    if (selectedPointIndex === null || pinnedCards.has(selectedPointIndex)) return;
    const index = selectedPointIndex;
    if (!card.classList.contains('card-dragged')) {
      const cardRect = card.getBoundingClientRect();
      const sectionRect = section.getBoundingClientRect();
      card.classList.remove('card-left');
      card.classList.add('card-dragged');
      card.style.setProperty('--card-x', `${cardRect.left - sectionRect.left}px`);
      card.style.setProperty('--card-y', `${cardRect.top - sectionRect.top}px`);
    }
    const note = card.cloneNode(true);
    note.removeAttribute('id');
    note.removeAttribute('aria-live');
    note.hidden = false;
    note.dataset.pointIndex = index;
    note.classList.remove('card-dragging','card-left');
    note.classList.add('card-dragged','pinned-note');
    note.style.setProperty('--note-tilt', `${index % 2 ? 1.15 : -.9}deg`);
    note.style.zIndex = `${++noteLayer}`;
    section.append(note);
    pinnedCards.set(index, note);
    enablePinnedNote(note, index);
    card.hidden = true;
    card.classList.remove('card-dragged','card-dragging');
    selectedPointIndex = null;
    cardPinned = false;
    applyProjectHighlights(null);
  }

  function clearPinnedCards() {
    pinnedCards.forEach(note => note.remove());
    pinnedCards.clear();
  }

  pinButton.addEventListener('click', event => {
    event.stopPropagation();
    pinCurrentCard();
  });

  card.addEventListener('pointerdown', event => {
    const handle = event.target.closest?.('.network-card-field, .network-card h3');
    if (!handle || event.target.closest('button,a') || window.innerWidth <= 700) return;
    event.preventDefault();
    event.stopPropagation();
    const cardRect = card.getBoundingClientRect();
    const sectionRect = section.getBoundingClientRect();
    cardDragging = true;
    cardPinned = true;
    cardPointer = event.pointerId;
    cardDragStart = {
      pointerX:event.clientX,
      pointerY:event.clientY,
      left:cardRect.left - sectionRect.left,
      top:cardRect.top - sectionRect.top
    };
    card.classList.remove('card-left');
    card.classList.add('card-dragged','card-dragging');
    card.style.setProperty('--card-x', `${cardDragStart.left}px`);
    card.style.setProperty('--card-y', `${cardDragStart.top}px`);
    card.setPointerCapture(event.pointerId);
  });

  card.addEventListener('pointermove', event => {
    if (!cardDragging || event.pointerId !== cardPointer) return;
    const sectionRect = section.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const nextLeft = cardDragStart.left + event.clientX - cardDragStart.pointerX;
    const nextTop = cardDragStart.top + event.clientY - cardDragStart.pointerY;
    const left = Math.max(12, Math.min(sectionRect.width - cardRect.width - 12, nextLeft));
    const top = Math.max(12, Math.min(sectionRect.height - cardRect.height - 12, nextTop));
    card.style.setProperty('--card-x', `${left}px`);
    card.style.setProperty('--card-y', `${top}px`);
  });

  const finishCardDrag = event => {
    if (!cardDragging || (event?.pointerId != null && event.pointerId !== cardPointer)) return;
    cardDragging = false;
    card.classList.remove('card-dragging');
    if (cardPointer != null && card.hasPointerCapture(cardPointer)) card.releasePointerCapture(cardPointer);
    cardPointer = null;
    pinCurrentCard();
  };
  card.addEventListener('pointerup', finishCardDrag);
  card.addEventListener('pointercancel', finishCardDrag);
  card.addEventListener('lostpointercapture', () => finishCardDrag());

  document.addEventListener('click', event => {
    if (!card.contains(event.target) && event.target.tagName.toLowerCase() !== 'circle') closeCard();
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeCard(); });

  function pinnedIndexesForElement(element) {
    const indexes = new Set();
    const line = element.closest?.('line.connected');
    const ideaNode = element.closest?.('.idea-node.selected');
    const termGroup = element.closest?.('.term-group.related');
    if (line) {
      [line.dataset.idea, line.dataset.a, line.dataset.b].forEach(value => {
        if (value !== undefined && pinnedCards.has(+value)) indexes.add(+value);
      });
    }
    if (ideaNode && pinnedCards.has(+ideaNode.dataset.index)) indexes.add(+ideaNode.dataset.index);
    if (termGroup) {
      const termIndex = +termGroup.dataset.term;
      pinnedCards.forEach((note, pointIndex) => {
        if (points[pointIndex].termIndexes.includes(termIndex)) indexes.add(pointIndex);
      });
    }
    return indexes;
  }

  function focusPinnedThreads(indexes) {
    svg.querySelectorAll('.thread-focus').forEach(element => element.classList.remove('thread-focus'));
    pinnedCards.forEach(note => note.classList.remove('connection-focus'));
    if (!indexes.size) return;
    indexes.forEach(index => {
      pinnedCards.get(index)?.classList.add('connection-focus');
      points[index].element.classList.add('thread-focus');
      points[index].termIndexes.forEach(termIndex => terms[termIndex].group.classList.add('thread-focus'));
      svg.querySelectorAll('line').forEach(line => {
        if (+line.dataset.a === index || +line.dataset.b === index || +line.dataset.idea === index) line.classList.add('thread-focus');
      });
    });
  }

  const handleThreadEnter = event => focusPinnedThreads(pinnedIndexesForElement(event.target));
  const handleThreadLeave = event => {
    if (!event.relatedTarget?.closest?.('#research-network')) focusPinnedThreads(new Set());
    else focusPinnedThreads(pinnedIndexesForElement(event.relatedTarget));
  };
  svg.addEventListener('pointerover', handleThreadEnter);
  svg.addEventListener('pointerout', handleThreadLeave);
  svg.addEventListener('mouseover', handleThreadEnter);
  svg.addEventListener('mouseout', handleThreadLeave);

  svg.addEventListener('wheel', event => {
    // Keep ordinary wheel and trackpad gestures available for page navigation.
    // Network zoom is deliberately opt-in so this large canvas never traps the page.
    if (!event.altKey) return;
    event.preventDefault();
    const rect = svg.getBoundingClientRect();
    const centerX = (event.clientX - rect.left) / rect.width * 1000;
    const centerY = (event.clientY - rect.top) / rect.height * 700;
    zoomAt(scale * (event.deltaY < 0 ? 1.12 : .89), centerX, centerY);
  }, { passive: false });
  svg.addEventListener('pointerdown', event => {
    dragging = true; wasDragged = false;
    const ideaElement = event.target.closest?.('.idea-node');
    const termElement = event.target.closest?.('.term-group');
    draggedNode = ideaElement ? points[+ideaElement.dataset.index] : termElement ? terms[+termElement.dataset.term] : null;
    dragStart = { x: event.clientX, y: event.clientY, panX, panY, nodeX: draggedNode?.x, nodeY: draggedNode?.y };
    section.classList.add(draggedNode ? 'is-dragging-node' : 'is-dragging');
  });
  svg.addEventListener('pointermove', event => {
    if (!dragging) return;
    const rect = svg.getBoundingClientRect();
    const dx = (event.clientX - dragStart.x) / rect.width * 1000;
    const dy = (event.clientY - dragStart.y) / rect.height * 700;
    if (Math.abs(dx) + Math.abs(dy) > 14 && !wasDragged) {
      wasDragged = true;
      svg.setPointerCapture(event.pointerId);
    }
    if (draggedNode) {
      draggedNode.pinned = true;
      draggedNode.vx = 0; draggedNode.vy = 0;
      (draggedNode.element || draggedNode.group).classList.add('pinned-node');
      draggedNode.x = dragStart.nodeX + dx / scale;
      draggedNode.y = dragStart.nodeY + dy / scale;
      updateGraph();
    } else {
      panX = dragStart.panX + dx;
      panY = dragStart.panY + dy;
      updateCamera();
    }
  });
  const finishDrag = event => {
    if (!dragging) return;
    dragging = false;
    section.classList.remove('is-dragging');
    section.classList.remove('is-dragging-node');
    if (svg.hasPointerCapture(event.pointerId)) svg.releasePointerCapture(event.pointerId);
    if (wasDragged) closeCard();
    draggedNode = null;
    setTimeout(() => { wasDragged = false; }, 0);
  };
  svg.addEventListener('pointerup', finishDrag);
  svg.addEventListener('pointercancel', finishDrag);
  zoomInButton.addEventListener('click', event => { event.stopPropagation(); zoomAt(scale * 1.22); });
  zoomOutButton.addEventListener('click', event => { event.stopPropagation(); zoomAt(scale / 1.22); });
  resetButton.addEventListener('click', event => {
    event.stopPropagation();
    scale = 1; panX = 0; panY = 0;
    updateCamera();
    clearPinnedCards();
    closeCard();
  });
})();
