// Portuguese version of the domain texts. Same keys as the English catalogs;
// the Record types make sure no item is left without a translation.
import type { IndicatorCode, Pillar } from "./types";
import type { Group } from "./indicators";
import type { Hazard, Reference } from "./references";
import type { ConnectorKind, ConnectorStatus } from "./integrations";
import type { MissionId } from "./gamification";

const SELF_SCALE = "Avaliação pessoal de 0 a 10. Escala de produto, ainda não validada.";

export const INDICATOR_PT: Record<
  IndicatorCode,
  { name: string; short: string; sensor?: string; scaleNote?: string; rangeLabel?: string; rangeSource?: string }
> = {
  heart_rate: {
    name: "Frequência cardíaca em repouso",
    short: "FC",
    sensor: "Cinta de peito (simulada)",
    rangeLabel: "60–100 bpm",
    rangeSource: "Faixa geral de repouso para adultos (AHA)",
  },
  hrv: { name: "Variabilidade da FC (RMSSD)", short: "VFC", sensor: "Cinta de peito (simulada)", scaleNote: "Sem faixa universal: compare só com você mesmo." },
  bp_systolic: {
    name: "Pressão arterial sistólica",
    short: "PAS",
    sensor: "Manguito automático (simulado)",
    rangeLabel: "< 120 mmHg",
    rangeSource: "Classificação AHA/ACC 2017 para adultos",
  },
  bp_diastolic: {
    name: "Pressão arterial diastólica",
    short: "PAD",
    sensor: "Manguito automático (simulado)",
    rangeLabel: "< 80 mmHg",
    rangeSource: "Classificação AHA/ACC 2017 para adultos",
  },
  spo2: {
    name: "Oxigênio no sangue (SpO₂)",
    short: "SpO₂",
    sensor: "Oxímetro de dedo (simulado)",
    rangeLabel: "95–100 %",
    rangeSource: "Faixa geral em ar ambiente para adultos",
  },
  resp_rate: {
    name: "Frequência respiratória",
    short: "FR",
    sensor: "Camiseta biométrica (simulada)",
    rangeLabel: "12–20 rpm",
    rangeSource: "Faixa geral de repouso para adultos",
  },
  body_temp: {
    name: "Temperatura corporal",
    short: "Temp.",
    sensor: "Sensor de testa (simulado)",
    rangeLabel: "36,1–37,2 °C",
    rangeSource: "Faixa geral para adultos",
  },
  glucose: {
    name: "Glicose intersticial",
    short: "Glicose",
    sensor: "Monitor contínuo de glicose (simulado)",
    rangeLabel: "70–180 mg/dL",
    rangeSource: "Alvo de “tempo no alvo” de CGM (consenso internacional 2019)",
  },
  radiation_dose: {
    name: "Dose de radiação diária",
    short: "Radiação",
    sensor: "Dosímetro pessoal (simulado; inspirado no CANS, não conectado)",
    scaleNote: "A soma da missão é comparada ao limite de carreira da NASA (600 mSv).",
  },
  cabin_co2: {
    name: "CO₂ na cabine",
    short: "CO₂",
    sensor: "Sensor ambiental do módulo (simulado)",
    scaleNote: "Leitura do ambiente, não do seu corpo. Limites operacionais vêm da missão.",
  },
  sleep_duration: {
    name: "Duração do sono",
    short: "Sono",
    rangeLabel: "≥ 7 h",
    rangeSource: "Recomendação geral para adultos (AASM/SRS 2015)",
    scaleNote: "Horas autorrelatadas. Não mede qualidade nem fase circadiana.",
  },
  hydration: {
    name: "Hidratação",
    short: "Água",
    rangeLabel: "meta 2 L",
    rangeSource: "Meta da demo (HIPÓTESE ASTRA), definida pela equipe médica na versão real",
  },
  exercise: {
    name: "Exercício",
    short: "Treino",
    rangeLabel: "meta 2 h",
    rangeSource: "Na ISS, tripulantes se exercitam cerca de 2 h por dia (NASA)",
  },
  energy_self_report: { name: "Energia percebida", short: "Energia", scaleNote: SELF_SCALE },
  mood_self_report: { name: "Humor percebido", short: "Humor", scaleNote: SELF_SCALE + " Opcional e privado." },
  stress_self_report: { name: "Estresse percebido", short: "Estresse", scaleNote: SELF_SCALE + " Opcional e privado." },
  purpose_self_report: { name: "Sentido e propósito", short: "Propósito", scaleNote: SELF_SCALE + " Opcional e privado." },
  earth_contact: { name: "Conexão com a Terra", short: "Conexão", scaleNote: "Minutos de conversa com família e amigos." },
  contemplation: {
    name: "Contemplação e respiração",
    short: "Pausa",
    scaleNote: "Meditação, oração ou observação da Terra pela janela, como você preferir.",
  },
};

