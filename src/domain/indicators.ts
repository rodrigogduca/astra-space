import type { IndicatorCode, Pillar } from "./types";
import type { IconName } from "./icons";

// General reference ranges for adults on Earth. They locate the value,
// they do not diagnose: interpretation belongs to the mission medical team.
export interface ReferenceRange {
  min?: number;
  max?: number;
  label: string;
  source: string;
  kind: "general_reference" | "demo_goal" | "career_limit";
}

export type Group = "vitals" | "metabolism" | "exposure" | "routine" | "mind" | "spirit";

export interface IndicatorDef {
  code: IndicatorCode;
  name: string;
  short: string;
  unit: string;
  decimals: number;
  pillar: Pillar;
  group: Group;
  icon: IconName;
  inputMode: "telemetry" | "self_report" | "log";
  sensor?: string;
  range?: ReferenceRange;
  scaleNote?: string;
  referenceIds: string[];
}

export const GROUP_LABEL: Record<Group, string> = {
  vitals: "Vital signs",
  metabolism: "Metabolism",
  exposure: "Radiation and environment",
  routine: "Sleep, water and workout",
  mind: "Mind",
  spirit: "Spirit",
};

export const PILLAR_LABEL: Record<Pillar, string> = {
  body: "Body",
  mind: "Mind",
  spirit: "Spirit",
};

const SELF_SCALE = "Personal rating from 0 to 10. A product scale, not yet validated.";

