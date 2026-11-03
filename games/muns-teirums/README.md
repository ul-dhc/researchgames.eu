# Muns teirums – pilots

Atsevišķa HTML/CSS/JavaScript spēle ar 6, 8 vai 10 pāriem (noklusējumā 8). Nav Astro atkarības; gatavais `index.html` un `bundle.js` ir iekļauti mapē.

Visas 16 parauga kārtis ir iepriekš ģenerētas HTML, tāpēc to redzamība nav atkarīga no JavaScript. Pārlūks ielādē vienu parasto `defer` skriptu; nav ES moduļu pieprasījumu. Pēc izmaiņām avotos palaist `node scripts/build.mjs`. Pārnēsājamai versijai izmantot `node scripts/package.mjs /absolūts/izvades/ceļš`.

Saskarnes ikonas ir Lucide 1.8.0 SVG, ieskaitot visas bultas, atkārtošanas, aizvēršanas un atzīmes ikonas. Tās ir iekļautas lokāli; licence atrodas `assets/LUCIDE-LICENSE.txt`. RG logo ir zīmola atpazīšanas zīme.

Pamatā RG sākumlapas `js/memory-game.js` kāršu struktūra un spēles princips: 4 × 4 laukums, divu kāršu atvēršana, nesakritības aizvēršana, jaukšana un spēles rezultāts. Zaļais un krēmkrāsas noformējums pielāgots lietotājas dotajām atsaucēm.

## Saturs

Visi 37 augi, kuriem pievienotajā tīruma augu arhīvā ir zīmējums; vienā spēlē tiek izmantoti 6, 8 vai 10 no tiem. Nosaukumi no sagatavotās datu kopas `outputs/latgalian-plants-20261102/plants.json`, oriģinālais avots – lietotājas dotais DOCX saraksts. Variantu secība saglabāta. Ekrānattēlu papildu varianti un literārie citāti nav pārņemti.

Attēli no lietotājas `Teiruma_augi.zip`. Izveidoti apgriezti WebP atvasinājumi ar caurspīdīgu fonu; oriģināli nav mainīti. Māksliniece – Līga Romančuka; kredīts ar Instagram saiti norādīts sadaļā “Par spēli”. Gala nosaukumu redakcija vēl jāsaskaņo ar datu turētāju.

## Krāsa

Trejkrāsu atraitnītes violetajos laukumos atlasīti necaurspīdīgi pikseļi ar HSV nokrāsu 0.72–0.89, piesātinājumu virs 0.25 un vērtību 0.22–0.70. RGB kanālu mediāna: `#5C3B66`. Saskarnes gaišais akcents `#D4B2E4` ir izvēlēta gaišināta interpretācija. RG vienkrāsas ikona adaptēta no esošās RG SVG ģeometrijas.

## Laiks un punkti

Pulksteņa un zvaigznes Lucide pogas neatkarīgi ieslēdz laika un punktu skaitīšanu. Noklusējumā abas opcijas ir ieslēgtas. Punktu, gājienu un laika lauki parādās tikai atbilstoši izvēlei; atrasto pāru progress paliek redzams. Mainot opcijas jau sāktā spēlē vai galerijā, sākas jauns tīrums.

- Bez abām opcijām: netiek rādīts vērtējums vai laiks, arī beigu galerijā.
- Tikai laiks: pulkstenis sākas ar pirmās kārts atvēršanu un apstājas pie pēdējā pāra; punktu nav.
- Tikai punkti: `max(0, 100 × atrastie pāri − 10 × nesakritības)`. Maksimums 600, 800 vai 1000.
- Abi: iepriekšējai formulai spēles beigās pievieno `max(0, 25 × pāru skaits − floor(aktīvās sekundes / 2))`. Maksimums 750, 1000 vai 1250. Soda punkti netiek dzēsti, pirms pielikts bonuss. Rezultāts nevar būt negatīvs.

Laiks apstājas, kad lapa nav redzama vai atvērts apraksta dialogs. Nesakritība ir redzama 0.9 sekundes; vienas kārts atkārtots klikšķis nav jauns gājiens. Punktu formula ir izskaidrota dialogā atbilstoši ieslēgtajām opcijām; sākumlapā nav punktu skaidrojuma vai kāršu skaita/ilguma kopsavilkuma.

Spēle neraksta datus serverī. Beigu galerija satur attiecīgās spēles augus, to nosaukumus un saites uz Tēzauru. Saskarne latviski; latgaliskie nosaukumi atzīmēti ar `lang="ltg"`.

## Pārbaude

No šīs mapes: `node --test tests/game-model.test.mjs`.
Priekšskatījumam: palaist statisku HTTP serveri repo saknē un atvērt `/games/muns-teirums/`.

## Mainīga pļava

