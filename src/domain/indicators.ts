import type { IndicatorCode, Pillar } from "./types";
import type { IconName } from "./icons";

// Faixas de referência gerais para adultos na Terra. Servem para localizar o valor,
// não para diagnosticar: a interpretação é da equipe médica da missão.
export interface ReferenceRange {
  min?: number;
  max?: number;
  label: string;
  source: string;
  kind: "referencia_geral" | "meta_demo" | "limite_carreira";
}

export type Group = "vitais" | "metabolismo" | "exposicao" | "rotina" | "mente" | "espirito";

export interface IndicatorDef {
  code: IndicatorCode;
  name: string;
  short: string;
  unit: string;
  decimals: number;
  pillar: Pillar;
  group: Group;
  icon: IconName;
  inputMode: "telemetria" | "autorrelato" | "registro";
  sensor?: string;
  range?: ReferenceRange;
  scaleNote?: string;
  referenceIds: string[];
}

export const GROUP_LABEL: Record<Group, string> = {
  vitais: "Sinais vitais",
  metabolismo: "Metabolismo",
  exposicao: "Radiação e ambiente",
  rotina: "Sono, água e treino",
  mente: "Mente",
  espirito: "Espírito",
};

export const PILLAR_LABEL: Record<Pillar, string> = {
  corpo: "Corpo",
  mente: "Mente",
  espirito: "Espírito",
};

const SELF_SCALE = "Avaliação pessoal de 0 a 10. Escala de produto, ainda não validada.";

