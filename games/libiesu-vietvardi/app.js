(() => {
  "use strict";

  const DATA = GAME_DATA;
  const ALL_PAIRS = DATA.pairs.map((p, i) => ({ ...p, id: i }));
  const TOTAL_ROUNDS = Math.max(...ALL_PAIRS.map(p => p.round));
  const LANG = location.hash.toLowerCase() === "#en" ? "en" : "lv";
  const IS_EN = LANG === "en";
  const LS_BEST = "liv-game-best-score";
  const LS_THEME = "liv-game-theme";

  const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzZJv4C-LK3cMy-ejINa4Di-Orr37jfLYed2pxw8CnZOneu8H72wJ3okuyd72Xu07FzAg/exec";

  const POINTS_CORRECT = 10;
  const WRONG_PENALTY = 4;
  const TIME_TARGET_SECONDS = 330;
  const TIME_BONUS_PER_SECOND = 1.5;
  const TIME_BONUS_MAX = 180;
  const TIME_BONUS_MIN = -120;

  const FACTS = [
    { lv: "Lībieši ir Latvijas pamattauta un pirmiedzīvotāji. Lībiešu valoda pieder somugru valodu saimei un ir tuva igauņu valodai.", en: "The Livonians are an indigenous people of Latvia. Livonian belongs to the Finnic branch of the Uralic language family and is closely related to Estonian." },
    { lv: "Lībiešu valodai ir liela ietekme uz mūsdienu latviešu valodu, kas veidojusies lībiešu un seno baltu cilšu saskarsmē. Arī daudzi vietvārdi, kurus pazīstam šodien, nākuši no lībiešu valodas.", en: "Livonian has strongly influenced modern Latvian, which developed through contact between Livonians and ancient Baltic tribes. Many place names known today also originate in Livonian." },
    { lv: "Latviešu valodā ir daudz lībiešu izcelsmes vārdu, piemēram: allaž, jauda, kāzas, kukainis, ķīla, laulāt, loms, muiža, pīlādzis, puisis, puķe, selga, sēne, suga, sulainis, vai, vajag, vimba.", en: "Latvian contains many words of Livonian origin, including: allaž, jauda, kāzas, kukainis, ķīla, laulāt, loms, muiža, pīlādzis, puisis, puķe, selga, sēne, suga, sulainis, vai, vajag and vimba." },
    { lv: "Lībiešu un latviešu valodas ilgajā mijiedarbībā latviešu valoda no lībiešu valodas ir pārņēmusi daudzus vārdus, gramatikas formas un izrunas īpatnības. Arī uzsvars uz pirmās zilbes latviešu valodā aizgūts no lībiešu valodas.", en: "Through the long interaction between Livonian and Latvian, Latvian has adopted many words, grammatical forms and pronunciation features from Livonian. Latvian first-syllable stress was also borrowed from Livonian." },
    {
      lv: "Vienīgā zinātniskā iestāde Latvijā un pasaulē, kuras darbības centrā ir lībiešu valodas un kultūras pētniecība, ir LU Lībiešu institūts.",
      en: "The University of Latvia Livonian Institute is the only research institution in Latvia and worldwide focused specifically on the study of Livonian language and culture.",
      linkTextLv: "Uzzināt vairāk ↗", linkTextEn: "Learn more ↗", linkUrl: "https://www.livonian.lv"
    }
  ];
  const ROUND_TITLES = IS_EN
    ? ["Great!", "Keep going!", "Excellent!", "Almost there…", "You did it!"]
    : ["Lieliski!", "Turpini tāpat!", "Izcili!", "Palicis vēl tikai nedaudz…", "Tev izdevās!"];

  const UI = {
    exitConfirm: IS_EN ? "Are you sure you want to stop the game and return to the start? Your progress will be lost." : "Vai tiešām vēlies pārtraukt spēli un atgriezties sākumā? Tavs veikums tiks pazaudēts.",
    correct: IS_EN ? "Correct!" : "Pareizi!",
    wrong: IS_EN ? "Not quite — try again" : "Nav pareizi – mēģini vēlreiz",
    round: n => IS_EN ? `Round ${n} of ${TOTAL_ROUNDS}` : `${n}. kārta no ${TOTAL_ROUNDS}`,
    all: IS_EN ? "all" : "visus",
    seeResults: IS_EN ? "See results" : "Skatīt rezultātu",
    nextRound: IS_EN ? "Next round" : "Nākamā kārta",
    restartConfirm: IS_EN ? "Start the game again?" : "Sākt spēli no jauna?",
    share: IS_EN ? "Share your result" : "Dalīties ar rezultātu",
    shareDone: IS_EN ? "Your result is ready to share." : "Rezultāts ir sagatavots kopīgošanai.",
    shareCopied: IS_EN ? "The message has been copied." : "Ziņa ir nokopēta.",
    shareError: IS_EN ? "The message could not be shared. Please try again." : "Ziņu neizdevās kopīgot. Lūdzu, mēģini vēlreiz.",
  };

  const STATIC_EN = {
    "Lībiešu vietvārdu spēle": "Livonian Place Name Game",
    "Iepazīsti lībiešu valodu un vietvārdus": "Discover the Livonian language and place names",
    "Iepazīsti vietvārdus": "Discover place names",
    "lībiešu valodā": "in Livonian",
    "latviešu valodā": "in Latvian",
    "latviešu": "Latvian",
    "Savieno vietvārdus lībiešu un latviešu valodā. Atklāj lībiešu vietvārdu mantojumu!": "Match place names in Livonian and Latvian. Discover the heritage of Livonian place names!",
    "Sākt spēli": "Start game",
    "Kā tas darbojas?": "How does it work?",
    "Izvēlies vietvārdu": "Choose a place name",
    "Izvēlies lībiešu vietvārdu no kreisās kolonnas.": "Choose a Livonian place name from the left column.",
    "Savieno nosaukumus": "Match the names",
    "Savieno to ar atbilstošo latviešu vietvārdu.": "Match it with the corresponding Latvian place name.",
    "Atklāj vietu kartē": "Reveal the place on the map",
    "Pareizi savienojot, vietvārds iedegas kartē, un Tu iegūsti punktus!": "When matched correctly, the place lights up on the map and you earn points!",
    "Šīs spēles kārtas": "The rounds",
    "ved no latviešu valodai līdzīgākiem līdz grūtāk atpazīstamiem vietvārdiem lībiešu valodā": "progress from names that resemble Latvian to Livonian place names that are harder to recognise",
    "līdzīgi": "similar", "viegli": "easy", "vidēji": "medium", "grūti": "hard", "izaicinoši": "challenging",
    "Līdzīgi skan, viegli savienot": "Similar sounding and easy to match",
    "Samērā viegli atpazīstami vietvārdi": "Fairly easy to recognise",
    "Nepieciešama neliela apdomāšanās": "Requires a little thought",
    "Samērā sarežģīti nosaukumi": "Fairly complex names",
    "To spēs zinātāji un apsviedīgie": "For the knowledgeable and quick-witted",
    "Uzzini vairāk par lībiešiem": "Learn more about the Livonians",
    "© 2026 LU Digitālo humanitāro zinātņu centrs": "© 2026 University of Latvia Digital Humanities Centre",
    "Kā spēlēt": "How to play",
    "Katrā kārtā redzēsi divas vārdu kolonnas –": "In each round you will see two columns of words —",
    "un": "and",
    "valodā.": ".",
    "Uzklikšķini uz viena vārda katrā kolonnā, lai izveidotu pāri, tad klikšķini uz": "Click one word in each column to form a pair, then click",
    "Pārbaudīt": "Check",
    ".": ".",
    "Ja pāris pareizs, vietvārds iemirdzas.": "If the pair is correct, the place name lights up.",
    "Kārtas sākas ar līdzīgākajiem vārdu pāriem un kļūst arvien izaicinošākas.": "The rounds begin with the most similar pairs and become increasingly challenging.",
    "Punkti:": "Points:", "Laiks:": "Time:",
    "1. kārta no 5": "Round 1 of 5",
    "Savieno vietvārdu": "Match a place name",
    "ar atbilstošo nosaukumu": "with the corresponding name",
    "Lībiski": "Livonian", "Latviski": "Latvian",
    "Pareizi!": "Correct!", "Vēl neatklāts": "Not yet discovered", "Atklāts vietvārds": "Discovered place name",
    "Šī kārta ir pabeigta!": "Round complete!", "Tu atradi": "You found", "visus": "all", "vietvārdus šajā kārtā.": "place names in this round.",
    "Punkti": "Points", "Precizitāte": "Accuracy", "Laiks": "Time", "Atrasti vietvārdi": "Place names found",
    "Vai zināji?": "Did you know?", "Nākamā kārta": "Next round", "Sākt no sākuma": "Start over",
    "Šajā kārtā atklātās vietas": "Places discovered in this round", "Atrastie vietvārdi": "Discovered place names",
    "Tu esi atklājis 53 Latvijas vietvārdus lībiešu valodā!": "You have discovered 53 Latvian place names in Livonian!",
    "Kopā punkti": "Total points", "Kopējais laiks": "Total time", "Labākais rezultāts": "Best score",
    "Par šo spēli": "About this game", "Dalīties ar rezultātu": "Share your result"
    ,"Vai esi ar mieru atbildēt uz dažiem pētnieku jautājumiem?": "Do you agree to answer a few questions from the researchers?"
    ,"Vai vēlies atbildēt?": "Would you like to answer?"
    ,"Jā, atbildēšu": "Yes, answer"
    ,"Nē, paldies": "No, thanks"
    ,"Pēdējais jautājums": "One final question"
    ,"Atbilžu varianti": "Answer options"
    ,"Paldies, ka piedalījies un ka atbildēji uz jautājumiem. Pētniekiem tas noderēs!": "Thank you for participating and answering the questions. This will be helpful to the researchers!"
    ,"Spēlēt vēlreiz": "Play again"
    ,"Tavs vērtējums": "Your rating"
    ,"Kā Tev patika spēle?": "How did you like the game?"
    ,"Par Tevi": "About you"
    ,"Kura ir Tava vecuma grupa?": "What is your age group?"
    ,"Komentārs pēc izvēles": "Optional comment"
    ,"Vai vēlies ko piebilst par spēli?": "Would you like to add anything about the game?"
    ,"Lūdzu, neiekļauj personisku informāciju.": "Please do not include personal information."
    ,"Turpināt": "Continue"
    ,"Tava pieredze": "Your experience"
    ,"Vai Tu spēlēji pirmo reizi?": "Was this your first time playing?"
    ,"Jā": "Yes"
    ,"Nē": "No"
  };

  function applyLanguage() {
    document.documentElement.lang = LANG;
    document.title = IS_EN ? "Livonian Place Name Game" : "Lībiešu vietvārdu spēle";
    if (!IS_EN) return;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const raw = node.nodeValue;
      const key = raw.trim();
      if (STATIC_EN[key] !== undefined) node.nodeValue = raw.replace(key, STATIC_EN[key]);
    }
    const attrs = {
      "Lībiešu vietvārdu spēles logotips": "Livonian Place Name Game logo",
      "Aizvērt": "Close", "Aktīvais spēles laiks": "Active game time",
      "Sākt no jauna": "Start over", "Latvijas karte": "Map of Latvia",
      "Atgriezties pie visas kartes": "Return to the full map",
      "Atbilžu varianti": "Answer options",
      "Spēles vērtējums no 1 līdz 5": "Game rating from 1 to 5",
      "Vecuma grupas": "Age groups",
      "1 zvaigzne": "1 star", "2 zvaigznes": "2 stars", "3 zvaigznes": "3 stars",
      "4 zvaigznes": "4 stars", "5 zvaigznes": "5 stars"
    };
    document.querySelectorAll("[aria-label], [title], [alt]").forEach(el => {
      ["aria-label", "title", "alt"].forEach(attr => {
        const value = el.getAttribute(attr);
        if (attrs[value]) el.setAttribute(attr, attrs[value]);
      });
    });
    const meta = document.querySelector('meta[name="description"]');
    const commentInput = document.querySelector("#survey-comment-text");
    if (commentInput) commentInput.placeholder = "Write a comment if you wish";
    if (meta) meta.content = "Match Livonian and Latvian place names and discover the heritage of Livonian place names.";
  }
  applyLanguage();

  document.querySelectorAll("[data-about-link]").forEach(link => {
    link.href = `about.html${IS_EN ? "#en" : ""}`;
  });

  function installLanguageSwitches() {
    document.querySelectorAll(".theme-switch").forEach(themeSwitch => {
      const aboutLink = document.createElement("a");
      aboutLink.className = "about-icon-link";
      aboutLink.href = `about.html${IS_EN ? "#en" : ""}`;
      aboutLink.setAttribute("aria-label", IS_EN ? "About this game" : "Par šo spēli");
      aboutLink.title = IS_EN ? "About this game" : "Par šo spēli";
      aboutLink.innerHTML = '<svg width="18" height="18" aria-hidden="true"><use href="#i-info"/></svg>';
      const switcher = document.createElement("div");
      switcher.className = "lang-switch";
      switcher.setAttribute("role", "group");
      switcher.setAttribute("aria-label", IS_EN ? "Language" : "Valoda");
      switcher.innerHTML = `
        <button type="button" class="lang-option${LANG === "lv" ? " active" : ""}" data-lang="lv" aria-pressed="${LANG === "lv"}">LV</button>
        <span aria-hidden="true"></span>
        <button type="button" class="lang-option${LANG === "en" ? " active" : ""}" data-lang="en" aria-pressed="${LANG === "en"}">EN</button>`;
      switcher.querySelectorAll("button").forEach(button => {
        button.addEventListener("click", () => {
          const next = button.dataset.lang;
          if (next === LANG) return;
          if (next === "en") location.hash = "en";
          else location.href = location.href.split("#")[0];
        });
      });
      const parent = themeSwitch.parentElement;
      if (parent.classList.contains("game-header-controls")) {
        parent.insertBefore(aboutLink, themeSwitch);
        parent.insertBefore(switcher, themeSwitch);
      } else {
        const settings = document.createElement("div");
        settings.className = "header-settings";
        parent.insertBefore(settings, themeSwitch);
        settings.append(aboutLink, switcher, themeSwitch);
      }
    });
  }
  installLanguageSwitches();
  window.addEventListener("hashchange", () => location.reload());

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function createSessionId() {
    if (crypto.randomUUID) return crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, char => {
      const value = Math.random() * 16 | 0;
      return (char === "x" ? value : (value & 3) | 8).toString(16);
    });
  }

  let state = {
    round: 1, score: 0, totalCorrect: 0, totalAttempts: 0,
    roundAttempts: 0, roundCorrect: 0, roundStartTime: 0, roundScoreStart: 0,
    matchedIds: new Set(), matchedOrder: [],
    selLiv: null, selLv: null, busy: false,
    sessionId: createSessionId(), sessionStartedAt: "", roundResults: [], completedAt: "",
    finalTotalTimeMs: 0, finalTotalPoints: 0,
    research: null, survey: { rating: "", ageGroup: "", firstTimePlayer: "", comment: "" }, sessionSubmitted: false, sessionSubmissionPromise: null,
    progressSubmissionPromise: Promise.resolve(),
  };

  const screens = {
    start: $("#screen-start"), game: $("#screen-game"),
    round: $("#screen-round"), final: $("#screen-final"),
  };
  function resetPageScroll() {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }
  function showScreen(name) {
    Object.values(screens).forEach(s => s.classList.add("hidden"));
    screens[name].classList.remove("hidden");
    resetPageScroll();
    requestAnimationFrame(resetPageScroll);
  }

  function setTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem(LS_THEME, t);
    refreshAllMapTiles();
  }
  $$(".sw").forEach(sw => {
    sw.addEventListener("click", () => {
      const cur = document.documentElement.getAttribute("data-theme");
      setTheme(cur === "dark" ? "light" : "dark");
    });
  });
  document.documentElement.setAttribute("data-theme", localStorage.getItem(LS_THEME) || "dark");

  $$(".brand").forEach(b => {
    b.addEventListener("click", () => {
      if (!screens.start.classList.contains("hidden")) return;
      if (confirm(UI.exitConfirm)) {
        markCurrentSessionAbandoned();
        resetAll();
        showScreen("start");
      }
    });
  });

  const howPanel = $("#how-panel");
  $("#btn-how")?.addEventListener("click", () => howPanel.classList.remove("hidden"));
  $("#btn-how-close").addEventListener("click", () => howPanel.classList.add("hidden"));
  howPanel.addEventListener("click", (e) => { if (e.target === howPanel) howPanel.classList.add("hidden"); });

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function pairsForRound(r) { return ALL_PAIRS.filter(p => p.round === r); }
  function fmtTime(ms) {
    const s = Math.round(ms / 1000);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  }

  let activeElapsedMs = 0;
  let activeStartedAt = null;
  let timerRaf = null;
  function activeTimeMs() {
    return activeElapsedMs + (activeStartedAt === null ? 0 : performance.now() - activeStartedAt);
  }
  function renderActiveTimer() {
    const el = $("#stat-timer");
    if (el) el.textContent = fmtTime(activeTimeMs());
    if (activeStartedAt !== null) timerRaf = requestAnimationFrame(renderActiveTimer);
  }
  function resumeActiveTimer() {
    if (activeStartedAt !== null) return;
    activeStartedAt = performance.now();
    cancelAnimationFrame(timerRaf);
    renderActiveTimer();
  }
  function pauseActiveTimer() {
    if (activeStartedAt !== null) activeElapsedMs += performance.now() - activeStartedAt;
    activeStartedAt = null;
    cancelAnimationFrame(timerRaf);
    timerRaf = null;
    renderActiveTimer();
  }
  function resetActiveTimer() {
    activeElapsedMs = 0;
    activeStartedAt = null;
    cancelAnimationFrame(timerRaf);
    timerRaf = null;
    renderActiveTimer();
  }
  function tooltipHtml(p) {
    return `<span class="pt-main">${esc(p.liv)}</span><span class="pt-sep"> · </span><span class="pt-sub">${esc(p.lv)}</span>`;
  }

  const TILE_URLS = {
    dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    light: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
  };
  const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>';
  function currentTileUrl() {
    return document.documentElement.getAttribute("data-theme") === "light" ? TILE_URLS.light : TILE_URLS.dark;
  }
  function makeTileLayer() {
    return L.tileLayer(currentTileUrl(), { attribution: TILE_ATTR, subdomains: "abcd", maxZoom: 18 });
  }
  const tileLayersByMap = new Map();
  function addThemedTiles(map) {
    const layer = makeTileLayer();
    layer.addTo(map);
    tileLayersByMap.set(map, layer);
    return layer;
  }
  function refreshAllMapTiles() {
    tileLayersByMap.forEach((layer, map) => {
      map.removeLayer(layer);
      const fresh = makeTileLayer();
      fresh.addTo(map);
      fresh.bringToBack();
      tileLayersByMap.set(map, fresh);
    });
  }
  const ALL_LATLNGS = ALL_PAIRS.map(p => [p.lat, p.lon]);
  const OVERVIEW_BOUNDS = L.latLngBounds(ALL_LATLNGS).pad(0.15);

  function setDotState(marker, add, remove) {
    const el = marker.getElement && marker.getElement();
    if (!el) return;
    (remove || []).forEach(c => el.classList.remove(c));
    (add || []).forEach(c => el.classList.add(c));
  }

  function keepMarkerHoverOnly(marker) {
    const element = marker.getElement && marker.getElement();
    if (element) {
      element.setAttribute("tabindex", "-1");
      element.addEventListener("mousedown", event => event.preventDefault());
    }
    marker.on("click", event => {
      if (event.originalEvent) {
        L.DomEvent.preventDefault(event.originalEvent);
        L.DomEvent.stopPropagation(event.originalEvent);
      }
      const currentElement = marker.getElement && marker.getElement();
      if (currentElement && currentElement.blur) currentElement.blur();
    });
  }

  let constellationMap = null;
  function buildConstellation() {
    const container = $("#constellation-map");
    if (!container) return;
    if (constellationMap) { constellationMap.remove(); constellationMap = null; }
    constellationMap = L.map(container, {
      zoomControl: false, attributionControl: false, dragging: false,
      scrollWheelZoom: false, doubleClickZoom: false, boxZoom: false,
      keyboard: false, touchZoom: false, tap: false, fadeAnimation: true,
    });
    addThemedTiles(constellationMap);
    ALL_PAIRS.forEach(p => {
      L.circleMarker([p.lat, p.lon], { radius: 3.2, className: "geo-dot dim", weight: 0, fillOpacity: 0.8, interactive: false }).addTo(constellationMap);
    });
    requestAnimationFrame(() => {
      constellationMap.invalidateSize();
      constellationMap.fitBounds(OVERVIEW_BOUNDS);
    });
  }
  buildConstellation();
  window.addEventListener("resize", () => { if (constellationMap) constellationMap.invalidateSize(); });

  let gameMap = null;
  const gameMarkers = {};
  let currentLitId = null;

  let currentRoundBounds = OVERVIEW_BOUNDS;

  function initGameMap() {
    if (gameMap) return;
    const container = $("#game-map");
    gameMap = L.map(container, { zoomControl: true, attributionControl: true, minZoom: 6, maxZoom: 15 });
    gameMap.zoomControl.setPosition("bottomright");
    addThemedTiles(gameMap);
    ALL_PAIRS.forEach(pair => {
      const m = L.circleMarker([pair.lat, pair.lon], { radius: 5, className: "geo-dot dim", weight: 1, keyboard: false, bubblingMouseEvents: false }).addTo(gameMap);
      m.bindTooltip(tooltipHtml(pair), { direction: "top", offset: [0, -6], className: "place-tooltip" });
      keepMarkerHoverOnly(m);
      gameMarkers[pair.id] = m;
    });
  }

  function fitToRoundBounds(pairs, animate) {
    if (!gameMap || !pairs.length) return;
    const bounds = L.latLngBounds(pairs.map(p => [p.lat, p.lon])).pad(0.35);
    currentRoundBounds = bounds;
    if (animate) gameMap.flyToBounds(bounds, { duration: 1, maxZoom: 12 });
    else gameMap.fitBounds(bounds, { maxZoom: 12 });
  }

  function resetGameMapMarkers() {
    Object.values(gameMarkers).forEach(m => {
      setDotState(m, ["dim"], ["lit", "current", "just-landed"]);
      m.closeTooltip();
    });
    currentLitId = null;
    clearComet();
  }

  $("#btn-locate").addEventListener("click", () => {
    if (gameMap) gameMap.flyToBounds(currentRoundBounds, { duration: 1 });
  });

  let cometEls = null;
  function clearComet() {
    if (cometEls) { cometEls.path.remove(); cometEls.head.remove(); cometEls = null; }
  }
  function curvedLatLngs(p0, p1, segments) {
    const [lat0, lon0] = p0, [lat1, lon1] = p1;
    const mLat = (lat0 + lat1) / 2, mLon = (lon0 + lon1) / 2;
    const dLat = lat1 - lat0, dLon = lon1 - lon0;
    const dist = Math.hypot(dLat, dLon) || 0.0001;
    const nLat = -dLon / dist, nLon = dLat / dist;
    const bow = Math.min(0.35, dist * 0.22);
    const cLat = mLat + nLat * bow, cLon = mLon + nLon * bow;
    const pts = [];
    const n = segments || 48;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const lat = (1 - t) * (1 - t) * lat0 + 2 * (1 - t) * t * cLat + t * t * lat1;
      const lon = (1 - t) * (1 - t) * lon0 + 2 * (1 - t) * t * cLon + t * t * lon1;
      pts.push([lat, lon]);
    }
    return pts;
  }
  function ensureCometGradient(map) {
    const svg = map.getPanes().overlayPane.querySelector("svg");
    if (!svg) return null;
    let defs = svg.querySelector("defs");
    if (!defs) { defs = document.createElementNS("http://www.w3.org/2000/svg", "defs"); svg.insertBefore(defs, svg.firstChild); }
    let grad = defs.querySelector("#cometTailGrad");
    if (!grad) {
      grad = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
      grad.setAttribute("id", "cometTailGrad");
      grad.setAttribute("gradientUnits", "userSpaceOnUse");
      grad.innerHTML = '<stop offset="0%" stop-color="var(--green)" stop-opacity="0"/><stop offset="100%" stop-color="var(--green)" stop-opacity="0.9"/>';
      defs.appendChild(grad);
    }
    return grad;
  }

  function flyComet(fromLatLng, toLatLng, onLand) {
    clearComet();
    const pts = curvedLatLngs(fromLatLng, toLatLng);
    const poly = L.polyline(pts, { className: "comet-tail", weight: 3 }).addTo(gameMap);
    const pathEl = poly.getElement();
    if (!pathEl) { onLand && onLand(); return; }

    const grad = ensureCometGradient(gameMap);
    if (grad) {
      const p0 = gameMap.latLngToLayerPoint(L.latLng(fromLatLng));
      const p1 = gameMap.latLngToLayerPoint(L.latLng(toLatLng));
      grad.setAttribute("x1", p0.x); grad.setAttribute("y1", p0.y);
      grad.setAttribute("x2", p1.x); grad.setAttribute("y2", p1.y);
      pathEl.style.stroke = "url(#cometTailGrad)";
    }

    const len = pathEl.getTotalLength();
    pathEl.style.strokeDasharray = String(len);
    pathEl.style.strokeDashoffset = String(len);

    const head = L.circleMarker(fromLatLng, { radius: 4.5, className: "comet-head", weight: 0 }).addTo(gameMap);
    cometEls = { path: poly, head };

    const distDeg = Math.hypot(toLatLng[0] - fromLatLng[0], toLatLng[1] - fromLatLng[1]);
    const dur = Math.max(650, Math.min(1600, 650 + distDeg * 220));
    const t0 = performance.now();
    function frame(now) {
      if (!cometEls) return;
      const t = Math.min(1, (now - t0) / dur);
      const ease = t * t * (3 - 2 * t);
      const revealLen = ease * len;
      pathEl.style.strokeDashoffset = String(len - revealLen);
      const pt = pathEl.getPointAtLength(revealLen);
      const headLatLng = gameMap.layerPointToLatLng(L.point(pt.x, pt.y));
      head.setLatLng(headLatLng);
      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        const finished = cometEls;
        if (finished) {
          finished.path.getElement() && (finished.path.getElement().style.transition = "opacity .35s ease");
          finished.head.getElement() && (finished.head.getElement().style.transition = "opacity .35s ease");
          if (finished.path.getElement()) finished.path.getElement().style.opacity = "0";
          if (finished.head.getElement()) finished.head.getElement().style.opacity = "0";
        }
        setTimeout(() => { if (cometEls === finished) clearComet(); }, 380);
        onLand && onLand();
      }
    }
    requestAnimationFrame(frame);
  }

  const FIRST_COMET_ORIGIN = [58.6, 17.8];

  function celebrateMatch(pair) {
    const marker = gameMarkers[pair.id];
    if (!marker) return;

    const prevId = currentLitId;
    const prevLatLng = (prevId !== null && gameMarkers[prevId]) ? gameMarkers[prevId].getLatLng() : null;
    const cometOrigin = prevLatLng ? [prevLatLng.lat, prevLatLng.lng] : FIRST_COMET_ORIGIN;

    if (prevId !== null && gameMarkers[prevId]) {
      setDotState(gameMarkers[prevId], [], ["current"]);
      gameMarkers[prevId].closeTooltip();
    }
    currentLitId = pair.id;

    const land = () => {
      setDotState(marker, ["lit", "current", "just-landed"], ["dim"]);
      marker.openTooltip();
      setTimeout(() => setDotState(marker, [], ["just-landed"]), 900);
    };

    flyComet(cometOrigin, [pair.lat, pair.lon], land);
  }


  let roundMap = null, roundLayer = null;
  let finalMap = null, finalLayer = null;

  const measureCanvas = document.createElement("canvas");
  const measureCtx = measureCanvas.getContext("2d");
  function textWidth(str, px, weight) {
    measureCtx.font = `${weight || 700} ${px}px Inter, sans-serif`;
    return measureCtx.measureText(str).width;
  }

  function layoutLabels(points, viewport) {
    const placed = [];
    const ordered = points.slice().sort((a, b) => a.y - b.y || a.x - b.x);
    const results = [];
    const overlapArea = (a, b) => Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0))
      * Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));
    ordered.forEach(p => {
      const compact = viewport.x < 700;
      const mainW = textWidth(p.liv, compact ? 10 : 12, 700);
      const sepW = textWidth(" · ", compact ? 9 : 11, 400);
      const subW = textWidth(p.lv, compact ? 9 : 11, 500);
      const w = mainW + sepW + subW + (compact ? 20 : 30);
      const h = compact ? 24 : 30;
      const candidates = [
        { dx: 12, dy: -h / 2 }, { dx: 12, dy: h / 2 - 6 },
        { dx: -w - 12, dy: -h / 2 }, { dx: -w - 12, dy: h / 2 - 6 },
        { dx: -w / 2, dy: -h - 16 }, { dx: -w / 2, dy: 16 },
      ];
      const maxRadius = Math.hypot(viewport.x, viewport.y) * .72;
      for (let radius = 48; radius <= maxRadius; radius += 34) {
        for (let step = 0; step < 16; step++) {
          const angle = (step / 16) * Math.PI * 2 - Math.PI / 2;
          candidates.push({
            dx: Math.cos(angle) * radius - w / 2,
            dy: Math.sin(angle) * radius - h / 2,
          });
        }
      }
      let chosen = null;
      for (const c of candidates) {
        const bx0 = p.x + c.dx, by0 = p.y + c.dy, bx1 = bx0 + w, by1 = by0 + h;
        const inView = !viewport || (bx0 >= 8 && by0 >= 8 && bx1 <= viewport.x - 8 && by1 <= viewport.y - 8);
        const collides = placed.some(b => !(bx1 < b.x0 - 4 || bx0 > b.x1 + 4 || by1 < b.y0 - 4 || by0 > b.y1 + 4));
        if (inView && !collides) { chosen = c; break; }
      }
      if (!chosen) {
        const ranked = candidates.map(c => {
          const x0 = p.x + c.dx, y0 = p.y + c.dy;
          const box = { x0, y0, x1: x0 + w, y1: y0 + h };
          const inView = x0 >= 8 && y0 >= 8 && box.x1 <= viewport.x - 8 && box.y1 <= viewport.y - 8;
          const overlap = placed.reduce((sum, b) => sum + overlapArea(box, b), 0);
          return { c, inView, score: overlap * 100 + Math.hypot(c.dx + w / 2, c.dy + h / 2) };
        }).filter(v => v.inView).sort((a, b) => a.score - b.score);
        chosen = ranked.length ? ranked[0].c : { dx: 8 - p.x, dy: 8 - p.y };
      }
      const bx0 = p.x + chosen.dx, by0 = p.y + chosen.dy;
      placed.push({ x0: bx0, y0: by0, x1: bx0 + w, y1: by0 + h });
      const leader = Math.hypot(chosen.dx + w / 2, chosen.dy + h / 2) > 30;
      results.push({ ...p, dx: chosen.dx, dy: chosen.dy, w, h, leader });
    });
    return results;
  }

  function renderSummaryMap(which, ids) {
    const isRound = which === "round";
    const containerId = isRound ? "#round-map" : "#final-map";
    let map = isRound ? roundMap : finalMap;
    let layer = isRound ? roundLayer : finalLayer;

    if (!map) {
      const container = $(containerId);
      map = L.map(container, { zoomControl: true, attributionControl: true, minZoom: 5, maxZoom: 15 });
      map.zoomControl.setPosition("bottomright");
      addThemedTiles(map);
      layer = L.layerGroup().addTo(map);
      if (isRound) { roundMap = map; roundLayer = layer; }
      else { finalMap = map; finalLayer = layer; }
    }
    const pts = ids.map(id => ALL_PAIRS[id]);
    const latlngs = pts.map(p => [p.lat, p.lon]);
    if (!latlngs.length) return;

    layer.clearLayers();
    const dotLayer = L.layerGroup().addTo(layer);
    const annotationLayer = L.layerGroup().addTo(layer);
    const focusSummaryItem = (id, active) => {
      const container = $(containerId);
      container.classList.toggle("summary-map-focus", active);
      container.querySelectorAll(".summary-item").forEach(el => {
        el.classList.toggle("is-focus", active && el.classList.contains(`summary-id-${id}`));
        el.classList.toggle("is-muted", active && !el.classList.contains(`summary-id-${id}`));
      });
    };
    pts.forEach((p, pointIndex) => {
      const arrivalClass = !isRound ? " final-dot-arrival" : "";
      const dot = L.circleMarker([p.lat, p.lon], { radius: 6, className: `geo-dot lit summary-item summary-id-${p.id}${arrivalClass}`, weight: 1.6, keyboard: false, bubblingMouseEvents: false })
        .bindTooltip(tooltipHtml(p), { className: "place-tooltip", direction: "top", offset: [0, -8], opacity: 1 })
        .addTo(dotLayer);
      keepMarkerHoverOnly(dot);
      dot.on("mouseover", () => focusSummaryItem(p.id, true));
      dot.on("mouseout", () => focusSummaryItem(p.id, false));
      if (!isRound && dot.getElement()) dot.getElement().style.animationDelay = `${180 + pointIndex * 28}ms`;
    });

    if (map._summaryRelayout) map.off("zoomend moveend resize", map._summaryRelayout);
    if (map._summaryHide) map.off("zoomstart movestart", map._summaryHide);
    const relayout = () => {
      annotationLayer.clearLayers();
      const animateArrival = !isRound && !map._finalArrivalPlayed;
      if (animateArrival) map._finalArrivalPlayed = true;
      const viewport = map.getSize();
      const pxPoints = pts.map(p => {
        const pt = map.latLngToContainerPoint([p.lat, p.lon]);
        return { id: p.id, x: pt.x, y: pt.y, liv: p.liv, lv: p.lv, lat: p.lat, lon: p.lon };
      }).filter(p => p.x >= 0 && p.x <= viewport.x && p.y >= 0 && p.y <= viewport.y);

      const laid = layoutLabels(pxPoints, viewport);
      const arrivalOrder = new Map([...laid].sort((a, b) => a.x - b.x || a.y - b.y).map((p, index) => [p.id, index]));
      laid.forEach(p => {
        const arrivalIndex = arrivalOrder.get(p.id) || 0;
        const arrivalDelay = 260 + arrivalIndex * 34;
        const angle = ((p.id * 137.508) % 360) * Math.PI / 180;
        const arrivalDistance = 72 + (p.id % 4) * 12;
        const arrivalX = Math.round(Math.cos(angle) * arrivalDistance);
        const arrivalY = Math.round(Math.sin(angle) * arrivalDistance * .62);
        const anchorPt = L.point(p.x + p.dx, p.y + p.dy);
        const anchorLatLng = map.containerPointToLatLng(anchorPt);
        if (p.leader) {
          const cx = p.x + p.dx + p.w / 2;
          const cy = p.y + p.dy + p.h / 2;
          const vx = cx - p.x;
          const vy = cy - p.y;
          const tx = Math.abs(vx) > 0.01 ? (p.w / 2) / Math.abs(vx) : Infinity;
          const ty = Math.abs(vy) > 0.01 ? (p.h / 2) / Math.abs(vy) : Infinity;
          const t = Math.min(tx, ty);
          const edgePt = L.point(cx - vx * t, cy - vy * t);
          const edgeVx = edgePt.x - p.x;
          const edgeVy = edgePt.y - p.y;
          const edgeDistance = Math.hypot(edgeVx, edgeVy) || 1;
          const dotRadius = 7.5;
          const startPt = L.point(
            p.x + (edgeVx / edgeDistance) * dotRadius,
            p.y + (edgeVy / edgeDistance) * dotRadius
          );
          const startLatLng = map.containerPointToLatLng(startPt);
          const edgeLatLng = map.containerPointToLatLng(edgePt);
          const path = [[startLatLng.lat, startLatLng.lng], [edgeLatLng.lat, edgeLatLng.lng]];
          const leaderArrivalClass = animateArrival ? " summary-arrival-line" : "";
          const leader = L.polyline(path, { className: `label-leader summary-item summary-id-${p.id}${leaderArrivalClass}`, weight: 0.75, interactive: false }).addTo(annotationLayer);
          if (animateArrival && leader.getElement()) leader.getElement().style.animationDelay = `${arrivalDelay + 360}ms`;
        }
        const arrivalClass = animateArrival ? " summary-arrival" : "";
        const arrivalStyle = animateArrival ? ` style="--arrival-x:${arrivalX}px;--arrival-y:${arrivalY}px;animation-delay:${arrivalDelay}ms"` : "";
        const html = `<div class="place-tooltip place-label-fixed summary-item summary-id-${p.id}${arrivalClass}"${arrivalStyle}>${tooltipHtml(p)}</div>`;
        const label = L.marker(anchorLatLng, {
          icon: L.divIcon({ className: `place-label-icon summary-item summary-id-${p.id}`, html, iconSize: null, iconAnchor: [0, 0] }),
          interactive: true, keyboard: false,
        }).addTo(annotationLayer);
        label.on("mouseover", () => focusSummaryItem(p.id, true));
        label.on("mouseout", () => focusSummaryItem(p.id, false));
      });
    };
    const hideAnnotations = () => annotationLayer.clearLayers();
    map._summaryRelayout = () => {
      if (map._summaryRelayoutFrame) cancelAnimationFrame(map._summaryRelayoutFrame);
      map._summaryRelayoutFrame = requestAnimationFrame(() => {
        map._summaryRelayoutFrame = 0;
        relayout();
      });
    };
    map._summaryHide = hideAnnotations;
    map.on("zoomend moveend resize", map._summaryRelayout);
    map.on("zoomstart movestart", map._summaryHide);

    requestAnimationFrame(() => {
      map.invalidateSize();
      if (!isRound) map._finalArrivalPlayed = false;
      map.fitBounds(L.latLngBounds(latlngs).pad(0.25));
      map._summaryOverviewZoom = map.getZoom();
      map._summaryRelayout();
    });
  }


  const listLiv = $("#list-liv");
  const listLv = $("#list-lv");
  const matchRows = $("#match-rows");
  const connectorSvg = $("#connector-svg");
  const btnCheck = $("#btn-check");
  const toastCard = $("#toast-card");
  const toastIcon = $("#toast-icon");
  const toastTitle = $("#toast-title");

  let currentRoundPairs = [];
  let matchedPairEls = [];

  function createChip(pair, side) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "word-chip " + side;
    btn.dataset.id = pair.id;
    if (side === "liv") {
      btn.innerHTML = `<span class="grip">⋮⋮</span><span class="dot"></span><span class="txt">${esc(pair.liv)}</span>`;
    } else {
      btn.innerHTML = `<span class="txt">${esc(pair.lv)}</span><span class="radio"></span>`;
    }
    btn.addEventListener("click", () => onChipClick(btn, pair, side));
    return btn;
  }

  function renderTray() {
    listLiv.innerHTML = "";
    listLv.innerHTML = "";
    matchedPairEls = [];
    shuffle(currentRoundPairs).forEach(p => listLiv.appendChild(createChip(p, "liv")));
    shuffle(currentRoundPairs).forEach(p => listLv.appendChild(createChip(p, "lv")));
    redrawAllConnectors();
  }

  const SVG_NS = "http://www.w3.org/2000/svg";
  function drawConnectorPath(livEl, lvEl, cRect, isMatched) {
    const r1 = livEl.getBoundingClientRect();
    const r2 = lvEl.getBoundingClientRect();
    const p0 = { x: r1.right - cRect.left, y: r1.top + r1.height / 2 - cRect.top };
    const p1 = { x: r2.left - cRect.left, y: r2.top + r2.height / 2 - cRect.top };
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("class", "connector-path" + (isMatched ? " correct" : ""));
    path.setAttribute("d", `M${p0.x},${p0.y} C${p0.x + 40},${p0.y} ${p1.x - 40},${p1.y} ${p1.x},${p1.y}`);
    connectorSvg.appendChild(path);
  }

  function redrawAllConnectors() {
    connectorSvg.querySelectorAll("path.connector-path").forEach(p => p.remove());
    const cRect = matchRows.getBoundingClientRect();
    matchedPairEls.forEach(({ livEl, lvEl }) => drawConnectorPath(livEl, lvEl, cRect, true));
    if (state.selLiv && state.selLv) drawConnectorPath(state.selLiv.el, state.selLv.el, cRect, false);
  }
  function clearConnector() { redrawAllConnectors(); }
  function updateConnector() { redrawAllConnectors(); }
  window.addEventListener("resize", () => redrawAllConnectors());

  function onChipClick(chipEl, pair, side) {
    if (state.busy || chipEl.classList.contains("correct")) return;
    const key = side === "liv" ? "selLiv" : "selLv";
    const cls = "selected";

    if (state[key] && state[key].el === chipEl) {
      chipEl.classList.remove(cls);
      state[key] = null;
      updateConnector();
      updateCheckBtn();
      return;
    }
    if (state[key]) state[key].el.classList.remove(cls);
    chipEl.classList.add(cls);
    state[key] = { id: pair.id, el: chipEl, pair };
    updateConnector();
    updateCheckBtn();
  }

  function updateCheckBtn() {
    btnCheck.disabled = !(state.selLiv && state.selLv);
  }

  function toast(kind, title) {
    toastCard.className = "toast-card show" + (kind === "bad" ? " bad" : "");
    toastIcon.innerHTML = kind === "bad"
      ? '<svg width="16" height="16"><use href="#i-close"/></svg>'
      : '<svg width="16" height="16"><use href="#i-check"/></svg>';
    toastTitle.textContent = title;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { toastCard.classList.remove("show"); }, 1500);
  }

  function animateScoreDelta(amount) {
    const el = $("#score-delta");
    if (!el) return;
    el.className = "score-delta";
    void el.offsetWidth;
    el.textContent = amount > 0 ? `+${amount}` : `−${Math.abs(amount)}`;
    el.classList.add(amount > 0 ? "good" : "bad");
  }

  btnCheck.addEventListener("click", attemptMatch);

  function attemptMatch() {
    if (!state.selLiv || !state.selLv || state.busy) return;
    state.busy = true;
    state.totalAttempts++;
    state.roundAttempts++;
    const a = state.selLiv, b = state.selLv;

    if (a.id === b.id) {
      state.score += POINTS_CORRECT;
      state.totalCorrect++;
      state.roundCorrect++;
      state.matchedIds.add(a.id);

      toast("good", UI.correct);
      a.el.classList.add("correct");
      b.el.classList.add("correct");
      a.el.classList.remove("selected");
      b.el.classList.remove("selected");
      matchedPairEls.push({ livEl: a.el, lvEl: b.el });

      state.matchedOrder.push(a.id);
      celebrateMatch(a.pair);
      updateTopStats();
      animateScoreDelta(POINTS_CORRECT);

      state.selLiv = null;
      state.selLv = null;
      state.busy = false;
      redrawAllConnectors();
      updateCheckBtn();

      if (currentRoundPairs.every(p => state.matchedIds.has(p.id))) {
        setTimeout(onRoundComplete, 1300);
      }
    } else {
      state.score = Math.max(0, state.score - WRONG_PENALTY);
      toast("bad", UI.wrong);
      a.el.classList.add("wrong");
      b.el.classList.add("wrong");
      updateTopStats();
      animateScoreDelta(-WRONG_PENALTY);
      setTimeout(() => {
        a.el.classList.remove("wrong", "selected");
        b.el.classList.remove("wrong", "selected");
        state.selLiv = null;
        state.selLv = null;
        state.busy = false;
        clearConnector();
        updateCheckBtn();
      }, 480);
    }
  }

  function updateTopStats() {
    $("#stat-round").textContent = UI.round(state.round);
    $("#stat-score").textContent = state.score;
    const matchedInRound = currentRoundPairs.filter(p => state.matchedIds.has(p.id)).length;
    $("#round-progress-fill").style.width = `${(matchedInRound / currentRoundPairs.length) * 100}%`;
  }

  function startRound(n) {
    initGameMap();
    resetGameMapMarkers();
    state.round = n;
    state.roundAttempts = 0;
    state.roundCorrect = 0;
    state.roundStartTime = performance.now();
    state.roundScoreStart = state.score;
    state.selLiv = null;
    state.selLv = null;
    state.busy = false;
    currentRoundPairs = pairsForRound(n);
    renderTray();
    updateCheckBtn();
    updateTopStats();
    showScreen("game");
    resumeActiveTimer();
    requestAnimationFrame(() => {
      if (!gameMap) return;
      gameMap.invalidateSize();
      fitToRoundBounds(currentRoundPairs, false);
    });
  }

  function onRoundComplete() {
    pauseActiveTimer();
    const elapsed = Math.round(performance.now() - state.roundStartTime);
    const acc = state.roundAttempts ? Math.round((state.roundCorrect / state.roundAttempts) * 100) : 100;
    const thisRoundScore = state.score - state.roundScoreStart;
    state.roundResults[state.round - 1] = { timeMs: elapsed, points: thisRoundScore };
    queueSessionProgress("in_progress", state.round);

    $("#round-header-label").textContent = UI.round(state.round);
    $("#round-total-score").textContent = state.score;
    $("#round-title").textContent = ROUND_TITLES[Math.min(state.round - 1, ROUND_TITLES.length - 1)];
    $("#round-found-count").textContent = UI.all;
    $("#round-score").textContent = `+${thisRoundScore}`;
    $("#round-acc").textContent = `${acc}%`;
    $("#round-time").textContent = fmtTime(elapsed);
    $("#round-found-frac").textContent = `${currentRoundPairs.length}/${currentRoundPairs.length}`;
    const fact = FACTS[(state.round - 1) % FACTS.length];
    const factEl = $("#round-fact");
    factEl.textContent = fact[LANG] + " ";
    if (fact.linkUrl) {
      const a = document.createElement("a");
      a.href = fact.linkUrl; a.target = "_blank"; a.rel = "noopener";
      a.textContent = IS_EN ? fact.linkTextEn : fact.linkTextLv;
      a.style.color = "var(--violet)"; a.style.fontWeight = "700"; a.style.textDecoration = "none";
      factEl.appendChild(a);
    }

    showScreen("round");
    renderSummaryMap("round", currentRoundPairs.map(p => p.id));

    const isLast = state.round >= TOTAL_ROUNDS;
    $("#btn-next-round").innerHTML = isLast
      ? `${UI.seeResults} <svg width="16" height="16"><use href="#i-arrow-right"/></svg>`
      : `${UI.nextRound} <svg width="16" height="16"><use href="#i-arrow-right"/></svg>`;
  }

  $("#btn-next-round").addEventListener("click", () => {
    if (state.round >= TOTAL_ROUNDS) { finishGame(); return; }
    startRound(state.round + 1);
  });
  $("#btn-round-replay").addEventListener("click", beginNewSession);

  function finishGame() {
    if (state.completedAt) return;
    pauseActiveTimer();
    const elapsedMs = activeTimeMs();
    const elapsedSeconds = elapsedMs / 1000;
    const scoreBeforeTimeBonus = state.score;
    let timeBonus = Math.round((TIME_TARGET_SECONDS - elapsedSeconds) * TIME_BONUS_PER_SECOND);
    timeBonus = Math.max(TIME_BONUS_MIN, Math.min(TIME_BONUS_MAX, timeBonus));
    state.score = Math.max(0, state.score + timeBonus);
    const effectiveTimeBonus = state.score - scoreBeforeTimeBonus;
    const finalRoundResult = state.roundResults[TOTAL_ROUNDS - 1];
    if (finalRoundResult) finalRoundResult.points += effectiveTimeBonus;
    state.completedAt = new Date().toISOString();
    state.finalTotalTimeMs = Math.round(elapsedMs);
    state.finalTotalPoints = state.score;
    queueSessionProgress("game_completed", TOTAL_ROUNDS);

    const overallAcc = state.totalAttempts ? Math.round((state.totalCorrect / state.totalAttempts) * 100) : 100;
    const best = Math.max(state.score, parseInt(localStorage.getItem(LS_BEST) || "0", 10));
    localStorage.setItem(LS_BEST, String(best));

    const n = ALL_PAIRS.length;
    $("#final-title").textContent = IS_EN
      ? `You have discovered ${n} Latvian place names in Livonian!`
      : `Tu esi atklājis ${n} Latvijas vietvārdus lībiešu valodā!`;
    $("#final-score").textContent = state.score;
    $("#final-acc").textContent = `${overallAcc}%`;
    $("#final-best").textContent = best;
    $("#final-time").textContent = fmtTime(elapsedMs);
    $("#final-time-note").textContent = timeBonus >= 0
      ? (IS_EN ? `Time bonus: +${timeBonus} points (great pace!)` : `Laika bonuss: +${timeBonus} punkti (ātrs temps!)`)
      : (IS_EN ? `Time bonus: ${timeBonus} points (try to be faster next time)` : `Laika bonuss: ${timeBonus} punkti (nākamreiz mēģini ātrāk)`);

    showScreen("final");
    resetResearchUI();
    renderSummaryMap("final", state.matchedOrder);
  }

  function googleScriptIsConfigured() {
    return GOOGLE_SCRIPT_URL && !GOOGLE_SCRIPT_URL.includes("PASTE_GOOGLE_APPS_SCRIPT_URL_HERE");
  }

  async function postToGoogleSheets(payload) {
    if (!googleScriptIsConfigured()) {
      console.info("Google Sheets submission skipped: configure GOOGLE_SCRIPT_URL in app.js.", payload);
      return;
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        keepalive: true,
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  function completedSessionPayload() {
    const payload = {
      action: "upsert_session",
      session_id: state.sessionId,
      date_time: state.completedAt,
      session_started_at: state.sessionStartedAt,
      last_updated_at: new Date().toISOString(),
      session_status: "completed",
      last_completed_round: TOTAL_ROUNDS,
    };
    for (let round = 1; round <= TOTAL_ROUNDS; round++) {
      const result = state.roundResults[round - 1] || {};
      payload[`round_${round}_time_ms`] = result.timeMs ?? "";
      payload[`round_${round}_points`] = result.points ?? "";
    }
    Object.assign(payload, {
      total_time_ms: state.finalTotalTimeMs,
      total_points: state.finalTotalPoints,
      player_agreed: state.research?.playerAgreed || "",
      question_place_name: state.research?.questionPlaceName || "",
      selected_answer: state.research?.selectedAnswer || "",
      correct_answer: state.research?.correctAnswer || "",
      answer_correct: state.research?.answerCorrect || "",
      question_response_time_ms: state.research?.responseTimeMs ?? "",
      played_again: "",
      language_version: LANG,
      game_rating: state.survey?.rating ?? "",
      age_group: state.survey?.ageGroup || "",
      first_time_player: state.survey?.firstTimePlayer || "",
      player_comment: state.survey?.comment || "",
    });
    return payload;
  }

  function progressSessionPayload(status, lastCompletedRound) {
    const payload = {
      action: "upsert_session",
      session_id: state.sessionId,
      date_time: state.completedAt || "",
      session_started_at: state.sessionStartedAt,
      last_updated_at: new Date().toISOString(),
      session_status: status,
      last_completed_round: lastCompletedRound,
      language_version: LANG,
      player_agreed: state.research?.playerAgreed || "",
      question_place_name: state.research?.questionPlaceName || "",
      selected_answer: state.research?.selectedAnswer || "",
      correct_answer: state.research?.correctAnswer || "",
      answer_correct: state.research?.answerCorrect || "",
      question_response_time_ms: state.research?.responseTimeMs ?? "",
      game_rating: state.survey?.rating ?? "",
      age_group: state.survey?.ageGroup || "",
      first_time_player: state.survey?.firstTimePlayer || "",
      player_comment: state.survey?.comment || "",
    };
    let completedTimeMs = 0;
    for (let round = 1; round <= TOTAL_ROUNDS; round++) {
      const result = state.roundResults[round - 1] || {};
      payload[`round_${round}_time_ms`] = result.timeMs ?? "";
      payload[`round_${round}_points`] = result.points ?? "";
      if (result.timeMs !== undefined) completedTimeMs += result.timeMs;
    }
    payload.total_time_ms = state.completedAt ? state.finalTotalTimeMs : completedTimeMs;
    payload.total_points = state.completedAt ? state.finalTotalPoints : state.score;
    return payload;
  }

  function queueSessionProgress(status, lastCompletedRound) {
    const payload = progressSessionPayload(status, lastCompletedRound);
    state.progressSubmissionPromise = state.progressSubmissionPromise
      .catch(() => {})
      .then(() => postToGoogleSheets(payload))
      .catch(error => console.error("Could not update Google Sheets session progress.", error));
    return state.progressSubmissionPromise;
  }

  function submitCompletedSessionOnce() {
    if (state.sessionSubmitted) return state.sessionSubmissionPromise || Promise.resolve();
    state.sessionSubmitted = true;
    state.sessionSubmissionPromise = state.progressSubmissionPromise
      .catch(() => {})
      .then(() => postToGoogleSheets(completedSessionPayload())).catch(error => {
      console.error("Could not create the Google Sheets game-session row.", error);
    });
    return state.sessionSubmissionPromise;
  }

  function resetResearchUI() {
    setResearchStage("research-invite");
    $("#research-options").replaceChildren();
    $("#survey-comment-text").value = "";
    $$(".rating-star").forEach(button => { button.disabled = false; button.classList.remove("is-selected", "is-preview"); });
    $$(".first-time-option").forEach(button => { button.disabled = false; button.classList.remove("is-selected"); });
    $("#btn-research-yes").disabled = false;
    $("#btn-research-no").disabled = false;
    $("#btn-replay").disabled = false;
  }

  function showResearchThanks(answeredQuestions = true) {
    $("#research-thanks-text").textContent = answeredQuestions
      ? (IS_EN ? "Thank you for participating and answering the questions. This will be helpful to the researchers!" : "Paldies, ka piedalījies un ka atbildēji uz jautājumiem. Pētniekiem tas noderēs!")
      : (IS_EN ? "Thank you for participating!" : "Paldies, ka piedalījies!");
    setResearchStage("research-thanks");
  }

  function setResearchStage(stageId) {
    $$(".research-stage", $("#research-panel")).forEach(stage => stage.classList.toggle("hidden", stage.id !== stageId));
  }

  function showRatingStep() {
    setResearchStage("survey-rating");
  }

  function showAgeStep() {
    const groups = [
      ["under_18", IS_EN ? "17 or younger" : "Līdz 17 gadiem"],
      ["18_24", "18–24"], ["25_34", "25–34"], ["35_44", "35–44"],
      ["45_54", "45–54"], ["55_64", "55–64"], ["65_plus", IS_EN ? "65 or older" : "65 gadi un vairāk"],
    ];
    const root = $("#age-options");
    root.replaceChildren();
    groups.forEach(([value, label]) => {
      const button = document.createElement("button");
      button.type = "button"; button.className = "age-option"; button.textContent = label;
      button.addEventListener("click", () => {
        state.survey.ageGroup = value;
        $$(".age-option", root).forEach(item => { item.disabled = true; item.classList.toggle("is-selected", item === button); });
        queueSessionProgress("survey_in_progress", TOTAL_ROUNDS);
        setTimeout(() => setResearchStage("survey-first-time"), 260);
      }, { once: true });
      root.appendChild(button);
    });
    setResearchStage("survey-age");
  }

  function answerResearchQuestion(button, selectedValue) {
    if (!state.research || state.research.answered) return;
    const rememberValue = "I don't remember";
    state.research.answered = true;
    state.research.selectedAnswer = selectedValue;
    state.research.answerCorrect = selectedValue === state.research.correctAnswer ? "Yes" : "No";
    state.research.responseTimeMs = Math.round(performance.now() - state.research.startedAt);
    $$(".research-option", $("#research-options")).forEach(option => { option.disabled = true; });
    button.classList.add(
      "selected",
      selectedValue === state.research.correctAnswer
        ? "is-correct"
        : selectedValue === rememberValue
          ? "is-unknown"
          : "is-incorrect"
    );
    queueSessionProgress("survey_in_progress", TOTAL_ROUNDS);
    setTimeout(showRatingStep, 900);
  }

  function showResearchQuestion() {
    const eligible = ALL_PAIRS.filter(pair => pair.round === 4 || pair.round === 5);
    const target = shuffle(eligible)[0];
    const distractors = shuffle([...new Set(ALL_PAIRS.map(pair => pair.liv).filter(name => name !== target.liv))]).slice(0, 2);
    const rememberValue = "I don't remember";
    const options = shuffle([
      { value: target.liv, label: target.liv },
      ...distractors.map(name => ({ value: name, label: name })),
      { value: rememberValue, label: IS_EN ? "I don't remember" : "Es neatceros" },
    ]);

    state.research = {
      playerAgreed: "Yes",
      questionPlaceName: target.lv,
      selectedAnswer: "",
      correctAnswer: target.liv,
      answerCorrect: "",
      responseTimeMs: "",
      startedAt: 0,
      answered: false,
    };
    $("#research-question-text").textContent = IS_EN
      ? `What is ${target.lv} called in Livonian?`
      : `Kā ${target.lv} būs lībiešu valodā?`;
    const optionsRoot = $("#research-options");
    optionsRoot.replaceChildren();
    options.forEach(option => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "research-option";
      button.textContent = option.label;
      button.addEventListener("click", () => answerResearchQuestion(button, option.value), { once: true });
      optionsRoot.appendChild(button);
    });
    setResearchStage("research-question");
    state.research.startedAt = performance.now();
  }

  function declineResearchQuestion() {
    $("#btn-research-yes").disabled = true;
    $("#btn-research-no").disabled = true;
    state.research = {
      playerAgreed: "No", questionPlaceName: "", selectedAnswer: "",
      correctAnswer: "", answerCorrect: "", responseTimeMs: "", answered: true,
    };
    submitCompletedSessionOnce();
    showResearchThanks(false);
  }

  $("#btn-research-yes").addEventListener("click", showResearchQuestion);
  $("#btn-research-no").addEventListener("click", declineResearchQuestion);
  $$(".first-time-option").forEach(button => {
    button.addEventListener("click", () => {
      if (state.survey.firstTimePlayer) return;
      state.survey.firstTimePlayer = button.dataset.firstTime;
      $$(".first-time-option").forEach(item => {
        item.disabled = true;
        item.classList.toggle("is-selected", item === button);
      });
      queueSessionProgress("survey_in_progress", TOTAL_ROUNDS);
      setTimeout(() => setResearchStage("survey-comment"), 260);
    });
  });
  $$(".rating-star").forEach(button => {
    const rating = Number(button.dataset.rating);
    button.addEventListener("mouseenter", () => $$(".rating-star").forEach(item => item.classList.toggle("is-preview", Number(item.dataset.rating) <= rating)));
    button.addEventListener("mouseleave", () => $$(".rating-star").forEach(item => item.classList.remove("is-preview")));
    button.addEventListener("click", () => {
      if (state.survey.rating) return;
      state.survey.rating = rating;
      $$(".rating-star").forEach(item => {
        item.disabled = true;
        item.classList.toggle("is-selected", Number(item.dataset.rating) <= rating);
      });
      queueSessionProgress("survey_in_progress", TOTAL_ROUNDS);
      setTimeout(showAgeStep, 300);
    });
  });
  $("#btn-survey-finish").addEventListener("click", () => {
    state.survey.comment = $("#survey-comment-text").value.trim();
    submitCompletedSessionOnce();
    showResearchThanks();
  });

  function resultShareText() {
    const gameUrl = `${location.href.split("#")[0]}${IS_EN ? "#en" : ""}`;
    return IS_EN
      ? `I discovered Latvian place names in Livonian and scored ${state.score} points! 🦾 Can you do better? 🎯 #LivonianPlacenames🇸🇱\n${gameUrl}`
      : `Es iepazinu Latvijas vietvārdus lībiešu valodā un ieguvu ${state.score} punktus! 🦾 Vai Tu vari labāk? 🎯 #lībiešuvietvārdi🇸🇱\n${gameUrl}`;
  }

  async function copyShareText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const helper = document.createElement("textarea");
    helper.value = text;
    helper.setAttribute("readonly", "");
    helper.style.cssText = "position:fixed;opacity:0;pointer-events:none";
    document.body.appendChild(helper);
    helper.select();
    const copied = document.execCommand("copy");
    helper.remove();
    if (!copied) throw new Error("copy failed");
  }

  async function shareResult() {
    const text = resultShareText();
    const status = $("#share-status");
    try {
      if (navigator.share) {
        await navigator.share({ text });
        status.textContent = UI.shareDone;
      } else {
        await copyShareText(text);
        status.textContent = UI.shareCopied;
      }
    } catch (error) {
      if (error && error.name === "AbortError") return;
      try {
        await copyShareText(text);
        status.textContent = UI.shareCopied;
      } catch (_) {
        status.textContent = UI.shareError;
      }
    }
  }

  function resetAll() {
    state = {
      round: 1, score: 0, totalCorrect: 0, totalAttempts: 0,
      roundAttempts: 0, roundCorrect: 0, roundStartTime: 0, roundScoreStart: 0,
      matchedIds: new Set(), matchedOrder: [], selLiv: null, selLv: null, busy: false,
      sessionId: createSessionId(), sessionStartedAt: "", roundResults: [], completedAt: "",
      finalTotalTimeMs: 0, finalTotalPoints: 0,
      research: null, survey: { rating: "", ageGroup: "", firstTimePlayer: "", comment: "" }, sessionSubmitted: false, sessionSubmissionPromise: null,
      progressSubmissionPromise: Promise.resolve(),
    };
    if (gameMap) resetGameMapMarkers();
    resetActiveTimer();
  }

  function beginNewSession() {
    markCurrentSessionAbandoned();
    resetAll();
    state.sessionStartedAt = new Date().toISOString();
    queueSessionProgress("in_progress", 0);
    startRound(1);
  }

  function markCurrentSessionAbandoned() {
    if (!state.sessionStartedAt || state.completedAt) return;
    const lastCompletedRound = state.roundResults.filter(Boolean).length;
    queueSessionProgress("abandoned", lastCompletedRound);
  }

  $("#btn-start").addEventListener("click", beginNewSession);
  $("#btn-replay").addEventListener("click", async event => {
    const button = event.currentTarget;
    if (button.disabled) return;
    button.disabled = true;
    const completedSessionId = state.sessionId;
    try {
      if (state.sessionSubmissionPromise) await state.sessionSubmissionPromise;
    } catch (error) {
      console.error("Could not finish the completed-session request before restarting.", error);
    }
    postToGoogleSheets({
      action: "update_played_again",
      session_id: completedSessionId,
      played_again: "Yes",
    }).catch(error => console.error("Could not update played_again in Google Sheets.", error));
    beginNewSession();
  });
  $("#btn-share").addEventListener("click", shareResult);
  $("#btn-restart").addEventListener("click", () => {
    if (confirm(UI.restartConfirm)) beginNewSession();
  });

  showScreen("start");
})();
