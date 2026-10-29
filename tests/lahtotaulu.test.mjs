import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const html = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1].split('tikitys(); paivita();')[0];
function board() {
  const elements = Object.fromEntries(['board', 'updated', 'clock'].map(id => [id, {
    innerHTML: '', textContent: '', parentElement: { classList: { toggle() {} } }
  }]));
  const ctx = vm.createContext({ Date, AbortSignal, document: { hidden: false, getElementById: id => elements[id] } });
  vm.runInContext(script, ctx);
  return { ctx, elements, run: code => vm.runInContext(code, ctx) };
}

test('Menneet lähdöt poistuvat, suunta ja reaaliaika suodattuvat oikein myös yli vuorokauden', () => {
  const b = board();
  b.ctx.now = Date.now() / 1000;
  const result = b.run(`suodata([{stoptimesWithoutPatterns: [
    {serviceDay: now - 90000, scheduledDeparture: 90060, realtimeDeparture: 90120, realtime: true, trip: {route:{shortName:'3'}, stoptimes:[{stop:{name:'Hervantajärvi'}},{stop:{name:'Sorin aukio'}}]}},
    {serviceDay: now, scheduledDeparture: -1, realtime: false, trip: {route:{shortName:'3'}, stoptimes:[{stop:{name:'Hervantajärvi'}},{stop:{name:'Sorin aukio'}}]}},
    {serviceDay: now, scheduledDeparture: 60, realtime: false, trip: {route:{shortName:'3'}, stoptimes:[{stop:{name:'Sorin aukio'}},{stop:{name:'Hervantajärvi'}}]}}
  ]}], REITIT[0])`);
  assert.equal(result.length, 1);
  assert.equal(result[0].t, b.ctx.now + 120);
});

test('Alle minuutin lähtö ja vanhentunut tieto näkyvät yksiselitteisesti', () => {
  const b = board();
  b.run(`tulokset[0] = {lahdot:[{t:Date.now()/1000+40, rt:true}], haettu:Date.now()-100000, virhe:null}; piirra()`);
  assert.match(b.elements.board.innerHTML, /&lt;1<small>min/);
  assert.match(b.elements.board.innerHTML, /Vanhentunut tieto/);
});

test('Epäonnistunut päivitys säilyttää tiedot ja viimeisen onnistumisajan', async () => {
  const b = board();
  b.run(`tulokset[0] = {lahdot:[{t:Date.now()/1000+600, rt:true}], haettu:1234, virhe:null}`);
  b.ctx.fetch = async () => { throw new Error('offline'); };
  await b.run('paivita()');
  assert.equal(b.run('tulokset[0].haettu'), 1234);
  assert.equal(b.run('tulokset[0].lahdot.length'), 1);
  assert.match(b.elements.updated.textContent, /eivät ole ajan tasalla/);
});

test('Päällekkäinen tai piilotetun sivun haku ei käynnisty', async () => {
  const b = board();
  let calls = 0;
  b.ctx.fetch = async () => { calls++; return {ok:true, json: async () => ({pysakit:[]})}; };
  await Promise.all([b.run('paivita()'), b.run('paivita()')]);
  assert.equal(calls, 4);
  b.ctx.document.hidden = true;
  await b.run('paivita()');
  assert.equal(calls, 4);
});
