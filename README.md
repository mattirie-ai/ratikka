# Seuraava ratikka

Tampereen ratikan seuraavat lähdöt (Digitransit). Rajapinta-avain on Netlifyn
ympäristömuuttujassa DIGITRANSIT_KEY eikä näy sivun käyttäjille.

Rakenne:
- public/index.html – sivu
- netlify/functions/lahdot.mjs – välityspalvelin osoitteessa /api/lahdot
- netlify.toml – Netlifyn asetukset

Paikallinen testaus: `npm i -g netlify-cli`, sitten `netlify dev` (avain tiedostoon .env: DIGITRANSIT_KEY=...).

## Versiot ja palautus

Ennen selkeytystä tallennettu versio: `346161605c92e4ecbb90acf7f0aa1c455636410e`.
GitHubissa sitä säilyttää haara `backup/ennen-selkeytysta-2026-10-29`.
Paikallisessa kopiossa on lisäksi tunniste `v1.0-ennen-selkeytysta` ja
repositorion vieressä koko aiemman historian sisältävä `ratikka-ennen-selkeytysta.bundle`.
Bundlea ei tallenneta repositorioon. Sen voi palauttaa komennolla
`git clone ratikka-ennen-selkeytysta.bundle ratikka-palautus`.

Muutokset tehdään kehityshaaraan ja tarkistetaan pull requestissa ennen
main-haaraan yhdistämistä. Jos Netlify Deploy Preview on käytössä,
tarkistetaan myös puhelimen näkymä ja lähdöt esikatselussa. Julkaisun jälkeen
main-haaran hyväksytty commit merkitään uudella versiotunnisteella.
Tarvittaessa julkaistu muutos perutaan `git revert` -commitilla.

Netlifyn ympäristömuuttujat eivät sisälly varmuuskopioon. Säilytä
DIGITRANSIT_KEY erikseen salaisuuksien hallinnassa, älä Gitissä.

## Testit

Node.js 22 tai uudempi: `node --test tests/*.test.mjs`.
Testit käyttävät keinotekoista lähtödataa eivätkä tarvitse rajapinta-avainta.
