# Muns teirums publiskās palaišanas kontrolsaraksts

Pirms spēles publiskas izziņošanas:

- [ ] No `index.html` noņemt spēles `<meta name="robots" content="noindex, nofollow">` un ar to saistīto priekšskatījuma komentāru. Statistikas lapu `noindex` saglabāt.
- [ ] No `index.html` noņemt `preview-locked` klasi, `#preview-access` sadaļu un `preview-access.js` skriptu. Spēles satura elementiem noņemt arī `data-preview-background`, `inert` un ar paroles aizsegu saistītos `aria-hidden="true"` atribūtus. Noņemt arī šī skripta versijas veidošanu `scripts/build.mjs` un iekļaušanu `scripts/package.mjs`, kā arī paroles ekrāna stilus.
- [ ] Atjaunināt priekšskatījuma statusu `README.md`.
- [ ] Palaist `node scripts/build.mjs` un `node --test tests/*.test.mjs`.
- [ ] Jaunā pārlūka sesijā pārbaudīt, ka spēle ir redzama uzreiz bez paroles un spēles lapai vairs nav `noindex`.
- [ ] Saņemt datu turētājas apstiprinājumu publiskai palaišanai.
- [ ] Publicēt tikai pēc lietotājas norādes, ievērojot prasību pirms push sagaidīt nākamo ziņu.

Paroles ekrāns ir vienkāršs pārlūka priekšskatījuma ierobežojums, nevis privāta failu glabāšana. HTML, JavaScript un zīmējumi joprojām ir atrodami publiskajā repozitorijā. Paroles pārbaude glabā tikai kontrolsummu; atvērtā piekļuve saglabājas `sessionStorage` konkrētajā cilnē. `noindex` kļūst aktīvs tikai pēc lapas publicēšanas un meklētāja atkārtotas apmeklēšanas.
