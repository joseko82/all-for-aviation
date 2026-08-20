/**
 * Pure-logic tests. No browser, no network, no test framework.
 *
 * Run with:  npm run test:unit
 * That transpiles the two modules under test into .test-build/ first.
 */
const assert = require('assert');
const path = require('path');
const R = (m) => require(path.join(__dirname, '..', '.test-build', m));
const { pickCurrentLeg } = R('route.js');
const { computeStreak, computeStats, recordSighting, recordVisit, localDay } = R('logbook.js');

let pass = 0;
const ok = (name, fn) => { fn(); pass++; console.log('  ok -', name); };

const ADD = { name:'Addis', icao:'HAAB', iata:'ADD', location:'Addis Ababa', countryiso2:'ET', lat:8.9779, lon:38.7993 };
const ICN = { name:'Incheon', icao:'RKSI', iata:'ICN', location:'Seoul', countryiso2:'KR', lat:37.4691, lon:126.4510 };
const NRT = { name:'Narita', icao:'RJAA', iata:'NRT', location:'Tokyo', countryiso2:'JP', lat:35.7647, lon:140.3863 };

console.log('pickCurrentLeg');
ok('two-airport route returns the only leg', () => {
  const leg = pickCurrentLeg([ADD, ICN], { lat: 20, lon: 80 });
  assert.strictEqual(leg.from.iata, 'ADD');
  assert.strictEqual(leg.to.iata, 'ICN');
  assert.strictEqual(leg.total, 1);
});
ok('over the Yellow Sea on ADD-ICN-NRT picks ADD->ICN', () => {
  const leg = pickCurrentLeg([ADD, ICN, NRT], { lat: 36.5, lon: 123.0 });
  assert.strictEqual(leg.from.iata, 'ADD');
  assert.strictEqual(leg.to.iata, 'ICN');
  assert.strictEqual(leg.index, 0);
  assert.strictEqual(leg.total, 2);
});
ok('east of Seoul on ADD-ICN-NRT picks ICN->NRT', () => {
  const leg = pickCurrentLeg([ADD, ICN, NRT], { lat: 36.6, lon: 133.0 });
  assert.strictEqual(leg.from.iata, 'ICN');
  assert.strictEqual(leg.to.iata, 'NRT');
  assert.strictEqual(leg.index, 1);
});
ok('missing or single-airport route returns null', () => {
  assert.strictEqual(pickCurrentLeg(undefined, { lat: 0, lon: 0 }), null);
  assert.strictEqual(pickCurrentLeg([ICN], { lat: 0, lon: 0 }), null);
});

console.log('computeStreak');
const day = (offset) => localDay(Date.now() + offset * 86400000);
ok('no days = 0', () => assert.strictEqual(computeStreak([], Date.now()), 0));
ok('today only = 1', () => assert.strictEqual(computeStreak([day(0)], Date.now()), 1));
ok('three consecutive ending today = 3', () =>
  assert.strictEqual(computeStreak([day(-2), day(-1), day(0)].sort(), Date.now()), 3));
ok('streak survives if last visit was yesterday', () =>
  assert.strictEqual(computeStreak([day(-2), day(-1)].sort(), Date.now()), 2));
ok('gap breaks the streak', () =>
  assert.strictEqual(computeStreak([day(-9), day(-8)].sort(), Date.now()), 0));
ok('non-consecutive run only counts the tail', () =>
  assert.strictEqual(computeStreak([day(-9), day(-1), day(0)].sort(), Date.now()), 2));

