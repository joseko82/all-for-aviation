'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

/**
 * A deliberately simplified lift demonstrator.
 *
 * Two things are true of real wings and both are visible here: lift grows with
 * the square of speed, and it grows with angle of attack right up until the
 * air stops following the wing, at which point it collapses. The numbers are
 * not a simulation of any particular aircraft — the label says so.
 */

const STALL_DEG = 15;

/** Lift coefficient: linear until the stall, then a sharp drop. */
function liftCoefficient(alphaDeg: number): number {
  if (alphaDeg <= STALL_DEG) return Math.max(0, 0.1 * alphaDeg + 0.25);
  const past = alphaDeg - STALL_DEG;
  return Math.max(0.25, 1.75 - past * 0.17);
}

export default function LiftLab() {
  const t = useTranslations('liftLab');
  const [alpha, setAlpha] = useState(5);
  const [speed, setSpeed] = useState(180);

  const cl = liftCoefficient(alpha);
  // Normalised so that 5° at 180 kt sits close to "just enough to fly".
  const lift = (cl * (speed / 180) ** 2) / 0.75;
  const stalled = alpha > STALL_DEG;
  const barPct = Math.min(100, (lift / 2.5) * 100);
  const flyingPct = (1 / 2.5) * 100;

  return (
    <div className="lab">
      <div className="lab-stage">
        <svg viewBox="0 0 320 160" role="img" aria-label={t('alt')}>
          {[0, 1, 2, 3, 4].map((i) => (
            <line
              key={i}
              x1={10}
              y1={34 + i * 22}
              x2={150}
              y2={34 + i * 22}
              className="lab-airflow"
              strokeDasharray={`${6 + speed / 30} ${10 - speed / 60}`}
            />
          ))}

          <g transform={`translate(190 80) rotate(${-alpha})`}>
            <path
              d="M -62 6 C -40 -14, 20 -18, 62 -1 C 30 6, -20 12, -62 6 Z"
              className={`lab-wing ${stalled ? 'stalled' : ''}`}
            />
          </g>

          <g transform="translate(190 80)">
            <line x1={0} y1={0} x2={0} y2={-14 - barPct * 0.45} className="lab-lift-arrow" />
            <polygon
              points={`0,${-22 - barPct * 0.45} -6,${-12 - barPct * 0.45} 6,${-12 - barPct * 0.45}`}
              className="lab-lift-head"
            />
          </g>

          {stalled && (
            <>
              {[0, 1, 2].map((i) => (
                <path
                  key={i}
                  d={`M ${236 + i * 22} 74 q 8 -10 16 0 q -8 10 -16 0`}
                  className="lab-turbulence"
                />
              ))}
            </>
          )}
        </svg>
      </div>

      <div className="lab-controls">
        <label>
          <span>
            {t('angle')} <strong>{alpha}°</strong>
          </span>
          <input
            type="range" min={-4} max={20} step={1}
            value={alpha}
            onChange={(e) => setAlpha(Number(e.target.value))}
          />
        </label>
        <label>
          <span>
            {t('speed')} <strong>{speed} kt</strong>
          </span>
          <input
            type="range" min={80} max={320} step={5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
          />
        </label>
      </div>

      <div className="lab-readout">
        <div className="lab-bar">
          <span className={stalled ? 'stalled' : ''} style={{ inlineSize: `${barPct}%` }} />
          <i className="lab-threshold" style={{ insetInlineStart: `${flyingPct}%` }} />
        </div>
        <p className={`lab-verdict ${stalled ? 'bad' : lift >= 1 ? 'good' : ''}`}>
          {stalled ? t('stalled') : lift >= 1 ? t('flying') : t('notEnough')}
        </p>
        <p className="lab-note">{t('note')}</p>
      </div>
    </div>
  );
}
