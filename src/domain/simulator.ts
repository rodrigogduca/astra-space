import type { IndicatorCode, Observation } from "./types";
import { indicator } from "./indicators";
import { connector, connectorFor } from "./integrations";

// SIMULATED DATA generator. Nothing here comes from an astronaut, NASA or CSA.
// It is deterministic (fixed seed) so the demo always tells the same story.

const HOUR = 3600_000;
export const PROFILE_ID = "DEMO-01";

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function obs(code: IndicatorCode, at: number, value: number, n: number): Observation {
  const def = indicator(code);
  const factor = 10 ** def.decimals;
  return {
    observationId: `sim-${code}-${n}`,
    profileId: PROFILE_ID,
    indicatorCode: code,
    value: Math.round(value * factor) / factor,
    unit: def.unit,
    observedAt: new Date(at).toISOString(),
    origin: "synthetic",
    sourceRef: connectorFor(code)?.id ?? "demo-scenario",
    qualityState: "valid",
    syncState: "synced",
    isSynthetic: true,
  };
}

// 72 h scenario from the specification (table 6): T0, T+36 h and T+72 h,
// preceded by three days of history so the streak makes sense.
// T0 sits at −70 h (not −72 h) so the 3 points fit in the "72 h" window even minutes after opening.
const CHECKIN_OFFSETS_H = [-144, -120, -96, -70, -36, -2];
const DAILY: Partial<Record<IndicatorCode, number[]>> = {
  sleep_duration: [7.4, 7.0, 7.8, 7.5, 6, 5],
  energy_self_report: [8, 7, 8, 8, 6, 4],
  mood_self_report: [8, 8, 7, 8, 6, 4],
  stress_self_report: [3, 3, 2, 3, 5, 6],
  purpose_self_report: [8, 8, 9, 8, 7, 6],
};
// Totals for previous days (today comes from the logged missions).
const PAST_DAYS_TOTALS: Partial<Record<IndicatorCode, number[]>> = {
  hydration: [2.1, 1.8, 2.3, 2.0, 1.6, 1.4],
  exercise: [125, 130, 110, 120, 90, 60],
  earth_contact: [20, 0, 35, 15, 0, 10],
  contemplation: [10, 5, 15, 10, 5, 0],
};

export function generateSynthetic(anchor: number): Observation[] {
  const rand = mulberry32(2026);
  const noise = (amp: number) => (rand() * 2 - 1) * amp;
  const out: Observation[] = [];
  let n = 0;
  const start = anchor - 7 * 24 * HOUR;

  // Telemetry every 2 h over the last 7 days.
  for (let t = start; t <= anchor; t += 2 * HOUR) {
    const hourOfDay = new Date(t).getHours();
    const circadian = Math.sin(((hourOfDay - 15) / 24) * 2 * Math.PI); // afternoon peak
    const lateFatigue = Math.max(0, (t - (anchor - 72 * HOUR)) / (72 * HOUR)); // 0→1 over the last 72 h

    out.push(obs("heart_rate", t, 63 + circadian * 5 + lateFatigue * 6 + noise(3), n++));
    out.push(obs("hrv", t, 58 - circadian * 6 - lateFatigue * 12 + noise(4), n++));
    out.push(obs("bp_systolic", t, 114 + circadian * 4 + lateFatigue * 5 + noise(3), n++));
    out.push(obs("bp_diastolic", t, 73 + circadian * 3 + lateFatigue * 3 + noise(2), n++));
    out.push(obs("spo2", t, 97.6 + noise(1.2), n++));
    out.push(obs("resp_rate", t, 14.5 + circadian + noise(1.2), n++));
    out.push(obs("body_temp", t, 36.7 + circadian * 0.25 + noise(0.1), n++));
    out.push(obs("cabin_co2", t, 2.8 + noise(0.5) + (hourOfDay > 9 && hourOfDay < 20 ? 0.4 : 0), n++));
    const meal = [8, 13, 19].some((h) => hourOfDay === h || hourOfDay === h + 1);
    out.push(obs("glucose", t, (meal ? 138 : 96) + noise(meal ? 18 : 8), n++));
  }

  // Daily dose (sum of the day), with a simulated South Atlantic Anomaly peak.
  for (let d = 6; d >= 0; d--) {
    const t = anchor - d * 24 * HOUR;
    out.push(obs("radiation_dose", t, (d === 2 ? 0.78 : 0.52) + noise(0.06), n++));
  }

  CHECKIN_OFFSETS_H.forEach((offset, i) => {
    const t = anchor + offset * HOUR;
    for (const [code, values] of Object.entries(DAILY)) {
      out.push(obs(code as IndicatorCode, t, values![i], n++));
    }
  });

  PAST_DAYS_TOTALS.hydration!.forEach((_, i) => {
    const t = anchor - (6 - i) * 24 * HOUR - 6 * HOUR;
    for (const [code, values] of Object.entries(PAST_DAYS_TOTALS)) {
      out.push(obs(code as IndicatorCode, t, values![i], n++));
    }
  });

  return out;
}

// New reading from a SIMULATED connector ("Sync now" / "Today's vitals").
const LIVE_BASE: Partial<Record<IndicatorCode, [number, number]>> = {
  heart_rate: [68, 3],
  hrv: [48, 4],
  bp_systolic: [118, 3],
  bp_diastolic: [76, 2],
  spo2: [97.5, 1],
  resp_rate: [15, 1],
  body_temp: [36.8, 0.1],
  glucose: [102, 10],
  radiation_dose: [0.5, 0.05],
  cabin_co2: [3, 0.4],
  exercise: [30, 10],
};

export function simulateConnectorReading(connectorId: string, now: number, seq: number): Observation[] {
  const rand = mulberry32((now % 100000) + seq);
  const c = connector(connectorId);
  if (!c || c.status !== "simulated") return [];
  return c.feeds
    .filter((code) => LIVE_BASE[code])
    .map((code, i) => {
      const [base, amp] = LIVE_BASE[code]!;
      return { ...obs(code, now, base + (rand() * 2 - 1) * amp, 0), observationId: `sim-live-${seq}-${connectorId}-${i}`, sourceRef: connectorId };
    });
}

// Demo mission: "day 46" is a fictional label for the story, not a real mission.
export const MISSION = {
  name: "ASTRA-1 demo mission",
  day: 46,
  crewId: PROFILE_ID,
  callSign: "Polaris",
};
