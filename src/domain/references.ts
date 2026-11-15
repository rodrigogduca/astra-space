// NASA/CSA evidence library (specification sections 7, 8 and 24).
// It is citable context: it never fills a health field and never becomes a threshold.

export type Hazard = "radiation" | "isolation" | "distance" | "gravity" | "environment";

export interface Reference {
  id: string;
  institution: "NASA" | "CSA";
  title: string;
  section: string;
  claim: string;
  limitation: string;
  hazards: Hazard[];
  kind: "described risk" | "ongoing research" | "technology in development" | "mission context";
  url: string;
  pageDate: string;
}

export const HAZARD_LABEL: Record<Hazard, string> = {
  radiation: "Radiation",
  isolation: "Isolation and confinement",
  distance: "Distance from Earth",
  gravity: "Gravity fields",
  environment: "Hostile/closed environment",
};

export const REFERENCES: Reference[] = [
  {
    id: "nasa-hazards",
    institution: "NASA",
    title: "5 Hazards of Human Spaceflight",
    section: "Human Research Program",
    claim:
      "NASA groups the hazards of human spaceflight into five: radiation, isolation and confinement, distance from Earth, gravity fields, and hostile or closed environments (temperature, pressure, lighting, noise, microbes).",
    limitation: "Describes categories. It gives no individual readings, limits or safe thresholds.",
    hazards: ["radiation", "isolation", "distance", "gravity", "environment"],
    kind: "described risk",
    url: "https://www.nasa.gov/hrp/hazards/",
    pageDate: "updated 2026-06-12",
  },
  {
    id: "nasa-risks",
    institution: "NASA",
    title: "Risks of Human Spaceflight",
    section: "Sleep, cardiovascular, immunity, vestibular, radiation, EVA",
    claim:
      "Inadequate sleep and irregular schedules appear as factors that can affect health and safety. The page also describes cardiovascular adaptations, altered immune response, sensorimotor effects and radiation-induced cancer risk.",
    limitation: "A “described risk” is not a result observed in you. There is no numeric scale and no diagnosis.",
    hazards: ["radiation", "gravity", "isolation"],
    kind: "described risk",
    url: "https://www.nasa.gov/hrp/risks/",
    pageDate: "updated 2026-07-21",
  },
  {
    id: "nasa-ongoing",
    institution: "NASA",
    title: "Ongoing HRP Research in Space",
    section: "ARCHeR (Artemis II), Immune Biomarkers and others",
    claim:
      "ARCHeR, on Artemis II, studies well-being, activity and sleep patterns. Other projects analyze blood and saliva, brain/eye changes and gravity transitions.",
    limitation: "It is a research agenda. Astra does not import results from these studies and is not connected to them.",
    hazards: ["isolation", "gravity"],
    kind: "ongoing research",
    url: "https://www.nasa.gov/hrp/ongoing-hrp-research/",
    pageDate: "updated 2026-08-18",
  },
  {
    id: "csa-radiation",
    institution: "CSA",
    title: "Monitoring radiation for astronaut health",
    section: "Crew Active Neutron Spectrometer (CANS)",
    claim: "The Canadian Space Agency describes CANS, a compact instrument in development to measure neutron exposure in space.",
    limitation: "CANS is not connected to Astra. The dose shown in the demo is simulated.",
    hazards: ["radiation"],
    kind: "technology in development",
    url: "https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp",
    pageDate: "2026-02-26",
  },
  {
    id: "csa-science",
    institution: "CSA",
    title: "Why do we conduct science experiments in space?",
    section: "Long-duration missions",
    claim: "Longer missions involve altered gravity, radiation, isolation, communication delay and more autonomy from Earth.",
    limitation: "Qualitative context. It does not compute harm or readiness.",
    hazards: ["gravity", "radiation", "isolation", "distance"],
    kind: "mission context",
    url: "https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp",
    pageDate: "modified 2025-10-28",
  },
];

export const CHALLENGE_URL = "https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/";

export const refById = (id: string) => REFERENCES.find((r) => r.id === id);