export const GROUP_PT: Record<Group, string> = {
  vitals: "Sinais vitais",
  metabolism: "Metabolismo",
  exposure: "Radiação e ambiente",
  routine: "Sono, água e treino",
  mind: "Mente",
  spirit: "Espírito",
};

export const PILLAR_PT: Record<Pillar, string> = { body: "Corpo", mind: "Mente", spirit: "Espírito" };

export const MISSION_PT: Record<MissionId, { title: string; subtitle: string }> = {
  checkin: { title: "Check-in matinal", subtitle: "Sono, energia e humor" },
  vitals: { title: "Sinais do dia", subtitle: "Sincronizar pressão, glicose e SpO₂" },
  hydration: { title: "Hidratação", subtitle: "2 litros no dia" },
  exercise: { title: "Treino", subtitle: "Esteira, bicicleta e ARED" },
  breathe: { title: "Pausa de respiração", subtitle: "1 minuto guiado pelo Catro" },
  earth: { title: "Ligar para a Terra", subtitle: "Conversa com família ou amigos" },
  window: { title: "Olhar pela Cúpula", subtitle: "5 min contemplando a Terra" },
  gratitude: { title: "Três gratidões", subtitle: "Escolha o que valeu o dia" },
  evening: { title: "Check-in noturno", subtitle: "Estresse e propósito" },
};

// Keyed by the English level name (LEVELS in gamification.ts).
export const LEVEL_PT: Record<string, string> = {
  Cadet: "Cadete",
  Specialist: "Especialista",
  "Flight engineer": "Engenheiro de voo",
  Commander: "Comandante",
  "Orbital legend": "Lenda orbital",
};

export const BADGE_PT: Record<string, { title: string; description: string }> = {
  orbit: { title: "Primeira órbita", description: "Fez o primeiro check-in" },
  week: { title: "Semana em órbita", description: "7 dias de ofensiva" },
  fortnight: { title: "Quinzena estelar", description: "15 dias de ofensiva" },
  water: { title: "Hidratado em microgravidade", description: "Bateu 2 L em um dia" },
  ared: { title: "Atleta da ARED", description: "2 h de treino em um dia" },
  calm: { title: "Mente calma", description: "Concluiu uma pausa de respiração" },
  overview: { title: "Efeito Overview", description: "Contemplou a Terra pela Cúpula" },
  bridge: { title: "Ponte com a Terra", description: "Conversou com quem ama" },
  full: { title: "Dia completo", description: "Todas as missões de um dia" },
  commander: { title: "Comandante", description: "Chegou a 3.000 XP" },
};

export const CHALLENGE_PT: Record<string, { title: string; unit: string }> = {
  sleep: { title: "Dormir 7 h ou mais em 5 noites", unit: "noites" },
  water: { title: "Bater a meta de água em 5 dias", unit: "dias" },
  pause: { title: "Pausa para a mente em 7 dias", unit: "dias" },
  crew: { title: "Tripulação: 4.000 min de treino juntos", unit: "min" },
};

// Same order as GRATITUDE_OPTIONS in gamification.ts.
export const GRATITUDE_PT = [
  "Minha família",
  "A vista da Terra",
  "Minha equipe",
  "Um treino bom",
  "Uma refeição gostosa",
  "Um experimento que deu certo",
  "Uma boa noite de sono",
  "Uma mensagem de casa",
  "Música",
  "Aprender algo novo",
];

export const REFERENCE_PT: Record<string, { section: string; claim: string; limitation: string; pageDate: string }> = {
  "nasa-hazards": {
    section: "Human Research Program",
    claim:
      "A NASA organiza cinco hazards do voo espacial humano: radiação, isolamento e confinamento, distância da Terra, campos gravitacionais e ambientes hostis ou fechados (temperatura, pressão, iluminação, ruído, micróbios).",
    limitation: "Descreve categorias. Não traz leituras individuais, limites ou limiares seguros.",
    pageDate: "atualizada em 2026-06-12",
  },
  "nasa-risks": {
    section: "Sono, cardiovascular, imunidade, vestibular, radiação, EVA",
    claim:
      "Sono inadequado e horários irregulares aparecem como fatores que podem afetar saúde e segurança. A página também descreve adaptações cardiovasculares, resposta imune alterada, efeitos sensório-motores e risco de câncer induzido por radiação.",
    limitation: "“Risco descrito” não é resultado observado em você. Não há escala numérica nem diagnóstico.",
    pageDate: "atualizada em 2026-07-21",
  },
  "nasa-ongoing": {
    section: "ARCHeR (Artemis II), Immune Biomarkers e outros",
    claim:
      "O ARCHeR, na Artemis II, estuda bem-estar, atividade e padrões de sono. Outros projetos analisam sangue e saliva, alterações cérebro/olhos e transições de gravidade.",
    limitation: "É agenda de pesquisa. O Astra não importa resultados desses estudos nem está ligado a eles.",
    pageDate: "atualizada em 2026-08-18",
  },
  "csa-radiation": {
    section: "Crew Active Neutron Spectrometer (CANS)",
    claim: "A Agência Espacial Canadense descreve o CANS, instrumento compacto em desenvolvimento para medir exposição a nêutrons no espaço.",
    limitation: "O CANS não está conectado ao Astra. A dose exibida na demo é simulada.",
    pageDate: "2026-02-26",
  },
  "csa-science": {
    section: "Missões de longa duração",
    claim: "Missões mais longas envolvem gravidade alterada, radiação, isolamento, atraso de comunicação e mais autonomia em relação à Terra.",
    limitation: "Contexto qualitativo. Não calcula dano nem prontidão.",
    pageDate: "modificada em 2025-10-28",
  },
};