Katrā spēlē izlozē izvēlētos 6, 8 vai 10 atšķirīgus augus no visiem 37 pieejamajiem zīmējumiem. Iepriekšējās izlases ID saglabājas pārlūkā; nākamā izlase nedrīkst būt pilnīgi identiska. Ja pārlūka krātuve nav pieejama, atšķirība tiek saglabāta vienas lapas sesijas ietvaros. Kāršu izvietojums tiek sajaukts atsevišķi.

Pēc spēles spēles laukuma un kreisā ievada vietā automātiski atveras pilna platuma “Muns teirums” ar izvēlētajiem augiem, latgaliskajiem variantiem un latviskajiem nosaukumiem. Galerijas kartītes parādās ar maigu, secīgu animāciju; `prefers-reduced-motion` to atslēdz. Statistika spēles laikā atrodas zem kārtīm un ir redzama jau sākumā.

Pilna papildinformācija ir tikai trim lietotājas pievienotajām lapām: asinszālei, parastajam biškrēsliņam un lielajai ceļtekai. Angļu, vācu un poļu nosaukumi transkribēti tieši no šīm lapām, bez tulkošanas vai citiem nosaukumu avotiem. Faktu tekstu vietā dotas tiešas saites uz Latvijas dabas aprakstiem un Tēzauru. Asinszāles lapā dotā ģints `Hypericum sp.` netiek sašaurināta līdz sugai; Latvijas dabas saite ved uz divšķautņu asinszāles aprakstu. Pārējiem augiem papildu valodu lauki un fakti nav aizpildīti.

“Kopēt rezultātu” izmanto starpliktuvi, ar rezerves kopēšanas metodi un redzamu rezultāta tekstu. Teksts sākas ar “Munā teirumā aug …”; tas pievieno tikai ieslēgtos laika un punktu rādītājus.

## Pāru skaita izvēle

Labajā pusē augšā pieejami 6, 8 un 10 pāri; katras lapas ielādes noklusējums ir 8 pāri (16 kārtis). Mainot izvēli jau sāktā spēlē, sākas jauns tīrums. 10 pāru spēle datorā izmanto 5 kolonnas un 4 rindas; mobilajā skatā 4 kolonnas un 5 rindas. Atrasto pāru progresa punktiņi ir noņemti.

Poga “Izlaist spēli” secīgi atver atlasītās pļavas kārtis ar 145 ms soli un 850 ms apgriešanās animāciju; pēc īsas pauzes atveras augu galerija. Atkārtota pogas nospiešana atklāšanas laikā ir bloķēta; sākot jaunu spēli, iepriekšējās pārejas tiek atceltas. Samazinātu kustību režīmā kārtis atveras bez animācijas. Izlaižot spēli, galerijā un kopējamajā tekstā nerāda punktus vai laiku.

## Latvijas dabas saites

Visiem 37 spēles augiem pievienota Latvijas dabas saite. Publiskās mērķlapas un to virsraksti pārbaudīti 2026-11-03; saišu atbilstība dokumentēta `latvijas-daba-links.json`. Gandrenei, grīslim, nārbulim, mārsilam, spilvei un zvagulim avotā nav konkrētas sugas, tāpēc saite ved uz atbilstošās dzimtas sugu sarakstu. Saišu pievienošana nepapildina svešvalodu nosaukumus – tie joprojām ir tikai trim lietotājas pievienotajām lapām.

Kopēšanas poga ir neuzkrītošs teksts ar Lucide ikonu. Atvērtās kārtis pirms galerijas maigi izbalē 1.5 sekundēs; galerija parādās pakāpeniski ar 1.9 sekunžu animāciju katrai kartītei un 110 ms nobīdi. Samazinātu kustību iestatījums saglabāts.

Poga “A+” galvenē pārslēdz lasāmo tekstu uz 120% izmēru un atpakaļ; izvēle saglabājas pārlūkā. Spēle un tās rezultāts netiek atiestatīti. Jau lielie virsraksti saglabā sākotnējo izmēru. A+ maina tikai fontu izmērus; režģa un kāršu ģeometrija saglabājas.

Informācijas logu var aizvērt arī ar klikšķi ārpus tā. Galerijas kārtīm ir viegls pacēlums uz peles uzvedināšanu; samazinātu kustību režīmā tas ir izslēgts.

## Latgaliskā saskarne

Saskarnē izmantots 61 lietotājas aizpildītais tulkojums no `Muns_teirums_saskarnes_teksti_LV_LTG.docx`. `translations.mjs` saglabā abu aiļu tekstus un stabilos ierakstu ID; tukšiem tulkojumiem paliek dokumentā dotais latviskais teksts. Augu nosaukumi un svešvalodu datu lauki nav pārveidoti. Pārdēvētie vietturi `{augu skaits}` un `{vuords}` sasaistīti ar augu skaitu un nosaukumu. Laika un punktu teksti izmanto tieši dokumentā norādītās formas. Statiskā sākumlapa un parastais skripts tiek veidoti no viena teksta avota.
