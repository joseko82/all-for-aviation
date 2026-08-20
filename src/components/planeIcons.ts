import type { Map as MapLibreMap } from 'maplibre-gl';
import { ALT_BAND_COLOR, type AltBand } from '@/lib/format';
import type { Silhouette } from '@/lib/aircraft';

/**
 * Aircraft map icons.
 *
 * One top-view airliner silhouette drawn at four sizes (widebody down to
 * turboprop) in six altitude colours = 24 small images, generated in the
 * browser at load time. No image files to ship, no licensing questions, and
 * the colour ramp stays in one place (src/lib/format.ts).
 *
 * The shape points north so MapLibre's `icon-rotate` can be fed the aircraft
 * track directly.
 */

const AIRLINER_PATH =
  'M32 3.5 C34.3 3.5 36.1 8.2 36.5 14.4 L36.7 22.2 L60.5 38.4 L60.5 43.6 ' +
  'L36.9 36.6 L36.7 48.2 L44.2 54.1 L44.2 57.8 L32 54.6 L19.8 57.8 ' +
  'L19.8 54.1 L27.3 48.2 L27.1 36.6 L3.5 43.6 L3.5 38.4 L27.3 22.2 ' +
  'L27.5 14.4 C27.9 8.2 29.7 3.5 32 3.5 Z';

const SCALE: Record<Silhouette, number> = {
  widebody: 1,
  narrowbody: 0.84,
  regional: 0.7,
  prop: 0.62,
};

const BANDS: AltBand[] = ['ground', 'low', 'climb', 'mid', 'high', 'cruise'];
const SHAPES: Silhouette[] = ['widebody', 'narrowbody', 'regional', 'prop'];

export function iconId(shape: Silhouette, band: AltBand): string {
  return `plane-${shape}-${band}`;
}

/** Id of the halo drawn under the currently selected aircraft. */
export const SELECTED_ICON = 'plane-selected-halo';

const BASE = 64;
const PIXEL_RATIO = 2;

function planeSvg(color: string, scale: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${BASE * PIXEL_RATIO}" height="${
    BASE * PIXEL_RATIO
  }" viewBox="0 0 ${BASE} ${BASE}">
  <g transform="translate(32 32) scale(${scale}) translate(-32 -32)">
    <path d="${AIRLINER_PATH}" fill="${color}" stroke="rgba(6,12,22,0.9)"
          stroke-width="2.6" stroke-linejoin="round" />
  </g>
</svg>`;
}

function haloSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${BASE * PIXEL_RATIO}" height="${
    BASE * PIXEL_RATIO
  }" viewBox="0 0 ${BASE} ${BASE}">
  <circle cx="32" cy="32" r="27" fill="rgba(76,196,255,0.16)"
          stroke="#4cc4ff" stroke-width="2.5" />
</svg>`;
}

function rasterise(svg: string): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const size = BASE * PIXEL_RATIO;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('canvas 2d context unavailable'));
        return;
      }
      ctx.drawImage(img, 0, 0, size, size);
      resolve(ctx.getImageData(0, 0, size, size));
    };
    img.onerror = () => reject(new Error('icon rasterisation failed'));
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
}

/** Generate and register every icon the map needs. Safe to call twice. */
export async function registerPlaneIcons(map: MapLibreMap): Promise<void> {
  const jobs: Promise<void>[] = [];

  for (const shape of SHAPES) {
    for (const band of BANDS) {
      const id = iconId(shape, band);
      if (map.hasImage(id)) continue;
      jobs.push(
        rasterise(planeSvg(ALT_BAND_COLOR[band], SCALE[shape])).then((data) => {
          if (!map.hasImage(id)) map.addImage(id, data, { pixelRatio: PIXEL_RATIO });
        }),
      );
    }
  }

  if (!map.hasImage(SELECTED_ICON)) {
    jobs.push(
      rasterise(haloSvg()).then((data) => {
        if (!map.hasImage(SELECTED_ICON)) {
          map.addImage(SELECTED_ICON, data, { pixelRatio: PIXEL_RATIO });
        }
      }),
    );
  }

  await Promise.all(jobs);
}