export const HAZARD_PT: Record<Hazard, string> = {
  radiation: "Radiação",
  isolation: "Isolamento e confinamento",
  distance: "Distância da Terra",
  gravity: "Campos gravitacionais",
  environment: "Ambiente hostil/fechado",
};

export const REFERENCE_KIND_PT: Record<Reference["kind"], string> = {
  "described risk": "risco descrito",
  "ongoing research": "pesquisa em andamento",
  "technology in development": "tecnologia em desenvolvimento",
  "mission context": "contexto de missão",
};

export const STATUS_PT: Record<ConnectorStatus, string> = {
  self_report: "Autorrelato",
  simulated: "Simulado",
  roadmap: "Roadmap",
  needs_authorization: "Requer autorização",
};

// Uppercase status (same role as STATUS_LABEL in integrations.ts).
export const STATUS_LABEL_PT: Record<ConnectorStatus, string> = {
  self_report: "AUTORRELATO",
  simulated: "SIMULADO",
  roadmap: "ROADMAP",
  needs_authorization: "REQUER AUTORIZAÇÃO",
};

export const KIND_PT: Record<ConnectorKind, string> = {
  wearable: "Vestível",
  instrument: "Instrumento",
  environment: "Ambiente da nave",
  training: "Equipamento de treino",
  study: "Estudo científico",
  self_report: "Autorrelato",
};

export const CONNECTOR_PT: Record<string, { name: string; measures: string; sourceNote: string }> = {
  "astra-checkin": {
    name: "Check-in Astra",
    measures: "Sono, energia, humor, estresse, propósito e hábitos registrados pelas missões.",
    sourceNote: "Dado digitado pelo próprio tripulante no app.",
  },
  "bio-monitor": {
    name: "Bio-Monitor (camiseta Astroskin)",
    measures: "Frequência cardíaca, variabilidade, respiração, SpO₂, pressão e temperatura da pele.",
    sourceNote: "Sistema vestível da Agência Espacial Canadense usado na ISS. Link oficial ainda a confirmar pela equipe.",
  },
  cgm: {
    name: "Monitor contínuo de glicose",
    measures: "Glicose intersticial a cada poucos minutos.",
    sourceNote: "Classe de dispositivo comercial. Uso em voo depende de aprovação da missão.",
  },
  dosimeter: {
    name: "Dosímetro pessoal ativo",
    measures: "Dose de radiação absorvida pelo tripulante.",
    sourceNote: "Classe de instrumento. Valores da demo são fictícios.",
  },
  cans: {
    name: "CANS · Crew Active Neutron Spectrometer",
    measures: "Exposição a nêutrons (instrumento em desenvolvimento).",
    sourceNote: "Em desenvolvimento segundo a CSA. Sem dados disponíveis para o Astra.",
  },
  eclss: {
    name: "ECLSS · suporte de vida da estação",
    measures: "CO₂ e condições do ar da cabine.",
    sourceNote: "Sistema de controle ambiental e suporte de vida. Integração exige autorização da missão.",
  },
  ared: {
    name: "ARED e esteira",
    measures: "Minutos de treino resistido e aeróbico.",
    sourceNote: "Equipamentos de exercício da ISS. Registro de minutos simulado.",
  },
  archer: {
    name: "ARCHeR · Artemis Research for Crew Health and Readiness",
    measures: "Bem-estar, atividade e padrões de sono (actigrafia) na Artemis II.",
    sourceNote: "Estudo em andamento. Resultados não são públicos nem importados.",
  },
  "demo-scenario": {
    name: "Cenário demo · autorrelatos simulados",
    measures: "Histórico fictício de check-ins e hábitos (cenário de 72 h da especificação base).",
    sourceNote: "Gerado pela demo para contar a história dos últimos dias. Não foi digitado por ninguém.",
  },
};

export const MISSION_NAME_PT = "Missão demo ASTRA-1";
