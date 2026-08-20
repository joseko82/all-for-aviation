import { NextRequest, NextResponse } from 'next/server';
import { fetchByCallsign, fetchByRegistration } from '@/lib/upstream';
import { Aircraft } from '@/lib/types';

/**
 * Find a single aircraft that is airborne right now, by callsign or tail number.
 *
 *   GET /api/search?q=KAL017
 *   GET /api/search?q=HL7642
 *
 * We try both interpretations because a 12-year-old should not have to know
 * which one they typed.
 */
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get('q') ?? '').trim();
  if (q.length < 3) {
    return NextResponse.json({ error: 'query_too_short' }, { status: 400 });
  }

  // Search everything, not just airliners: if a child types a specific tail
  // number we should find it even if our airliner filter would have hidden it.
  const opts = { airlinersOnly: false };

  const [byCallsign, byReg] = await Promise.allSettled([
    fetchByCallsign(q, opts),
    fetchByRegistration(q, opts),
  ]);

  const results: Aircraft[] = [];
  const seen = new Set<string>();
  for (const r of [byCallsign, byReg]) {
    if (r.status !== 'fulfilled') continue;
    for (const a of r.value) {
      if (seen.has(a.id)) continue;
      seen.add(a.id);
      results.push(a);
    }
  }

  return NextResponse.json(
    { results },
    { headers: { 'Cache-Control': 'public, s-maxage=10' } },
  );
}
