'use client';

import { useTranslations } from 'next-intl';
import type { Aircraft, FlightRoute } from '@/lib/types';
import { typeName } from '@/lib/aircraft';
import {
  compassPoint,
  formatAltitude,
  formatDistance,
  formatSpeed,
  formatVerticalRate,
  type UnitSystem,
} from '@/lib/format';
import { distanceNm, routeProgress } from '@/lib/geo';

interface Props {
  aircraft: Aircraft;
  route: FlightRoute | null;
  routeLoading: boolean;
  following: boolean;
  units: UnitSystem;
  locale: string;
  onClose: () => void;
  onToggleFollow: () => void;
}

export default function AircraftPanel({
  aircraft,
  route,
  routeLoading,
  following,
  units,
  locale,
  onClose,
  onToggleFollow,
}: Props) {
  const t = useTranslations('panel');

  const model = typeName(aircraft.type);
  const from = route?.airports[0];
  const to = route?.airports[route.airports.length - 1];

  let progress: number | null = null;
  let remaining: number | null = null;
  if (from && to) {
    const here = { lat: aircraft.lat, lon: aircraft.lon };
    progress = routeProgress(from, to, here);
    remaining = distanceNm(here, to);
  }

  const vertical =
    aircraft.ground
      ? t('onGround')
      : aircraft.vr > 200
        ? t('climbing')
        : aircraft.vr < -200
          ? t('descending')
          : t('level');

  return (
    <aside className="panel" aria-live="polite">
      <div className="panel-head">
        <div className="who">
          <p className="callsign">{aircraft.cs || t('unknownFlight')}</p>
          <p className="model">{model ?? aircraft.type ?? t('unknownType')}</p>
          {aircraft.reg && (
            <p className="reg">
              {t('registration')} · {aircraft.reg}
            </p>
          )}
        </div>
        <button className="panel-close" onClick={onClose} aria-label={t('close')}>
          ×
        </button>
      </div>

      {from && to ? (
        <div className="route">
          <div className="route-ends">
            <div className="route-end from">
              <div className="code">{from.iata || from.icao}</div>
              <div className="city">{from.location}</div>
            </div>
            <div className="route-end to">
              <div className="code">{to.iata || to.icao}</div>
              <div className="city">{to.location}</div>
            </div>
          </div>
          {progress !== null && (
            <>
              <div
                className="progress"
                role="progressbar"
                aria-valuenow={Math.round(progress * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <span style={{ inlineSize: `${Math.round(progress * 100)}%` }} />
              </div>
              <div className="route-meta">
                <span>{t('progress', { percent: Math.round(progress * 100) })}</span>
                {remaining !== null && (
                  <span>
                    {t('distanceToGo', {
                      distance: formatDistance(remaining, units, locale),
                    })}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="route-unknown">
          {routeLoading ? '…' : t('routeUnknown')}
        </div>
      )}

      <dl className="stats">
        <div className="stat">
          <dt>{t('altitude')}</dt>
          <dd>
            {aircraft.ground ? t('onGround') : formatAltitude(aircraft.alt, units, locale)}
          </dd>
        </div>
        <div className="stat">
          <dt>{t('speed')}</dt>
          <dd>{formatSpeed(aircraft.gs, units, locale)}</dd>
        </div>
        <div className="stat">
          <dt>{t('heading')}</dt>
          <dd>
            {Math.round(aircraft.trk)}° {compassPoint(aircraft.trk)}
          </dd>
        </div>
        <div className="stat">
          <dt>{t('verticalRate')}</dt>
          <dd style={{ fontSize: 14 }}>
            {vertical}
            {!aircraft.ground && Math.abs(aircraft.vr) > 200 && (
              <span style={{ display: 'block', fontSize: 12, opacity: 0.7 }}>
                {formatVerticalRate(aircraft.vr, units, locale)}
              </span>
            )}
          </dd>
        </div>
      </dl>

      <div className="panel-actions">
        <button className={following ? 'active' : ''} onClick={onToggleFollow}>
          {following ? t('unfollow') : t('follow')}
        </button>
      </div>
    </aside>
  );
}
