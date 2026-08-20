/**
 * Airline lookup by ICAO callsign prefix.
 *
 * ADS-B broadcasts the *radio* callsign (KAL017), not the ticket number
 * (KE017). The first three letters are the airline's ICAO code. A 12-year-old
 * should not have to know that "AAR" means Asiana, so we translate.
 *
 * Hand-curated rather than imported from a licensed database: this covers the
 * carriers actually seen over Korea and at the world hubs, and anything missing
 * degrades gracefully to the raw three-letter code.
 */

export interface Airline {
  name: string;
  /** ISO 3166-1 alpha-2, used for the flag emoji. */
  country: string;
  /** Marks scheduled cargo operators so the map can tint them differently. */
  cargo?: boolean;
}

export const AIRLINES: Record<string, Airline> = {
  // --- Korea ---------------------------------------------------------------
  KAL: { name: 'Korean Air', country: 'KR' },
  AAR: { name: 'Asiana Airlines', country: 'KR' },
  JJA: { name: 'Jeju Air', country: 'KR' },
  JNA: { name: 'Jin Air', country: 'KR' },
  ABL: { name: 'Air Busan', country: 'KR' },
  ASV: { name: 'Air Seoul', country: 'KR' },
  ESR: { name: 'Eastar Jet', country: 'KR' },
  TWB: { name: "T'way Air", country: 'KR' },
  APZ: { name: 'Air Premia', country: 'KR' },
  EOK: { name: 'Aero K', country: 'KR' },

  // --- Japan ---------------------------------------------------------------
  JAL: { name: 'Japan Airlines', country: 'JP' },
  ANA: { name: 'All Nippon Airways', country: 'JP' },
  APJ: { name: 'Peach Aviation', country: 'JP' },
  SKY: { name: 'Skymark Airlines', country: 'JP' },
  JJP: { name: 'Jetstar Japan', country: 'JP' },
  ADO: { name: 'AirDo', country: 'JP' },
  SNJ: { name: 'Solaseed Air', country: 'JP' },
  SFJ: { name: 'StarFlyer', country: 'JP' },
  NCA: { name: 'Nippon Cargo Airlines', country: 'JP', cargo: true },

  // --- Greater China -------------------------------------------------------
  CCA: { name: 'Air China', country: 'CN' },
  CES: { name: 'China Eastern Airlines', country: 'CN' },
  CSN: { name: 'China Southern Airlines', country: 'CN' },
  CHH: { name: 'Hainan Airlines', country: 'CN' },
  CXA: { name: 'Xiamen Air', country: 'CN' },
  CSZ: { name: 'Shenzhen Airlines', country: 'CN' },
  CQH: { name: 'Spring Airlines', country: 'CN' },
  DKH: { name: 'Juneyao Air', country: 'CN' },
  CSC: { name: 'Sichuan Airlines', country: 'CN' },
  CBJ: { name: 'Beijing Capital Airlines', country: 'CN' },
  CDG: { name: 'Shandong Airlines', country: 'CN' },
  EPA: { name: 'Donghai Airlines', country: 'CN' },
  CKK: { name: 'China Cargo Airlines', country: 'CN', cargo: true },
  CAO: { name: 'Air China Cargo', country: 'CN', cargo: true },
  CYZ: { name: 'China Postal Airlines', country: 'CN', cargo: true },
  CPA: { name: 'Cathay Pacific', country: 'HK' },
  HKE: { name: 'HK Express', country: 'HK' },
  AHK: { name: 'Air Hong Kong', country: 'HK', cargo: true },
  CAL: { name: 'China Airlines', country: 'TW' },
  EVA: { name: 'EVA Air', country: 'TW' },
  SJX: { name: 'Starlux Airlines', country: 'TW' },
  TTW: { name: 'Tigerair Taiwan', country: 'TW' },

  // --- Southeast Asia ------------------------------------------------------
  SIA: { name: 'Singapore Airlines', country: 'SG' },
  TGW: { name: 'Scoot', country: 'SG' },
  MAS: { name: 'Malaysia Airlines', country: 'MY' },
  AXM: { name: 'AirAsia', country: 'MY' },
  THA: { name: 'Thai Airways', country: 'TH' },
  AIQ: { name: 'Thai AirAsia', country: 'TH' },
  HVN: { name: 'Vietnam Airlines', country: 'VN' },
  VJC: { name: 'VietJet Air', country: 'VN' },
  PAL: { name: 'Philippine Airlines', country: 'PH' },
  CEB: { name: 'Cebu Pacific', country: 'PH' },
  GIA: { name: 'Garuda Indonesia', country: 'ID' },
  LNI: { name: 'Lion Air', country: 'ID' },
  BTK: { name: 'Batik Air', country: 'ID' },

  // --- South Asia & Middle East -------------------------------------------
  AIC: { name: 'Air India', country: 'IN' },
  IGO: { name: 'IndiGo', country: 'IN' },
  UAE: { name: 'Emirates', country: 'AE' },
  ETD: { name: 'Etihad Airways', country: 'AE' },
  ABY: { name: 'Air Arabia', country: 'AE' },
  FDB: { name: 'flydubai', country: 'AE' },
  QTR: { name: 'Qatar Airways', country: 'QA' },
  SVA: { name: 'Saudia', country: 'SA' },
  KAC: { name: 'Kuwait Airways', country: 'KW' },
  GFA: { name: 'Gulf Air', country: 'BH' },
  OMA: { name: 'Oman Air', country: 'OM' },
  THY: { name: 'Turkish Airlines', country: 'TR' },
  ELY: { name: 'El Al', country: 'IL' },
  MEA: { name: 'Middle East Airlines', country: 'LB' },
  UZB: { name: 'Uzbekistan Airways', country: 'UZ' },
  MGL: { name: 'MIAT Mongolian Airlines', country: 'MN' },

  // --- Europe --------------------------------------------------------------
  BAW: { name: 'British Airways', country: 'GB' },
  VIR: { name: 'Virgin Atlantic', country: 'GB' },
  EZY: { name: 'easyJet', country: 'GB' },
  TOM: { name: 'TUI Airways', country: 'GB' },
  DLH: { name: 'Lufthansa', country: 'DE' },
  GEC: { name: 'Lufthansa Cargo', country: 'DE', cargo: true },
  EWG: { name: 'Eurowings', country: 'DE' },
  CFG: { name: 'Condor', country: 'DE' },
  AFR: { name: 'Air France', country: 'FR' },
  KLM: { name: 'KLM Royal Dutch Airlines', country: 'NL' },
  KLC: { name: 'KLM Cityhopper', country: 'NL' },
  TRA: { name: 'Transavia', country: 'NL' },
  IBE: { name: 'Iberia', country: 'ES' },
  VLG: { name: 'Vueling', country: 'ES' },
  AEA: { name: 'Air Europa', country: 'ES' },
  RYR: { name: 'Ryanair', country: 'IE' },
  AZA: { name: 'ITA Airways', country: 'IT' },
  SWR: { name: 'Swiss International Air Lines', country: 'CH' },
  AUA: { name: 'Austrian Airlines', country: 'AT' },
  BEL: { name: 'Brussels Airlines', country: 'BE' },
  TAP: { name: 'TAP Air Portugal', country: 'PT' },
  SAS: { name: 'SAS Scandinavian Airlines', country: 'SE' },
  FIN: { name: 'Finnair', country: 'FI' },
  NAX: { name: 'Norwegian Air Shuttle', country: 'NO' },
  LOT: { name: 'LOT Polish Airlines', country: 'PL' },
  WZZ: { name: 'Wizz Air', country: 'HU' },
  AEE: { name: 'Aegean Airlines', country: 'GR' },
  CSA: { name: 'Czech Airlines', country: 'CZ' },
  AFL: { name: 'Aeroflot', country: 'RU' },
  SBI: { name: 'S7 Airlines', country: 'RU' },
  ASL: { name: 'Air Serbia', country: 'RS' },
  ICE: { name: 'Icelandair', country: 'IS' },
  CLX: { name: 'Cargolux', country: 'LU', cargo: true },

  // --- North America -------------------------------------------------------
  AAL: { name: 'American Airlines', country: 'US' },
  DAL: { name: 'Delta Air Lines', country: 'US' },
  UAL: { name: 'United Airlines', country: 'US' },
  SWA: { name: 'Southwest Airlines', country: 'US' },
  ASA: { name: 'Alaska Airlines', country: 'US' },
  JBU: { name: 'JetBlue Airways', country: 'US' },
  NKS: { name: 'Spirit Airlines', country: 'US' },
  FFT: { name: 'Frontier Airlines', country: 'US' },
  HAL: { name: 'Hawaiian Airlines', country: 'US' },
  SCX: { name: 'Sun Country Airlines', country: 'US' },
  SKW: { name: 'SkyWest Airlines', country: 'US' },
  ENY: { name: 'Envoy Air', country: 'US' },
  RPA: { name: 'Republic Airways', country: 'US' },
  EDV: { name: 'Endeavor Air', country: 'US' },
  JIA: { name: 'PSA Airlines', country: 'US' },
  AWI: { name: 'Air Wisconsin', country: 'US' },
  FDX: { name: 'FedEx Express', country: 'US', cargo: true },
  UPS: { name: 'UPS Airlines', country: 'US', cargo: true },
  GTI: { name: 'Atlas Air', country: 'US', cargo: true },
  PAC: { name: 'Polar Air Cargo', country: 'US', cargo: true },
  CKS: { name: 'Kalitta Air', country: 'US', cargo: true },
  ABX: { name: 'ABX Air', country: 'US', cargo: true },
  ACA: { name: 'Air Canada', country: 'CA' },
  WJA: { name: 'WestJet', country: 'CA' },
  AMX: { name: 'Aeroméxico', country: 'MX' },
  VOI: { name: 'Volaris', country: 'MX' },
  CMP: { name: 'Copa Airlines', country: 'PA' },

  // --- South America -------------------------------------------------------
  LAN: { name: 'LATAM Airlines', country: 'CL' },
  TAM: { name: 'LATAM Brasil', country: 'BR' },
  AZU: { name: 'Azul Brazilian Airlines', country: 'BR' },
  GLO: { name: 'Gol Linhas Aéreas', country: 'BR' },
  ARG: { name: 'Aerolíneas Argentinas', country: 'AR' },
  AVA: { name: 'Avianca', country: 'CO' },

  // --- Oceania & Africa ----------------------------------------------------
  QFA: { name: 'Qantas', country: 'AU' },
  JST: { name: 'Jetstar Airways', country: 'AU' },
  VOZ: { name: 'Virgin Australia', country: 'AU' },
  ANZ: { name: 'Air New Zealand', country: 'NZ' },
  ETH: { name: 'Ethiopian Airlines', country: 'ET' },
  SAA: { name: 'South African Airways', country: 'ZA' },
  MSR: { name: 'EgyptAir', country: 'EG' },
  RAM: { name: 'Royal Air Maroc', country: 'MA' },
  KQA: { name: 'Kenya Airways', country: 'KE' },
};

/** Extract the ICAO airline prefix from a callsign, e.g. "KAL017" -> "KAL". */
export function airlinePrefix(callsign: string): string | null {
  const m = callsign.trim().toUpperCase().match(/^([A-Z]{3})\d/);
  return m ? m[1] : null;
}

export function lookupAirline(callsign: string): (Airline & { code: string }) | null {
  const code = airlinePrefix(callsign);
  if (!code) return null;
  const a = AIRLINES[code];
  return a ? { ...a, code } : null;
}

/** Regional-indicator flag emoji for an ISO country code. */
export function flagEmoji(iso2: string): string {
  if (!/^[A-Za-z]{2}$/.test(iso2)) return '';
  return String.fromCodePoint(
    ...iso2.toUpperCase().split('').map((c) => 0x1f1e6 + c.charCodeAt(0) - 65),
  );
}
