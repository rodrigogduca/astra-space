// Biblioteca de evidências NASA/CSA (seções 7, 8 e 24 da especificação).
// São contexto citável: nunca preenchem um campo de saúde nem viram limiar.

export type Hazard = "radiacao" | "isolamento" | "distancia" | "gravidade" | "ambiente";

export interface Reference {
  id: string;
  institution: "NASA" | "CSA";
  title: string;
  section: string;
  claim: string;
  limitation: string;
  hazards: Hazard[];
  kind: "risco descrito" | "pesquisa em andamento" | "tecnologia em desenvolvimento" | "contexto de missão";
  url: string;
  pageDate: string;
}

export const HAZARD_LABEL: Record<Hazard, string> = {
  radiacao: "Radiação",
  isolamento: "Isolamento e confinamento",
  distancia: "Distância da Terra",
  gravidade: "Campos gravitacionais",
  ambiente: "Ambiente hostil/fechado",
};

export const REFERENCES: Reference[] = [
  {
    id: "nasa-hazards",
    institution: "NASA",
    title: "5 Hazards of Human Spaceflight",
    section: "Human Research Program",
    claim:
      "A NASA organiza cinco hazards do voo espacial humano: radiação, isolamento e confinamento, distância da Terra, campos gravitacionais e ambientes hostis ou fechados (temperatura, pressão, iluminação, ruído, micróbios).",
    limitation: "Descreve categorias. Não traz leituras individuais, limites ou limiares seguros.",
    hazards: ["radiacao", "isolamento", "distancia", "gravidade", "ambiente"],
    kind: "risco descrito",
    url: "https://www.nasa.gov/hrp/hazards/",
    pageDate: "atualizada em 2026-06-12",
  },
  {
    id: "nasa-risks",
    institution: "NASA",
    title: "Risks of Human Spaceflight",
    section: "Sono, cardiovascular, imunidade, vestibular, radiação, EVA",
    claim:
      "Sono inadequado e horários irregulares aparecem como fatores que podem afetar saúde e segurança. A página também descreve adaptações cardiovasculares, resposta imune alterada, efeitos sensório-motores e risco de câncer induzido por radiação.",
    limitation: "“Risco descrito” não é resultado observado em você. Não há escala numérica nem diagnóstico.",
    hazards: ["radiacao", "gravidade", "isolamento"],
    kind: "risco descrito",
    url: "https://www.nasa.gov/hrp/risks/",
    pageDate: "atualizada em 2026-07-21",
  },
  {
    id: "nasa-ongoing",
    institution: "NASA",
    title: "Ongoing HRP Research in Space",
    section: "ARCHeR (Artemis II), Immune Biomarkers e outros",
    claim:
      "O ARCHeR, na Artemis II, estuda bem-estar, atividade e padrões de sono. Outros projetos analisam sangue e saliva, alterações cérebro/olhos e transições de gravidade.",
    limitation: "É agenda de pesquisa. O Astra não importa resultados desses estudos nem está ligado a eles.",
    hazards: ["isolamento", "gravidade"],
    kind: "pesquisa em andamento",
    url: "https://www.nasa.gov/hrp/ongoing-hrp-research/",
    pageDate: "atualizada em 2026-08-18",
  },
  {
    id: "csa-radiation",
    institution: "CSA",
    title: "Monitoring radiation for astronaut health",
    section: "Crew Active Neutron Spectrometer (CANS)",
    claim:
      "A Agência Espacial Canadense descreve o CANS, instrumento compacto em desenvolvimento para medir exposição a nêutrons no espaço.",
    limitation: "O CANS não está conectado ao Astra. A dose exibida na demo é simulada.",
    hazards: ["radiacao"],
    kind: "tecnologia em desenvolvimento",
    url: "https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp",
    pageDate: "2026-02-26",
  },
  {
    id: "csa-science",
    institution: "CSA",
    title: "Why do we conduct science experiments in space?",
    section: "Missões de longa duração",
    claim:
      "Missões mais longas envolvem gravidade alterada, radiação, isolamento, atraso de comunicação e mais autonomia em relação à Terra.",
    limitation: "Contexto qualitativo. Não calcula dano nem prontidão.",
    hazards: ["gravidade", "radiacao", "isolamento", "distancia"],
    kind: "contexto de missão",
    url: "https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp",
    pageDate: "modificada em 2025-10-28",
  },
];

export const CHALLENGE_URL = "https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/";

export const refById = (id: string) => REFERENCES.find((r) => r.id === id);
