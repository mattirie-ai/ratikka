// Välityspalvelin Digitransit-rajapintaan. Avain luetaan Netlifyn ympäristömuuttujasta
// DIGITRANSIT_KEY, joten se ei koskaan päädy selaimelle.
const ENDPOINT = "https://api.digitransit.fi/routing/v2/waltti/gtfs/v1";

// Vain nämä pysäkit sallitaan, jotta funktiota ei voi käyttää yleisenä välityspalvelimena.
const SALLITUT = ["etelä-hervanta", "tulli", "tuulensuu", "pyynikintori","hervantajärvi"];

const KYSELY = `query($n:String!){
  stops(name:$n){
    gtfsId name vehicleMode
    stoptimesWithoutPatterns(numberOfDepartures:20, omitNonPickups:true){
      serviceDay scheduledDeparture realtimeDeparture realtime
      trip{ route{ shortName mode } stoptimes{ stop{ name } } }
    }
  }
}`;

const json = (data, status = 200, extra = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...extra },
  });

export default async (req) => {
  const avain = process.env.DIGITRANSIT_KEY;
  if (!avain) return json({ virhe: "Palvelimelta puuttuu rajapinta-avain (DIGITRANSIT_KEY)." }, 500);

  const pysakki = (new URL(req.url).searchParams.get("pysakki") || "").trim();
  if (!SALLITUT.includes(pysakki.toLowerCase()))
    return json({ virhe: "Pysäkki ei ole sallittujen listalla." }, 400);

  let r;
  try {
    r = await fetch(ENDPOINT, {
      method: "POST",
      signal: AbortSignal.timeout(8000),
      headers: { "Content-Type": "application/json", "digitransit-subscription-key": avain },
      body: JSON.stringify({ query: KYSELY, variables: { n: pysakki } }),
    });
  } catch {
    return json({ virhe: "Digitransit ei vastannut." }, 502);
  }
  if (r.status === 401 || r.status === 403) return json({ virhe: "Rajapinta-avain ei kelpaa." }, 502);
  if (!r.ok) return json({ virhe: "Haku epäonnistui (HTTP " + r.status + ")." }, 502);

  let j;
  try { j = await r.json(); }
  catch { return json({ virhe: "Digitransitin vastausta ei voitu lukea." }, 502); }
  if (j.errors) return json({ virhe: j.errors[0].message }, 502);

  const norm = (x) => (x || "").toLowerCase().normalize("NFC").replace(/\s+/g, " ").trim();
  const haku = norm(pysakki);
  const kaikki = j.data?.stops || [];
  const pysakit = kaikki.filter((s) =>
    /tampere/i.test(s.gtfsId) && norm(s.name).startsWith(haku) &&
    (s.vehicleMode === "TRAM" ||
     (s.stoptimesWithoutPatterns || []).some((st) => st.trip?.route?.mode === "TRAM")));
  if (new URL(req.url).searchParams.has("debug"))
    return json({ haku: pysakki, kaikki: kaikki.map((s) => ({ id: s.gtfsId, nimi: s.name, muoto: s.vehicleMode })) });
  // Lyhyt välimuisti vähentää rajapintakutsuja, kun sivua käyttää moni yhtä aikaa.
  return json({ pysakit }, 200, { "Cache-Control": "public, max-age=15" });
};

export const config = { path: "/api/lahdot" };