export const INDICATORS: IndicatorDef[] = [
  {
    code: "heart_rate",
    name: "Frequência cardíaca em repouso",
    short: "FC",
    unit: "bpm",
    decimals: 0,
    pillar: "corpo",
    group: "vitais",
    icon: "heart-pulse",
    inputMode: "telemetria",
    sensor: "Cinta de peito (simulada)",
    range: { min: 60, max: 100, label: "60–100 bpm", source: "Faixa geral de repouso para adultos (AHA)", kind: "referencia_geral" },
    referenceIds: ["nasa-risks"],
  },
  {
    code: "hrv",
    name: "Variabilidade da FC (RMSSD)",
    short: "VFC",
    unit: "ms",
    decimals: 0,
    pillar: "mente",
    group: "vitais",
    icon: "activity",
    inputMode: "telemetria",
    sensor: "Cinta de peito (simulada)",
    scaleNote: "Sem faixa universal: compare só com você mesmo.",
    referenceIds: ["nasa-ongoing"],
  },
  {
    code: "bp_systolic",
    name: "Pressão arterial sistólica",
    short: "PAS",
    unit: "mmHg",
    decimals: 0,
    pillar: "corpo",
    group: "vitais",
    icon: "gauge",
    inputMode: "telemetria",
    sensor: "Manguito automático (simulado)",
    range: { max: 120, label: "< 120 mmHg", source: "Classificação AHA/ACC 2017 para adultos", kind: "referencia_geral" },
    referenceIds: ["nasa-risks"],
  },
  {
    code: "bp_diastolic",
    name: "Pressão arterial diastólica",
    short: "PAD",
    unit: "mmHg",
    decimals: 0,
    pillar: "corpo",
    group: "vitais",
    icon: "gauge",
    inputMode: "telemetria",
    sensor: "Manguito automático (simulado)",
    range: { max: 80, label: "< 80 mmHg", source: "Classificação AHA/ACC 2017 para adultos", kind: "referencia_geral" },
    referenceIds: ["nasa-risks"],
  },
  {
    code: "spo2",
    name: "Oxigênio no sangue (SpO₂)",
    short: "SpO₂",
    unit: "%",
    decimals: 0,
    pillar: "corpo",
    group: "vitais",
    icon: "droplets",
    inputMode: "telemetria",
    sensor: "Oxímetro de dedo (simulado)",
    range: { min: 95, max: 100, label: "95–100 %", source: "Faixa geral em ar ambiente para adultos", kind: "referencia_geral" },
    referenceIds: ["nasa-risks", "nasa-hazards"],
  },
  {
    code: "resp_rate",
    name: "Frequência respiratória",
    short: "FR",
    unit: "rpm",
    decimals: 0,
    pillar: "corpo",
    group: "vitais",
    icon: "wind",
    inputMode: "telemetria",
    sensor: "Camiseta biométrica (simulada)",
    range: { min: 12, max: 20, label: "12–20 rpm", source: "Faixa geral de repouso para adultos", kind: "referencia_geral" },
    referenceIds: ["nasa-hazards"],
  },
  {
    code: "body_temp",
    name: "Temperatura corporal",
    short: "Temp.",
    unit: "°C",
    decimals: 1,
    pillar: "corpo",
    group: "vitais",
    icon: "thermometer",
    inputMode: "telemetria",
    sensor: "Sensor de testa (simulado)",
    range: { min: 36.1, max: 37.2, label: "36,1–37,2 °C", source: "Faixa geral para adultos", kind: "referencia_geral" },
    referenceIds: ["nasa-risks"],
  },
  {
    code: "glucose",
    name: "Glicose intersticial",
    short: "Glicose",
    unit: "mg/dL",
    decimals: 0,
    pillar: "corpo",
    group: "metabolismo",
    icon: "droplet",
    inputMode: "telemetria",
    sensor: "Monitor contínuo de glicose (simulado)",
    range: { min: 70, max: 180, label: "70–180 mg/dL", source: "Alvo de “tempo no alvo” de CGM (consenso internacional 2019)", kind: "referencia_geral" },
    referenceIds: ["nasa-risks"],
  },
  {
    code: "radiation_dose",
    name: "Dose de radiação diária",
    short: "Radiação",
    unit: "mSv",
    decimals: 2,
    pillar: "corpo",
    group: "exposicao",
    icon: "radiation",
    inputMode: "telemetria",
    sensor: "Dosímetro pessoal (simulado; inspirado no CANS, não conectado)",
    scaleNote: "A soma da missão é comparada ao limite de carreira da NASA (600 mSv).",
    referenceIds: ["csa-radiation", "nasa-hazards", "nasa-risks"],
  },
  {
    code: "cabin_co2",
    name: "CO₂ na cabine",
    short: "CO₂",
    unit: "mmHg",
    decimals: 1,
    pillar: "corpo",
    group: "exposicao",
    icon: "air-vent",
    inputMode: "telemetria",
    sensor: "Sensor ambiental do módulo (simulado)",
    scaleNote: "Leitura do ambiente, não do seu corpo. Limites operacionais vêm da missão.",
    referenceIds: ["nasa-hazards"],
  },
  {
    code: "sleep_duration",
    name: "Duração do sono",
    short: "Sono",
    unit: "h",
    decimals: 1,
    pillar: "corpo",
    group: "rotina",
    icon: "moon",
    inputMode: "autorrelato",
    range: { min: 7, label: "≥ 7 h", source: "Recomendação geral para adultos (AASM/SRS 2015)", kind: "referencia_geral" },
    scaleNote: "Horas autorrelatadas. Não mede qualidade nem fase circadiana.",
    referenceIds: ["nasa-risks", "nasa-ongoing"],
  },
  {
    code: "hydration",
    name: "Hidratação",
    short: "Água",
    unit: "L",
    decimals: 1,
    pillar: "corpo",
    group: "rotina",
    icon: "glass-water",
    inputMode: "registro",
    range: { min: 2, label: "meta 2 L", source: "Meta da demo (HIPÓTESE ASTRA), definida pela equipe médica na versão real", kind: "meta_demo" },
    referenceIds: ["nasa-hazards"],
  },
  {
    code: "exercise",
    name: "Exercício",
    short: "Treino",
    unit: "min",
    decimals: 0,
    pillar: "corpo",
    group: "rotina",
    icon: "dumbbell",
    inputMode: "registro",
    range: { min: 120, label: "meta 2 h", source: "Na ISS, tripulantes se exercitam cerca de 2 h por dia (NASA)", kind: "meta_demo" },
    referenceIds: ["nasa-risks", "nasa-hazards"],
  },
  {
    code: "energy_self_report",
    name: "Energia percebida",
    short: "Energia",
    unit: "0–10",
    decimals: 0,
    pillar: "mente",
    group: "mente",
    icon: "zap",
    inputMode: "autorrelato",
    scaleNote: SELF_SCALE,
    referenceIds: ["nasa-risks"],
  },
  {
    code: "mood_self_report",
    name: "Humor percebido",
    short: "Humor",
    unit: "0–10",
    decimals: 0,
    pillar: "mente",
    group: "mente",
    icon: "smile",
    inputMode: "autorrelato",
    scaleNote: SELF_SCALE + " Opcional e privado.",
    referenceIds: ["nasa-hazards", "nasa-ongoing"],
  },
  {
    code: "stress_self_report",
    name: "Estresse percebido",
    short: "Estresse",
    unit: "0–10",
    decimals: 0,
    pillar: "mente",
    group: "mente",
    icon: "brain",
    inputMode: "autorrelato",
    scaleNote: SELF_SCALE + " Opcional e privado.",
    referenceIds: ["nasa-hazards"],
  },
  {
    code: "purpose_self_report",
    name: "Sentido e propósito",
    short: "Propósito",
    unit: "0–10",
    decimals: 0,
    pillar: "espirito",
    group: "espirito",
    icon: "sparkles",
    inputMode: "autorrelato",
    scaleNote: SELF_SCALE + " Opcional e privado.",
    referenceIds: ["csa-science"],
  },
  {
    code: "earth_contact",
    name: "Conexão com a Terra",
    short: "Conexão",
    unit: "min",
    decimals: 0,
    pillar: "espirito",
    group: "espirito",
    icon: "earth",
    inputMode: "registro",
    scaleNote: "Minutos de conversa com família e amigos.",
    referenceIds: ["nasa-hazards", "csa-science"],
  },
  {
    code: "contemplation",
    name: "Contemplação e respiração",
    short: "Pausa",
    unit: "min",
    decimals: 0,
    pillar: "espirito",
    group: "espirito",
    icon: "flower",
    inputMode: "registro",
    scaleNote: "Meditação, oração ou observação da Terra pela janela, como você preferir.",
    referenceIds: ["nasa-hazards"],
  },
];

export const CAREER_LIMIT_MSV = 600; // NASA-STD-3001, limite de carreira de exposição

export const indicator = (code: IndicatorCode) => INDICATORS.find((i) => i.code === code)!;

export function formatValue(value: number | null, code: IndicatorCode): string {
  if (value === null) return "—";
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: indicator(code).decimals,
    maximumFractionDigits: indicator(code).decimals,
  });
}

export type RangePosition = "abaixo" | "dentro" | "acima" | "sem_faixa";

export function rangePosition(value: number | null, code: IndicatorCode): RangePosition {
  const r = indicator(code).range;
  if (!r || value === null) return "sem_faixa";
  if (r.min !== undefined && value < r.min) return "abaixo";
  if (r.max !== undefined && value > r.max) return "acima";
  return "dentro";
}
