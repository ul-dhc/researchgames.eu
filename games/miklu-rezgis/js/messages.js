import { LEVEL_BASE, MODE_NAMES } from './constants.js';

export const LEVEL_MSGS = {
  1:{excellent:"Lielisks sākums! Tu atrisināji gandrīz visas vai visas mīklas un uzreiz parādīji īstu attapību.",good:"Labs sākums! Daļa mīklu jau ir pieveikta, un tavs prāts ir gatavs nākamajam izaicinājumam.",try:"Pirmais līmenis ir tikai iesildīšanās. Pat ja šoreiz neizdevās daudz, nākamās mīklas dos jaunu iespēju!"},
  2:{excellent:"Brīnišķīgi! Tu mini droši un vērīgi, un tautas mīklu viltības tevi nemaz nebiedē.",good:"Ļoti labi! Tu jau sāc pamanīt pavedienus un atkost mīklu noslēpumus.",try:"Šīs mīklas nemaz nebija tik vieglas, bet nepadodies – ar katru līmeni attapība aug."},
  3:{excellent:"Malacis! Tu lieliski atpazīsti seno gudrību noslēpumus un dodies uz priekšu pārliecinoši.",good:"Lieliski! Tu atrisināji vairākas mīklas un parādīji, ka proti domāt radoši.",try:"Dažām mīklām atminējumi bija tiešām izaicinoši. Dodies uz priekšu bez raizēm – arī minēšanas process ir daļa no prieka!"},
  4:{excellent:"Teicami! Tavs prāts ir ass, un atbildes birst kā graudi no labi izkulta rudzu kūļa.",good:"Lieliski! Pat sarežģītākās mīklās Tev izdodas atrast pareizo virzienu.",try:"Nebēdā! Arī neatminēta mīkla māca domāt gudrāk un uzmanīgāk."},
  5:{excellent:"Puse ceļa pieveikta izcili! Tu mini veikli, droši un ar īstu tautas attapības garu.",good:"Puse spēles jau pieveikta! Tu krāj punktus, pieredzi un topi viedāks un viedāks.",try:"Puse ceļa vēl nav beigas. Saņemies – otrajā pusē vari krietni atspēlēties!"},
  6:{excellent:"Brīnišķīgi! Tu atrisināji lielāko daļu mīklu un pierādīji, ka Tava attapība kļūst arvien jaudīgāka.",good:"Labs veikums! Šis līmenis nebija viegls, bet Tu neatlaidīgi tiki galā ar vairākām mīklām.",try:"Šis līmenis bija ciets rieksts. Bet katrs rieksts reiz padodas pacietīgam minētājam!"},
  7:{excellent:"Iespaidīgi! Tu mini kā īsts meistars un neļauj mīklām sevi apvest ap stūri.",good:"Ļoti pieklājīgs veikums! Tu atradi vairākas pareizās atbildes, pat ja mīklas ir vēl sarežģītākas.",try:"Šoreiz mīklas lika pasvīst. Neapstājies – vēl ir iespēja uzlabot rezultātu!"},
  8:{excellent:"Tu esi ļoti tuvu meistara līmenim! Tavas atbildes rāda gan vērīgumu, gan attapību.",good:"Labs sniegums! Tu jau esi ticis tālu, un katra atminētā mīkla ved tuvāk finišam.",try:"Vēl mazliet pacietības! Jo tuvāk beigām, jo mīklas kļūst viltīgākas."},
  9:{excellent:"Gandrīz galā, un Tava attapība spīguļot spīguļo! Jau tagad Tev pienākas uzslavas.",good:"Tu esi gandrīz finišā! Vairākas mīklas izdevās atrisināt, un tas tiešām ir labs panākums.",try:"Šis bija nopietns pārbaudījums. Neļauj grūtībām apturēt Tavu aizrautību!"},
  10:{excellent:"Apsveicam! Tu izgāji pēdējo līmeni izcili un pierādīji, ka esi īsts tautas gudrības zinātājs.",good:"Apsveicam! Tu esi ticis līdz galam un godam pabeidzis latviešu tautas mīklu spēli.",try:"Ceļš ir pabeigts! Pat ja pēdējais līmenis bija grūts, katra mīkla deva pieredzi nākamajam mēģinājumam."},
};

export const FINAL_TITLES = [
  {pct:0,   title:"Pastarītis",          msg:"Tu vēl tikai sāc iepazīt latviešu tautas mīklu viltības. Katra atminēta mīkla ir solis uz priekšu. Nepadodies!"},
  {pct:20,  title:"Stiprais Ansis",      msg:"Tu jau sāc uztvert latviešu tautas mīklu viltības. Spēka Tev daudz, un gan jau arī attapība vairosies. Turpini un Tev izdosies!"},
  {pct:40,  title:"Gudrais zellis",      msg:"Labs rezultāts! Mīklu minēšanas amats Tev jau ir rokā. Turpini minēt, kamēr kļūsti par īstu meistaru!"},
  {pct:60,  title:"Apķērīgais ganuzēns", msg:"Ļoti labi! Tu vari lepoties ar savu attapību. Tev izdevās pieveikt patiešām lielu daļu mīklu."},
  {pct:75,  title:"Gudrā ķēniņa meita",  msg:"Izcili! Tavas mīklu minēšanas prasmes ir lieliskas, un Tu proti atrast atbildes pat visviltīgākajām mīklām."},
  {pct:90,  title:"Attapīgais Mačatiņš", msg:"Neviena mīkla Tev nav par grūtu un apvest ap stūri Tu varētu ikvienu, un zupu spētu izvārīt pat no cirvja kāta. Apsveicam! Tu esi sasniedzis augstāko iespējamo mīklu attapības pakāpi."},
];

export function getFinalTitle(score, maxScore) {
  const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
  let result = FINAL_TITLES[0];
  for (const t of FINAL_TITLES) {
    if (pct >= t.pct) result = t;
  }
  return result;
}

export function getLevelRating(level, levelScore, riddlesPerLevel) {
  const max = LEVEL_BASE[level] * riddlesPerLevel;
  const ratio = max > 0 ? levelScore / max : 0;
  if (ratio >= 0.7) return 'excellent';
  if (ratio >= 0.4) return 'good';
  return 'try';
}

export function getLevelMsg(level, rating) {
  const m = LEVEL_MSGS[level];
  if (rating === 'excellent') return { badge: 'Izcili ✦', msg: m.excellent };
  if (rating === 'good') return { badge: 'Labi', msg: m.good };
  return { badge: 'Mēģini vēl', msg: m.try };
}

export function modeLabel(mode) {
  const riddleCounts = { 10: 10, 50: 50, 100: 100 };
  return `${MODE_NAMES[mode]} (${riddleCounts[mode]} mīklas)`;
}

export function generateShareText(score, maxScore, title, mode) {
  return `🏆 Esmu latviešu tautas mīklu minētājs\n\n✨ ${title.toUpperCase()} ✨\n\n🌿 ${score.toLocaleString('lv-LV')} / ${maxScore.toLocaleString('lv-LV')} punkti\nSpēles variants: ${modeLabel(mode)}\n\n😎 Vai Tu vari labāk?\nhttps://researchgames.eu/games/miklu-rezgis/\n#mīklurežģis`;
}
