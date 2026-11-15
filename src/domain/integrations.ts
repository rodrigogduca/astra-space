import type { IndicatorCode, Observation } from "./types";
import { indicator } from "./indicators";

// Central de integrações (REQ-11). Status honesto: nenhum conector está ligado a um
// sistema real da NASA/CSA. SIMULADO = a demo gera dados como se viessem dele.

export type ConnectorStatus = "ativo" | "simulado" | "roadmap" | "requer_autorizacao";
export type ConnectorKind = "vestivel" | "instrumento" | "ambiente" | "treino" | "estudo" | "autorrelato";

export interface Connector {
  id: string;
  name: string;
  institution: string;
  kind: ConnectorKind;
  status: ConnectorStatus;
  measures: string;
  feeds: IndicatorCode[];
  referenceId?: string; // fonte da base (references.ts)
  sourceNote: string;
}

export const STATUS_LABEL: Record<ConnectorStatus, string> = {
  ativo: "AUTORRELATO",
  simulado: "SIMULADO",
  roadmap: "ROADMAP",
  requer_autorizacao: "REQUER AUTORIZAÇÃO",
};

export const KIND_LABEL: Record<ConnectorKind, string> = {
  vestivel: "Vestível",
  instrumento: "Instrumento",
  ambiente: "Ambiente da nave",
  treino: "Equipamento de treino",
  estudo: "Estudo científico",
  autorrelato: "Autorrelato",
};

export const CONNECTORS: Connector[] = [
  {
    id: "astra-checkin",
    name: "Check-in Astra",
    institution: "Astra",
    kind: "autorrelato",
    status: "ativo",
    measures: "Sono, energia, humor, estresse, propósito e hábitos registrados pelas missões.",
    feeds: ["sleep_duration", "energy_self_report", "mood_self_report", "stress_self_report", "purpose_self_report", "hydration", "earth_contact", "contemplation"],
    sourceNote: "Dado digitado pelo próprio tripulante no app.",
  },
  {
    id: "bio-monitor",
    name: "Bio-Monitor (camiseta Astroskin)",
    institution: "CSA",
    kind: "vestivel",
    status: "simulado",
    measures: "Frequência cardíaca, variabilidade, respiração, SpO₂, pressão e temperatura da pele.",
    feeds: ["heart_rate", "hrv", "resp_rate", "spo2", "bp_systolic", "bp_diastolic", "body_temp"],
    sourceNote: "Sistema vestível da Agência Espacial Canadense usado na ISS. Link oficial ainda a confirmar pela equipe.",
  },
  {
    id: "cgm",
    name: "Monitor contínuo de glicose",
    institution: "Genérico",
    kind: "vestivel",
    status: "simulado",
    measures: "Glicose intersticial a cada poucos minutos.",
    feeds: ["glucose"],
    sourceNote: "Classe de dispositivo comercial. Uso em voo depende de aprovação da missão.",
  },
  {
    id: "dosimetro",
    name: "Dosímetro pessoal ativo",
    institution: "Genérico",
    kind: "instrumento",
    status: "simulado",
    measures: "Dose de radiação absorvida pelo tripulante.",
    feeds: ["radiation_dose"],
    referenceId: "nasa-hazards",
    sourceNote: "Classe de instrumento. Valores da demo são fictícios.",
  },
  {
    id: "cans",
    name: "CANS · Crew Active Neutron Spectrometer",
    institution: "CSA",
    kind: "instrumento",
    status: "roadmap",
    measures: "Exposição a nêutrons (instrumento em desenvolvimento).",
    feeds: ["radiation_dose"],
    referenceId: "csa-radiation",
    sourceNote: "Em desenvolvimento segundo a CSA. Sem dados disponíveis para o Astra.",
  },
  {
    id: "eclss",
    name: "ECLSS · suporte de vida da estação",
    institution: "NASA",
    kind: "ambiente",
    status: "simulado",
    measures: "CO₂ e condições do ar da cabine.",
    feeds: ["cabin_co2"],
    referenceId: "nasa-hazards",
    sourceNote: "Sistema de controle ambiental e suporte de vida. Integração exige autorização da missão.",
  },
  {
    id: "ared",
    name: "ARED e esteira",
    institution: "NASA",
    kind: "treino",
    status: "simulado",
    measures: "Minutos de treino resistido e aeróbico.",
    feeds: ["exercise"],
    sourceNote: "Equipamentos de exercício da ISS. Registro de minutos simulado.",
  },
  {
    id: "archer",
    name: "ARCHeR · Artemis Research for Crew Health and Readiness",
    institution: "NASA",
    kind: "estudo",
    status: "roadmap",
    measures: "Bem-estar, atividade e padrões de sono (actigrafia) na Artemis II.",
    feeds: ["sleep_duration", "exercise"],
    referenceId: "nasa-ongoing",
    sourceNote: "Estudo em andamento. Resultados não são públicos nem importados.",
  },
  {
    id: "cenario-demo",
    name: "Cenário demo · autorrelatos simulados",
    institution: "Astra",
    kind: "autorrelato",
    status: "simulado",
    measures: "Histórico fictício de check-ins e hábitos (cenário de 72 h da especificação base).",
    feeds: ["sleep_duration", "energy_self_report", "mood_self_report", "stress_self_report", "purpose_self_report", "hydration", "earth_contact", "contemplation"],
    sourceNote: "Gerado pela demo para contar a história dos últimos dias. Não foi digitado por ninguém.",
  },
];

