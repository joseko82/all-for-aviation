# All For Aviation

A live airliner-tracking website built for a curious 12-year-old.
Open the map, click any aeroplane, and see what it is and where it is going.

**Live site:** _(add your Vercel URL here once deployed)_

---

## For the site owner (no coding needed)

You only ever do three things:

1. Claude writes or changes files in this folder.
2. In **GitHub Desktop**: type a short note → **Commit to main** → **Push origin**.
3. Vercel rebuilds and publishes automatically, usually within a minute.

That's it. You never need to run a command in a terminal.

### Optional settings you manage yourself

| Where | What | Needed? |
|---|---|---|
| Vercel → Settings → Environment Variables | `OPENSKY_CLIENT_ID`, `OPENSKY_CLIENT_SECRET` | Optional. Adds a backup data source if the main one has an outage. See `.env.example`. |

---

## What is inside

| Path | What it does |
|---|---|
| `src/app/[locale]/` | The pages. The `[locale]` folder is what makes `/en/…` work, and what will make `/ko/…` work later. |
| `src/app/api/flights/` | Asks adsb.lol for aircraft near a point (or around world hubs) and hands a slimmed-down list to the browser. |
| `src/app/api/flight-route/` | Turns a callsign such as `UAE201` into "Dubai → New York". |
| `src/app/api/search/` | Finds one aeroplane by flight number or tail number. |
| `src/components/LiveMap.tsx` | The map itself: polling, animation, selection, search. |
| `src/components/AircraftPanel.tsx` | The card that opens when you click an aeroplane. |
| `src/components/planeIcons.ts` | Draws the aeroplane icons in the browser. No image files needed. |
| `src/components/LogbookPanel.tsx` | The spotting logbook: stats, badges, recent sightings. |
| `src/components/BadgeToast.tsx` | The "New badge!" celebration. |
| `src/lib/logbook.ts` | Logbook storage (browser only) and statistics. |
| `src/lib/badges.ts` | The 18 badges and the rules that unlock them. |
| `src/lib/airlines.ts` | Callsign prefix → airline name, e.g. `KAL` → Korean Air. |
| `src/lib/route.ts` | Picks which leg of a multi-stop route a plane is on. |
| `src/components/SizeCompare.tsx` | The size comparison page. |
| `src/components/LearnIndex.tsx`, `LearnCardView.tsx`, `Quiz.tsx` | The learning cards and their quizzes. |
| `src/components/LiftLab.tsx` | The interactive wing on the "how does a wing lift" card. |
| `src/lib/aircraftSpecs.ts`, `silhouette.ts` | Published dimensions, and the drawings generated from them. |
| `content/learn/en.json` | **Every word of the learning articles and quizzes.** |
| `tools/unit-tests.cjs` | Pure-logic tests. Run with `npm run test:unit`. |
| `src/lib/` | Pure logic: geometry, unit formatting, aircraft classification, hub list. |
| `messages/en.json` | **Every word shown on screen.** Adding Korean means adding `messages/ko.json`. |

## Design decisions worth remembering

- **The browser never calls the flight API directly.** It calls this site's own
  `/api/…` routes, which call adsb.lol. That avoids CORS problems and lets one
  cached response serve every visitor instead of one request per person.
- **Military aircraft are always filtered out**, and by default so is anything
  that is not an airliner. This is a site about passenger jets.
- **No accounts, no login, no tracking.** The logbook lives in `localStorage`
  on the one device that made it. Nothing personal is stored on any server,
  which is both the right call for a site aimed at a child and the reason this
  costs nothing to run. The trade-off is real: clearing browser data erases the
  logbook, and it does not follow the user to another device.
- **English only today, but built for more.** Locale is already in the URL,
  every string is in a message file, and numbers and units go through `Intl`.
  Article text lives in `content/learn/`, separate from the UI strings in
  `messages/`, because a button label can be translated mechanically but an
  explanation aimed at a 12-year-old has to be rewritten.
- **The logbook survives upgrades.** Stored data is versioned and migrated
  additively, so adding a feature never wipes a collection.

## Data sources and credits

- Aircraft positions: [adsb.lol](https://www.adsb.lol) (open data, volunteer receivers)
- Backup positions: [OpenSky Network](https://opensky-network.org)
- Route database: adsb.lol standing data
- Airline names: hand-curated in `src/lib/airlines.ts` (no licensed database)
- Map tiles: [OpenFreeMap](https://openfreemap.org), © OpenMapTiles, © OpenStreetMap contributors

Not affiliated with any airline or airport.

---

## For developers

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run test:unit  # pure-logic tests (route legs, streaks, logbook migration)
```

Node 20+ required. No environment variables are needed to run it.