console.log('logbook accounting');
ok('same airframe twice increments count, not planes', () => {
  const a = { id:'71be42', cs:'KAL017', reg:'HL7642', type:'B748', lat:37, lon:126, alt:35000, ground:false, gs:480, trk:90, vr:0, cat:'A5' };
  let b = recordVisit({ v:1, sightings:{}, days:[], badges:{} });
  b = recordSighting(b, a);
  b = recordSighting(b, { ...a, alt: 41000, gs: 560 });
  const s = computeStats(b);
  assert.strictEqual(s.planes, 1);
  assert.strictEqual(s.sightings, 2);
  assert.strictEqual(s.highestAlt, 41000);
  assert.strictEqual(s.fastest, 560);
  assert.deepStrictEqual(s.airlines, ['KAL']);
  assert.deepStrictEqual(s.countries, ['KR']);
});
ok('cargo operator is detected', () => {
  let b = { v:1, sightings:{}, days:[], badges:{} };
  b = recordSighting(b, { id:'a1', cs:'FDX5', reg:'N1', type:'B77L', lat:0, lon:0, alt:30000, ground:false, gs:400, trk:0, vr:0, cat:'A5' });
  assert.strictEqual(computeStats(b).cargoSeen, true);
});
ok('callsign without airline prefix is tolerated', () => {
  let b = { v:1, sightings:{}, days:[], badges:{} };
  b = recordSighting(b, { id:'a2', cs:'', reg:'HL8888', type:'A320', lat:0, lon:0, alt:1000, ground:false, gs:200, trk:0, vr:0, cat:'A3' });
  const s = computeStats(b);
  assert.strictEqual(s.planes, 1);
  assert.deepStrictEqual(s.airlines, []);
});
ok('recordVisit is idempotent within a day', () => {
  let b = { v:1, sightings:{}, days:[], badges:{} };
  b = recordVisit(b); b = recordVisit(b); b = recordVisit(b);
  assert.strictEqual(b.days.length, 1);
});

console.log(`\n${pass} assertions passed`);

// --- phase 3 additions ------------------------------------------------------
const { recordQuiz } = R('logbook.js');
console.log('\nquiz accounting');
ok('a perfect score marks the card passed', () => {
  let b = { v:2, sightings:{}, days:[], badges:{}, quizzes:{} };
  b = recordQuiz(b, 'wing-lift', 3, 3);
  const s = computeStats(b);
  assert.strictEqual(s.cardsPassed, 1);
  assert.strictEqual(s.quizCorrect, 3);
  assert.strictEqual(s.cardsTried, 1);
});
ok('a worse retry never lowers the recorded best', () => {
  let b = { v:2, sightings:{}, days:[], badges:{}, quizzes:{} };
  b = recordQuiz(b, 'wing-lift', 3, 3);
  b = recordQuiz(b, 'wing-lift', 1, 3);
  assert.strictEqual(b.quizzes['wing-lift'].best, 3);
  assert.strictEqual(computeStats(b).cardsPassed, 1);
});
ok('an improved retry does update the best', () => {
  let b = { v:2, sightings:{}, days:[], badges:{}, quizzes:{} };
  b = recordQuiz(b, '747-hump', 1, 3);
  assert.strictEqual(computeStats(b).cardsPassed, 0);
  b = recordQuiz(b, '747-hump', 3, 3);
  assert.strictEqual(computeStats(b).cardsPassed, 1);
});
ok('a v1 logbook migrates without losing sightings', () => {
  const { load } = R('logbook.js');
  const store = {};
  global.window = { localStorage: {
    getItem: (k) => store[k] ?? null,
    setItem: (k, v) => { store[k] = v; },
  }};
  store['afa.logbook.v1'] = JSON.stringify({
    v: 1,
    sightings: { abc: { id:'abc', reg:'HL7642', type:'B748', cs:'KAL017', airline:'KAL', first:1, last:1, count:4, maxAlt:38000, maxGs:500 } },
    days: ['2026-08-19'],
    badges: { first_spot: 1 },
  });
  const migrated = load();
  assert.strictEqual(migrated.v, 2);
  assert.strictEqual(Object.keys(migrated.sightings).length, 1);
  assert.strictEqual(migrated.sightings.abc.count, 4);
  assert.strictEqual(migrated.badges.first_spot, 1);
  assert.deepStrictEqual(migrated.quizzes, {});
  delete global.window;
});
console.log(`\n${pass} assertions passed in total`);