export const INDICATORS: IndicatorDef[] = [
  {
    code: "heart_rate",
    name: "Resting heart rate",
    short: "HR",
    unit: "bpm",
    decimals: 0,
    pillar: "body",
    group: "vitals",
    icon: "heart-pulse",
    inputMode: "telemetry",
    sensor: "Chest strap (simulated)",
    range: { min: 60, max: 100, label: "60–100 bpm", source: "General resting range for adults (AHA)", kind: "general_reference" },
    referenceIds: ["nasa-risks"],
  },
  {
    code: "hrv",
    name: "Heart rate variability (RMSSD)",
    short: "HRV",
    unit: "ms",
    decimals: 0,
    pillar: "mind",
    group: "vitals",
    icon: "activity",
    inputMode: "telemetry",
    sensor: "Chest strap (simulated)",
    scaleNote: "No universal range: compare only with yourself.",
    referenceIds: ["nasa-ongoing"],
  },
  {
    code: "bp_systolic",
    name: "Systolic blood pressure",
    short: "SBP",
    unit: "mmHg",
    decimals: 0,
    pillar: "body",
    group: "vitals",
    icon: "gauge",
    inputMode: "telemetry",
    sensor: "Automatic cuff (simulated)",
    range: { max: 120, label: "< 120 mmHg", source: "AHA/ACC 2017 classification for adults", kind: "general_reference" },
    referenceIds: ["nasa-risks"],
  },
  {
    code: "bp_diastolic",
    name: "Diastolic blood pressure",
    short: "DBP",
    unit: "mmHg",
    decimals: 0,
    pillar: "body",
    group: "vitals",
    icon: "gauge",
    inputMode: "telemetry",
    sensor: "Automatic cuff (simulated)",
    range: { max: 80, label: "< 80 mmHg", source: "AHA/ACC 2017 classification for adults", kind: "general_reference" },
    referenceIds: ["nasa-risks"],
  },
  {
    code: "spo2",
    name: "Blood oxygen (SpO₂)",
    short: "SpO₂",
    unit: "%",
    decimals: 0,
    pillar: "body",
    group: "vitals",
    icon: "droplets",
    inputMode: "telemetry",
    sensor: "Finger oximeter (simulated)",
    range: { min: 95, max: 100, label: "95–100 %", source: "General range on room air for adults", kind: "general_reference" },
    referenceIds: ["nasa-risks", "nasa-hazards"],
  },
  {
    code: "resp_rate",
    name: "Respiratory rate",
    short: "RR",
    unit: "rpm",
    decimals: 0,
    pillar: "body",
    group: "vitals",
    icon: "wind",
    inputMode: "telemetry",
    sensor: "Biometric shirt (simulated)",
    range: { min: 12, max: 20, label: "12–20 rpm", source: "General resting range for adults", kind: "general_reference" },
    referenceIds: ["nasa-hazards"],
  },
  {
    code: "body_temp",
    name: "Body temperature",
    short: "Temp.",
    unit: "°C",
    decimals: 1,
    pillar: "body",
    group: "vitals",
    icon: "thermometer",
    inputMode: "telemetry",
    sensor: "Forehead sensor (simulated)",
    range: { min: 36.1, max: 37.2, label: "36.1–37.2 °C", source: "General range for adults", kind: "general_reference" },
    referenceIds: ["nasa-risks"],
  },
  {
    code: "glucose",
    name: "Interstitial glucose",
    short: "Glucose",
    unit: "mg/dL",
    decimals: 0,
    pillar: "body",
    group: "metabolism",
    icon: "droplet",
    inputMode: "telemetry",
    sensor: "Continuous glucose monitor (simulated)",
    range: { min: 70, max: 180, label: "70–180 mg/dL", source: "CGM “time in range” target (international consensus, 2019)", kind: "general_reference" },
    referenceIds: ["nasa-risks"],
  },
  {
    code: "radiation_dose",
    name: "Daily radiation dose",
    short: "Radiation",
    unit: "mSv",
    decimals: 2,
    pillar: "body",
    group: "exposure",
    icon: "radiation",
    inputMode: "telemetry",
    sensor: "Personal dosimeter (simulated; inspired by CANS, not connected)",
    scaleNote: "The mission total is compared with NASA's career limit (600 mSv).",
    referenceIds: ["csa-radiation", "nasa-hazards", "nasa-risks"],
  },
  {
    code: "cabin_co2",
    name: "Cabin CO₂",
    short: "CO₂",
    unit: "mmHg",
    decimals: 1,
    pillar: "body",
    group: "exposure",
    icon: "air-vent",
    inputMode: "telemetry",
    sensor: "Module environment sensor (simulated)",
    scaleNote: "An environment reading, not your body. Operational limits come from the mission.",
    referenceIds: ["nasa-hazards"],
  },
  {
    code: "sleep_duration",
    name: "Sleep duration",
    short: "Sleep",
    unit: "h",
    decimals: 1,
    pillar: "body",
    group: "routine",
    icon: "moon",
    inputMode: "self_report",
    range: { min: 7, label: "≥ 7 h", source: "General recommendation for adults (AASM/SRS 2015)", kind: "general_reference" },
    scaleNote: "Self-reported hours. Does not measure quality or circadian phase.",
    referenceIds: ["nasa-risks", "nasa-ongoing"],
  },
  {
    code: "hydration",
    name: "Hydration",
    short: "Water",
    unit: "L",
    decimals: 1,
    pillar: "body",
    group: "routine",
    icon: "glass-water",
    inputMode: "log",
    range: { min: 2, label: "goal 2 L", source: "Demo goal (ASTRA HYPOTHESIS), set by the medical team in the real version", kind: "demo_goal" },
    referenceIds: ["nasa-hazards"],
  },
  {
    code: "exercise",
    name: "Exercise",
    short: "Workout",
    unit: "min",
    decimals: 0,
    pillar: "body",
    group: "routine",
    icon: "dumbbell",
    inputMode: "log",
    range: { min: 120, label: "goal 2 h", source: "On the ISS, crew members exercise about 2 h a day (NASA)", kind: "demo_goal" },
    referenceIds: ["nasa-risks", "nasa-hazards"],
  },
  {
    code: "energy_self_report",
    name: "Perceived energy",
    short: "Energy",
    unit: "0–10",
    decimals: 0,
    pillar: "mind",
    group: "mind",
    icon: "zap",
    inputMode: "self_report",
    scaleNote: SELF_SCALE,
    referenceIds: ["nasa-risks"],
  },
  {
    code: "mood_self_report",
    name: "Perceived mood",
    short: "Mood",
    unit: "0–10",
    decimals: 0,
    pillar: "mind",
    group: "mind",
    icon: "smile",
    inputMode: "self_report",
    scaleNote: SELF_SCALE + " Optional and private.",
    referenceIds: ["nasa-hazards", "nasa-ongoing"],
  },
  {
    code: "stress_self_report",
    name: "Perceived stress",
    short: "Stress",
    unit: "0–10",
    decimals: 0,
    pillar: "mind",
    group: "mind",
    icon: "brain",
    inputMode: "self_report",
    scaleNote: SELF_SCALE + " Optional and private.",
    referenceIds: ["nasa-hazards"],
  },
  {
    code: "purpose_self_report",
    name: "Meaning and purpose",
    short: "Purpose",
    unit: "0–10",
    decimals: 0,
    pillar: "spirit",
    group: "spirit",
    icon: "sparkles",
    inputMode: "self_report",
    scaleNote: SELF_SCALE + " Optional and private.",
    referenceIds: ["csa-science"],
  },
  {
    code: "earth_contact",
    name: "Connection with Earth",
    short: "Connection",
    unit: "min",
    decimals: 0,
    pillar: "spirit",
    group: "spirit",
    icon: "earth",
    inputMode: "log",
    scaleNote: "Minutes talking with family and friends.",
    referenceIds: ["nasa-hazards", "csa-science"],
  },
  {
    code: "contemplation",
    name: "Contemplation and breathing",
    short: "Pause",
    unit: "min",
    decimals: 0,
    pillar: "spirit",
    group: "spirit",
    icon: "flower",
    inputMode: "log",
    scaleNote: "Meditation, prayer or watching Earth from the window, as you prefer.",
    referenceIds: ["nasa-hazards"],
  },
];

export const CAREER_LIMIT_MSV = 600; // NASA-STD-3001, career exposure limit

export const indicator = (code: IndicatorCode) => INDICATORS.find((i) => i.code === code)!;

let numberLocale = "en-US";
/** The UI calls this when the language changes (pt-BR uses a decimal comma). */
export function setNumberLocale(l: string) {
  numberLocale = l;
}

export function formatValue(value: number | null, code: IndicatorCode): string {
  if (value === null) return "—";
  return value.toLocaleString(numberLocale, {
    minimumFractionDigits: indicator(code).decimals,
    maximumFractionDigits: indicator(code).decimals,
  });
}

export type RangePosition = "below" | "within" | "above" | "no_range";

export function rangePosition(value: number | null, code: IndicatorCode): RangePosition {
  const r = indicator(code).range;
  if (!r || value === null) return "no_range";
  if (r.min !== undefined && value < r.min) return "below";
  if (r.max !== undefined && value > r.max) return "above";
  return "within";
}
