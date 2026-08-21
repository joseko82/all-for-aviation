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
ok('a v1 logbook migrates to the current version without losing sightings', () => {
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
  assert.strictEqual(migrated.v, 3);
  assert.strictEqual(Object.keys(migrated.sightings).length, 1);
  assert.strictEqual(migrated.sightings.abc.count, 4);
  assert.strictEqual(migrated.badges.first_spot, 1);
  assert.deepStrictEqual(migrated.quizzes, {});
  assert.deepStrictEqual(migrated.games, { played: 0, best: 0, lastAt: 0 });
  delete global.window;
});
// --- game -------------------------------------------------------------------
const { buildGame, scoreDistance, scoreAircraft, isDistinguishable, ROUNDS_PER_GAME } = R('game.js');
const { recordGame } = R('logbook.js');

console.log('\nguessing game');
ok('a game has five rounds: three aircraft, two airports', () => {
  const rounds = buildGame(12345);
  assert.strictEqual(rounds.length, ROUNDS_PER_GAME);
  assert.strictEqual(rounds.filter(r => r.kind === 'aircraft').length, 3);
  assert.strictEqual(rounds.filter(r => r.kind === 'airport').length, 2);
});
ok('every aircraft round offers the correct answer among its options', () => {
  for (const seed of [1, 7, 99, 4242, 777777]) {
    for (const r of buildGame(seed).filter(x => x.kind === 'aircraft')) {
      assert.ok(r.options.some(o => o.code === r.answer.code), 'answer missing from options');
      const codes = r.options.map(o => o.code);
      assert.strictEqual(new Set(codes).size, codes.length, 'duplicate option');
      assert.ok(r.options.length >= 3 && r.options.length <= 4, 'option count ' + r.options.length);
    }
  }
});
ok('no aircraft round offers two look-alike silhouettes', () => {
  for (let seed = 1; seed <= 60; seed++) {
    for (const r of buildGame(seed * 104729).filter(x => x.kind === 'aircraft')) {
      for (const o of r.options) {
        if (o.code === r.answer.code) continue;
        assert.ok(
          isDistinguishable(o, r.answer),
          `${o.code} is indistinguishable from ${r.answer.code}`,
        );
      }
    }
  }
});
ok('the two airports in a game are never the same', () => {
  for (const seed of [1, 7, 99, 4242, 777777]) {
    const ap = buildGame(seed).filter(r => r.kind === 'airport');
    assert.notStrictEqual(ap[0].answer.iata, ap[1].answer.iata);
  }
});
ok('the same seed always builds the same game', () => {
  const a = buildGame(2024).map(r => r.kind === 'airport' ? r.answer.iata : r.answer.code);
  const b = buildGame(2024).map(r => r.kind === 'airport' ? r.answer.iata : r.answer.code);
  assert.deepStrictEqual(a, b);
});
ok('different seeds usually build different games', () => {
  const seen = new Set();
  for (let s = 1; s <= 40; s++) {
    seen.add(buildGame(s * 7919).map(r => r.kind === 'airport' ? r.answer.iata : r.answer.code).join('|'));
  }
  assert.ok(seen.size > 30, 'only ' + seen.size + ' distinct games from 40 seeds');
});

console.log('\nscoring');
const ICN_PT = { lat: 37.4691, lon: 126.4510 };
ok('a bullseye scores the maximum', () => {
  const r = scoreDistance(ICN_PT, ICN_PT);
  assert.strictEqual(r.score, 1000);
  assert.strictEqual(r.correct, true);
  assert.strictEqual(r.distanceKm, 0);
});
ok('score falls off with distance but never goes negative', () => {
  const near = scoreDistance({ lat: 37.6, lon: 127.0 }, ICN_PT);
  const mid = scoreDistance({ lat: 35.55, lon: 139.78 }, ICN_PT);   // Tokyo
  const far = scoreDistance({ lat: 40.64, lon: -73.78 }, ICN_PT);   // New York
  assert.ok(near.score > mid.score, 'near should beat mid');
  assert.ok(mid.score > far.score, 'mid should beat far');
  assert.ok(far.score >= 0, 'never negative');
  assert.ok(mid.score > 0, 'a same-region guess should still earn points');
});
ok('a guess on the right continent still earns something', () => {
  const shanghai = scoreDistance({ lat: 31.14, lon: 121.8 }, ICN_PT);
  assert.ok(shanghai.score > 200, 'got ' + shanghai.score);
});
ok('aircraft rounds are all-or-nothing', () => {
  assert.strictEqual(scoreAircraft('B748', 'B748').score, 1000);
  assert.strictEqual(scoreAircraft('A320', 'B748').score, 0);
  assert.strictEqual(scoreAircraft('A320', 'B748').correct, false);
});

console.log('\ngame records');
ok('only the best game total is kept', () => {
  let b = { v:3, sightings:{}, days:[], badges:{}, quizzes:{}, games:{ played:0, best:0, lastAt:0 } };
  b = recordGame(b, 3100);
  b = recordGame(b, 1200);
  assert.strictEqual(b.games.played, 2);
  assert.strictEqual(b.games.best, 3100);
  assert.strictEqual(computeStats(b).gameBest, 3100);
  assert.strictEqual(computeStats(b).gamesPlayed, 2);
});
ok('a v2 logbook migrates to v3 with an empty game record', () => {
  const { load } = R('logbook.js');
  const store = {};
  global.window = { localStorage: {
    getItem: (k) => store[k] ?? null,
    setItem: (k, v) => { store[k] = v; },
  }};
  store['afa.logbook.v1'] = JSON.stringify({
    v: 2,
    sightings: { abc: { id:'abc', reg:'HL7642', type:'B748', cs:'KAL017', airline:'KAL', first:1, last:1, count:2, maxAlt:38000, maxGs:500 } },
    days: ['2026-08-19'],
    badges: { first_spot: 1 },
    quizzes: { 'wing-lift': { best: 3, total: 3, at: 5 } },
  });
  const m = load();
  assert.strictEqual(m.v, 3);
  assert.strictEqual(m.quizzes['wing-lift'].best, 3);
  assert.strictEqual(Object.keys(m.sightings).length, 1);
  assert.deepStrictEqual(m.games, { played: 0, best: 0, lastAt: 0 });
  delete global.window;
});

console.log(`\n${pass} assertions passed in total`);
