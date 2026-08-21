'use client';

import { useCallback, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import SiteNav from './SiteNav';
import GuessMap from './GuessMap';
import { useLogbook } from './LogbookProvider';
import {
  buildGame,
  gameRank,
  MAX_ROUND_SCORE,
  ROUNDS_PER_GAME,
  scoreAircraft,
  scoreDistance,
  type Round,
  type RoundResult,
} from '@/lib/game';
import { buildSilhouette } from '@/lib/silhouette';
import { YARDSTICKS } from '@/lib/aircraftSpecs';
import { localeUnits, type Locale } from '@/i18n/routing';
import type { LngLat } from '@/lib/geo';

/** Fixed drawing window so every silhouette is shown at the same true scale. */
const STAGE_M = 86;
const BUS_M = YARDSTICKS.find((y) => y.id === 'bus')!.lengthM;

function SilhouetteStage({
  round,
  busLabel,
}: {
  round: Extract<Round, { kind: 'aircraft' }>;
  busLabel: string;
}) {
  const s = useMemo(() => buildSilhouette(round.answer), [round.answer]);
  return (
    <svg viewBox={`-3 ${-STAGE_M / 2} ${STAGE_M} ${STAGE_M}`} className="game-silhouette">
      <g className="mystery">
        <path d={s.wings} />
        <path d={s.tail} />
        {s.engines.map((d, i) => (
          <path key={i} d={d} />
        ))}
        <path d={s.fuselage} />
      </g>
      {/* A bus at the same scale, labelled — an unlabelled orange bar is not a
          clue anyone can use. */}
      <rect x={0} y={STAGE_M / 2 - 8} width={BUS_M} height={2.6} rx={0.8} className="scale-bus" />
      <text x={0} y={STAGE_M / 2 - 3.6} className="scale-label">
        {busLabel}
      </text>
    </svg>
  );
}

export default function GameBoard() {
  const t = useTranslations('game');
  const locale = useLocale() as Locale;
  const units = localeUnits[locale] ?? 'imperial';
  const { stats, book, recordGameResult } = useLogbook();

  const [seed, setSeed] = useState(() => 1);
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [guess, setGuess] = useState<LngLat | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<RoundResult | null>(null);

  const rounds = useMemo(() => buildGame(seed), [seed]);
  const round = rounds[index];
  const total = results.reduce((n, r) => n + r.score, 0);
  const nf = useMemo(() => new Intl.NumberFormat(locale), [locale]);

  const start = useCallback(() => {
    // A fresh seed each game. Date.now() is fine here: nothing needs replaying.
    setSeed(Math.floor(Date.now() % 2_147_483_647) || 1);
    setStarted(true);
    setIndex(0);
    setResults([]);
    setGuess(null);
    setPicked(null);
    setRevealed(null);
  }, []);

  const submit = useCallback(() => {
    if (!round || revealed) return;
    if (round.kind === 'airport') {
      if (!guess) return;
      setRevealed(scoreDistance(guess, round.answer));
    } else {
      if (!picked) return;
      setRevealed(scoreAircraft(picked, round.answer.code));
    }
  }, [round, revealed, guess, picked]);

  const next = useCallback(() => {
    if (!revealed) return;
    const all = [...results, revealed];
    setResults(all);
    setRevealed(null);
    setGuess(null);
    setPicked(null);

    if (index === ROUNDS_PER_GAME - 1) {
      recordGameResult(all.reduce((n, r) => n + r.score, 0));
      setIndex(ROUNDS_PER_GAME);
      return;
    }
    setIndex((n) => n + 1);
  }, [revealed, results, index, recordGameResult]);

  const dist = (km: number) =>
    units === 'metric'
      ? `${nf.format(km)} km`
      : `${nf.format(Math.round(km * 0.621371))} mi`;

  // ---- start screen -------------------------------------------------------
  if (!started) {
    return (
      <div className="page">
        <SiteNav />
        <main className="page-body">
          <h2 className="page-title">{t('title')}</h2>
          <p className="page-lede">{t('lede')}</p>
          <ul className="game-rules">
            <li>{t('rule1')}</li>
            <li>{t('rule2')}</li>
            <li>{t('rule3')}</li>
          </ul>
          {stats.gamesPlayed > 0 && (
            <p className="game-best">
              {t('bestSoFar', { best: nf.format(stats.gameBest), played: stats.gamesPlayed })}
            </p>
          )}
          <button className="game-start" onClick={start}>{t('start')}</button>
        </main>
      </div>
    );
  }

  // ---- results screen -----------------------------------------------------
  if (index >= ROUNDS_PER_GAME) {
    const rank = gameRank(total);
    const isBest = total >= (book.games?.best ?? 0);
    return (
      <div className="page">
        <SiteNav />
        <main className="page-body">
          <h2 className="page-title">{t('finished')}</h2>
          <p className="game-total">{nf.format(total)}</p>
          <p className="game-rank">{t(`rank.${rank}`)}</p>
          {isBest && <p className="game-newbest">{t('newBest')}</p>}
          <ol className="game-breakdown">
            {results.map((r, i) => (
              <li key={i}>
                <span>{t('roundN', { n: i + 1 })}</span>
                <span>
                  {nf.format(r.score)}
                  {r.distanceKm !== undefined && ` · ${dist(r.distanceKm)}`}
                </span>
              </li>
            ))}
          </ol>
          <button className="game-start" onClick={start}>{t('playAgain')}</button>
        </main>
      </div>
    );
  }

  // ---- a round ------------------------------------------------------------
  return (
    <div className="page">
      <SiteNav />
      <main className="page-body">
        <div className="game-head">
          <span className="game-round">
            {t('roundOf', { n: index + 1, total: ROUNDS_PER_GAME })}
          </span>
          <span className="game-running">{nf.format(total)}</span>
        </div>

        {round.kind === 'airport' ? (
          <>
            <h2 className="page-title">{t('whereIs', { airport: `${round.answer.city} — ${round.answer.name}` })}</h2>
            <p className="page-lede">{revealed ? t('answerWas', { city: round.answer.city, country: round.answer.country }) : t('clickMap')}</p>
            <GuessMap
              guess={guess}
              truth={revealed ? { lat: round.answer.lat, lon: round.answer.lon } : null}
              onGuess={setGuess}
              disabled={Boolean(revealed)}
            />
          </>
        ) : (
          <>
            <h2 className="page-title">{t('whichAircraft')}</h2>
            <p className="page-lede">{t('scaleHint')}</p>
            <div className="game-stage">
              <SilhouetteStage round={round} busLabel={t('busLabel')} />
            </div>
            <ul className="game-options">
              {round.options.map((o) => {
                const state = !revealed
                  ? picked === o.code ? 'chosen' : ''
                  : o.code === round.answer.code
                    ? 'right'
                    : picked === o.code
                      ? 'wrong'
                      : 'muted';
                return (
                  <li key={o.code}>
                    <button
                      className={state}
                      disabled={Boolean(revealed)}
                      onClick={() => setPicked(o.code)}
                    >
                      {o.name}
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        <div className="game-actions">
          {!revealed ? (
            <button
              className="game-start"
              disabled={round.kind === 'airport' ? !guess : !picked}
              onClick={submit}
            >
              {round.kind === 'airport' ? t('lockIn') : t('check')}
            </button>
          ) : (
            <>
              <p className={`game-feedback ${revealed.correct ? 'good' : ''}`}>
                {t('gained', { points: nf.format(revealed.score) })}
                {revealed.distanceKm !== undefined &&
                  ` · ${t('offBy', { distance: dist(revealed.distanceKm) })}`}
                {revealed.score === MAX_ROUND_SCORE && ` · ${t('spotOn')}`}
              </p>
              <button className="game-start" onClick={next}>
                {index === ROUNDS_PER_GAME - 1 ? t('seeScore') : t('nextRound')}
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
