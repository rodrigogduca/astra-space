import type { IndicatorCode, Observation } from "./types";
import { indicator, type Group } from "./indicators";
import { connector } from "./integrations";

// Exportação do prontuário em HL7 FHIR R4 (REQ-11.5): Bundle "collection" de Observation.
// Função pura. LOINC só nos códigos confirmados; o resto usa o sistema local urn:astra:indicator.
// Todo recurso sintético leva a etiqueta SIMULADO em meta.tag.

export const LOINC = "http://loinc.org";
export const ASTRA_INDICATOR_SYSTEM = "urn:astra:indicator";
export const ASTRA_PROVENANCE_SYSTEM = "urn:astra:provenance";
const UCUM = "http://unitsofmeasure.org";
const CATEGORY_SYSTEM = "http://terminology.hl7.org/CodeSystem/observation-category";
const ABSENT_SYSTEM = "http://terminology.hl7.org/CodeSystem/data-absent-reason";

// Códigos LOINC confirmados. Os demais indicadores NÃO têm LOINC aqui de propósito.
export const LOINC_CODES: Partial<Record<IndicatorCode, { code: string; display: string }>> = {
  heart_rate: { code: "8867-4", display: "Heart rate" },
  bp_systolic: { code: "8480-6", display: "Systolic blood pressure" },
  bp_diastolic: { code: "8462-4", display: "Diastolic blood pressure" },
  resp_rate: { code: "9279-1", display: "Respiratory rate" },
  body_temp: { code: "8310-5", display: "Body temperature" },
  spo2: { code: "59408-5", display: "Oxygen saturation in Arterial blood by Pulse oximetry" },
};

// Unidade do app → UCUM. Escalas 0–10 ficam de fora (viram valueInteger).
export const UCUM_UNITS: Record<string, string> = {
  bpm: "/min",
  rpm: "/min",
  mmHg: "mm[Hg]",
  "%": "%",
  "°C": "Cel",
  "mg/dL": "mg/dL",
  mSv: "mSv",
  ms: "ms",
  h: "h",
  L: "L",
  min: "min",
};

type Category = "vital-signs" | "survey" | "social-history" | "laboratory";

const CATEGORY_BY_GROUP: Record<Group, Category> = {
  vitais: "vital-signs",
  metabolismo: "laboratory",
  exposicao: "social-history",
  rotina: "social-history",
  mente: "survey",
  espirito: "survey",
};

const CATEGORY_DISPLAY: Record<Category, string> = {
  "vital-signs": "Vital Signs",
  survey: "Survey",
  "social-history": "Social History",
  laboratory: "Laboratory",
};

export interface FhirCoding {
  system: string;
  code: string;
  display?: string;
}

export interface FhirObservation {
  resourceType: "Observation";
  id: string;
  meta: { tag: FhirCoding[] };
  status: "final" | "cancelled";
  category: { coding: FhirCoding[] }[];
  code: { coding: FhirCoding[]; text: string };
  subject: { reference: string };
  effectiveDateTime: string;
  device?: { display: string };
  valueQuantity?: { value: number; unit: string; system: string; code: string };
  valueInteger?: number;
  dataAbsentReason?: { coding: FhirCoding[]; text: string };
}

export interface FhirBundle {
  resourceType: "Bundle";
  type: "collection";
  timestamp: string;
  meta: { tag: FhirCoding[] };
  entry: { fullUrl: string; resource: FhirObservation }[];
}

const SIMULATED_TAG: FhirCoding = { system: ASTRA_PROVENANCE_SYSTEM, code: "SIMULATED", display: "SIMULADO" };
const MANUAL_TAG: FhirCoding = { system: ASTRA_PROVENANCE_SYSTEM, code: "MANUAL", display: "MANUAL" };

export function categoryFor(code: IndicatorCode): Category {
  return CATEGORY_BY_GROUP[indicator(code).group];
}

export function toFhirObservation(o: Observation, profileId: string): FhirObservation {
  const def = indicator(o.indicatorCode);
  const cat = categoryFor(o.indicatorCode);
  const loinc = LOINC_CODES[o.indicatorCode];
  const tags: FhirCoding[] = [];
  if (o.isSynthetic) tags.push(SIMULATED_TAG);
  if (o.origin === "manual") tags.push(MANUAL_TAG);

  const res: FhirObservation = {
    resourceType: "Observation",
    id: fhirId(o.observationId),
    meta: { tag: tags },
    status: o.value === null ? "cancelled" : "final",
    category: [{ coding: [{ system: CATEGORY_SYSTEM, code: cat, display: CATEGORY_DISPLAY[cat] }] }],
    code: {
      coding: loinc
        ? [{ system: LOINC, code: loinc.code, display: loinc.display }]
        : [{ system: ASTRA_INDICATOR_SYSTEM, code: o.indicatorCode, display: def.name }],
      text: def.name,
    },
    subject: { reference: `Patient/${profileId}` },
    effectiveDateTime: o.observedAt,
  };

  const dev = o.sourceRef ? connector(o.sourceRef) : undefined;
  if (dev || o.sourceRef) res.device = { display: dev?.name ?? o.sourceRef! };

  if (o.value === null) {
    res.dataAbsentReason = { coding: [{ system: ABSENT_SYSTEM, code: "unknown", display: "Unknown" }], text: "Sem valor registrado" };
  } else {
    const unit = o.unit ?? def.unit;
    const ucum = UCUM_UNITS[unit];
    if (ucum) res.valueQuantity = { value: o.value, unit, system: UCUM, code: ucum };
    else res.valueInteger = Math.round(o.value);
  }
  return res;
}

export function toFhirBundle(observations: Observation[], opts: { profileId: string; generatedAt: string }): FhirBundle {
  const entry = observations
    .filter((o) => o.qualityState !== "invalid")
    .map((o) => ({ fullUrl: `urn:uuid:${uuidFrom(o.observationId)}`, resource: toFhirObservation(o, opts.profileId) }));
  return {
    resourceType: "Bundle",
    type: "collection",
    timestamp: opts.generatedAt,
    meta: { tag: observations.some((o) => o.isSynthetic) ? [SIMULATED_TAG] : [] },
    entry,
  };
}

// Tipo `id` do FHIR aceita só [A-Za-z0-9-.], até 64 caracteres.
export function fhirId(raw: string): string {
  return raw.replace(/[^A-Za-z0-9\-.]/g, "-").slice(0, 64);
}

// UUID determinístico (formato v4) a partir do id do registro, para o fullUrl `urn:uuid:` ser válido e estável.
export function uuidFrom(raw: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  const hex: string[] = [];
  for (let round = 0; round < 4; round++) {
    for (let i = 0; i < raw.length; i++) {
      h1 = Math.imul(h1 ^ raw.charCodeAt(i), 16777619) >>> 0;
      h2 = Math.imul(h2 ^ (raw.charCodeAt(i) + round), 2246822507) >>> 0;
    }
    hex.push(((h1 ^ h2 ^ round) >>> 0).toString(16).padStart(8, "0"));
  }
  const x = hex.join("");
  return `${x.slice(0, 8)}-${x.slice(8, 12)}-4${x.slice(13, 16)}-${((parseInt(x[16], 16) & 3) | 8).toString(16)}${x.slice(17, 20)}-${x.slice(20, 32)}`;
}
