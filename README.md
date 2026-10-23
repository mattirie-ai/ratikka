# Seuraava ratikka

Tampereen ratikan seuraavat lähdöt (Digitransit). Rajapinta-avain on Netlifyn
ympäristömuuttujassa DIGITRANSIT_KEY eikä näy sivun käyttäjille.

Rakenne:
- public/index.html – sivu
- netlify/functions/lahdot.mjs – välityspalvelin osoitteessa /api/lahdot
- netlify.toml – Netlifyn asetukset

Paikallinen testaus: `npm i -g netlify-cli`, sitten `netlify dev` (avain tiedostoon .env: DIGITRANSIT_KEY=...).