export const connector = (id: string) => CONNECTORS.find((c) => c.id === id);

// Conector que gera os dados simulados de cada indicador (o primeiro SIMULADO ou ATIVO que o alimenta).
export function connectorFor(code: IndicatorCode): Connector | undefined {
  return CONNECTORS.find((c) => (c.status === "simulado" || c.status === "ativo") && c.feeds.includes(code) && c.id !== "astra-checkin") ??
    CONNECTORS.find((c) => c.feeds.includes(code));
}

// Limites ESTRUTURAIS (plausibilidade do sensor), não clínicos: servem para barrar leitura quebrada.
export const STRUCTURAL_BOUNDS: Record<IndicatorCode, [number, number]> = {
  heart_rate: [20, 250],
  hrv: [1, 300],
  bp_systolic: [50, 260],
  bp_diastolic: [20, 160],
  spo2: [50, 100],
  resp_rate: [3, 60],
  body_temp: [30, 43],
  glucose: [20, 600],
  radiation_dose: [0, 100],
  cabin_co2: [0, 30],
  sleep_duration: [0, 24],
  hydration: [0, 10],
  exercise: [0, 600],
  energy_self_report: [0, 10],
  mood_self_report: [0, 10],
  stress_self_report: [0, 10],
  purpose_self_report: [0, 10],
  earth_contact: [0, 600],
  contemplation: [0, 600],
};

export interface RawReading {
  connectorId: string;
  indicatorCode: IndicatorCode;
  value: number | null;
  unit: string | null;
  observedAt: string;
  synthetic: boolean;
}

// Camada de ingestão (REQ-11.6): valida unidade, horário e faixa estrutural.
export function ingest(raw: RawReading, id: string, profileId: string, now = Date.now()): Observation {
  const def = indicator(raw.indicatorCode);
  const t = Date.parse(raw.observedAt);
  let quality: Observation["qualityState"] = "valid";
  if (raw.value === null) quality = "missing";
  else if (!Number.isFinite(raw.value)) quality = "invalid";
  else {
    const [lo, hi] = STRUCTURAL_BOUNDS[raw.indicatorCode];
    if (raw.unit !== def.unit || Number.isNaN(t) || t > now + 5 * 60_000 || raw.value < lo || raw.value > hi) quality = "invalid";
  }
  return {
    observationId: id,
    profileId,
    indicatorCode: raw.indicatorCode,
    value: raw.value,
    unit: raw.unit,
    observedAt: raw.observedAt,
    origin: raw.synthetic ? "synthetic" : connector(raw.connectorId)?.id === "astra-checkin" ? "manual" : "authorized_external",
    sourceRef: raw.connectorId,
    qualityState: quality,
    syncState: "local_only",
    isSynthetic: raw.synthetic,
  };
}
