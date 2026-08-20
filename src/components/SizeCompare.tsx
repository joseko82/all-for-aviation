'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import SiteNav from './SiteNav';
import { SPECS, SPEC_BY_CODE, YARDSTICKS, type AircraftSpec } from '@/lib/aircraftSpecs';
import { buildSilhouette } from '@/lib/silhouette';
import { localeUnits, type Locale } from '@/i18n/routing';

const M_TO_FT = 3.28084;
const KM_TO_MI = 0.621371;

function Silhouette({ spec, className }: { spec: AircraftSpec; className: string }) {
  const s = useMemo(() => buildSilhouette(spec), [spec]);
  return (
    <g className={className}>
      <path d={s.wings} />
      <path d={s.tail} />
      {s.engines.map((d, i) => (
        <path key={i} d={d} />
      ))}
      <path d={s.fuselage} />
    </g>
  );
}

export default function SizeCompare() {
  const t = useTranslations('compare');
  const tf = useTranslations('facts');
  const locale = useLocale() as Locale;
  const units = localeUnits[locale] ?? 'imperial';

  const [aCode, setACode] = useState('B738');
  const [bCode, setBCode] = useState('A388');

  const a = SPEC_BY_CODE[aCode];
  const b = SPEC_BY_CODE[bCode];

  const nf = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const len = (m: number) =>
    units === 'metric'
      ? `${nf.format(Math.round(m * 10) / 10)} m`
      : `${nf.format(Math.round(m * M_TO_FT))} ft`;
  const dist = (km: number) =>
    units === 'metric'
      ? `${nf.format(km)} km`
      : `${nf.format(Math.round(km * KM_TO_MI))} mi`;

  // One shared scale so the two silhouettes are honestly comparable.
  const maxLen = Math.max(a.lengthM, b.lengthM);
  const maxSpan = Math.max(a.wingspanM, b.wingspanM);
  const pad = maxLen * 0.06;
  const viewBox = `${-pad} ${-maxSpan / 2 - pad} ${maxLen + pad * 2} ${maxSpan + pad * 2}`;

  const buses = Math.round((a.lengthM / 11) * 10) / 10;

  const rows: Array<{ key: string; a: string; b: string; bigger: 'a' | 'b' | 'tie' }> = [
    {
      key: 'length',
      a: len(a.lengthM), b: len(b.lengthM),
      bigger: a.lengthM === b.lengthM ? 'tie' : a.lengthM > b.lengthM ? 'a' : 'b',
    },
    {
      key: 'wingspan',
      a: len(a.wingspanM), b: len(b.wingspanM),
      bigger: a.wingspanM === b.wingspanM ? 'tie' : a.wingspanM > b.wingspanM ? 'a' : 'b',
    },
    {
      key: 'height',
      a: len(a.heightM), b: len(b.heightM),
      bigger: a.heightM === b.heightM ? 'tie' : a.heightM > b.heightM ? 'a' : 'b',
    },
    {
      key: 'seats',
      a: `${nf.format(a.seats)} (${nf.format(a.maxSeats)})`,
      b: `${nf.format(b.seats)} (${nf.format(b.maxSeats)})`,
      bigger: a.seats === b.seats ? 'tie' : a.seats > b.seats ? 'a' : 'b',
    },
    {
      key: 'range',
      a: dist(a.rangeKm), b: dist(b.rangeKm),
      bigger: a.rangeKm === b.rangeKm ? 'tie' : a.rangeKm > b.rangeKm ? 'a' : 'b',
    },
    { key: 'engines', a: String(a.engines), b: String(b.engines), bigger: 'tie' },
    { key: 'firstFlight', a: String(a.firstFlight), b: String(b.firstFlight), bigger: 'tie' },
  ];

  return (
    <div className="page">
      <SiteNav />

      <main className="page-body">
        <h2 className="page-title">{t('title')}</h2>
        <p className="page-lede">{t('lede')}</p>

        <div className="compare-picker">
          <label>
            <span className="swatch-a" aria-hidden="true" />
            {t('pickA')}
            <select value={aCode} onChange={(e) => setACode(e.target.value)}>
              {SPECS.map((s) => (
                <option key={s.code} value={s.code}>{s.name}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="swatch-b" aria-hidden="true" />
            {t('pickB')}
            <select value={bCode} onChange={(e) => setBCode(e.target.value)}>
              {SPECS.map((s) => (
                <option key={s.code} value={s.code}>{s.name}</option>
              ))}
            </select>
          </label>
        </div>

        <figure className="compare-stage">
          <svg viewBox={viewBox} role="img" aria-label={t('svgAlt', { a: a.name, b: b.name })}>
            {/* Larger aircraft underneath, so the smaller one is never hidden. */}
            {[
              { spec: a, cls: 'plane-a' },
              { spec: b, cls: 'plane-b' },
            ]
              .sort((x, y) => y.spec.wingspanM - x.spec.wingspanM)
              .map(({ spec, cls }) => (
                <Silhouette key={cls} spec={spec} className={cls} />
              ))}
          </svg>
          <figcaption>{t('bothToScale')}</figcaption>
        </figure>

        <section className="yardsticks">
          <h3>{t('yardstickTitle')}</h3>
          <svg
            viewBox={`0 0 ${maxLen} 8`}
            role="img"
            aria-label={t('yardstickAlt')}
            className="yardstick-svg"
          >
            <line x1="0" y1="7.5" x2={maxLen} y2="7.5" className="scale-line" />
            {YARDSTICKS.filter((y) => y.lengthM <= maxLen).map((y, i) => (
              <rect
                key={y.id}
                x={0}
                y={1 + i * 1.35}
                width={y.lengthM}
                height={1}
                rx={0.4}
                className="yardstick-bar"
              />
            ))}
          </svg>
          <ul className="yardstick-key">
            {YARDSTICKS.filter((y) => y.lengthM <= maxLen).map((y) => (
              <li key={y.id}>
                <span className="dot" /> {t(`yardstick.${y.id}`)} · {len(y.lengthM)}
              </li>
            ))}
          </ul>
          <p className="big-fact">{t('busFact', { plane: a.name, buses })}</p>
        </section>

        <table className="compare-table">
          <thead>
            <tr>
              <th />
              <th className="col-a">{a.name}</th>
              <th className="col-b">{b.name}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key}>
                <th scope="row">{t(`row.${r.key}`)}</th>
                <td className={r.bigger === 'a' ? 'win' : ''}>{r.a}</td>
                <td className={r.bigger === 'b' ? 'win' : ''}>{r.b}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="fact-pair">
          <p><strong>{a.name}</strong> — {tf(a.factKey)}</p>
          <p><strong>{b.name}</strong> — {tf(b.factKey)}</p>
        </div>

        <p className="page-note">{t('note')}</p>
      </main>
    </div>
  );
}
