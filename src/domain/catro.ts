import type { Observation, SyncState } from "./types";
import type { CatroMood } from "../components/Catro";
import { MISSIONS, doneCount, type MissionId, type TodayState } from "./gamification";
import { trendForLatestOrigin } from "./trend";
import { formatValue } from "./indicators";
import { MISSION_PT } from "./pt";

// Catro's line (REQ-4). It describes what was logged; it never uses "risk", "worse" or causes.

export type CatroAction = { label: string; to?: string; support?: boolean; primary?: boolean };

export interface CatroLine {
  mood: CatroMood;
  text: string;
  actions: CatroAction[];
}

const MISSION_ROUTE: Partial<Record<MissionId, string>> = {
  checkin: "#/checkin",
  evening: "#/evening",
  breathe: "#/breathe",
  gratitude: "#/gratitude",
};

export function catroSays(input: {
  today: TodayState;
  sleep: Observation[];
  online: boolean;
  support?: SyncState; // state of today's support request in the queue, if any
  hour: number;
  lang?: "en" | "pt"; // English by default
}): CatroLine {
  const { today, sleep, online, support, hour } = input;
  const en = input.lang !== "pt";
  const L = (pt: string, eng: string) => (en ? eng : pt);
  const done = doneCount(today);

  // Only talks about support while the request is not confirmed; then it goes back to the normal flow.
  if (support === "failed") {
    return {
      mood: "calm",
      text: L("O envio do seu pedido de apoio falhou. Ele continua salvo aqui: tente de novo pela fila.", "Sending your support request failed. It is still saved here: try again from the queue."),
      actions: [{ label: L("Ver fila", "View queue"), to: "#/queue", primary: true }],
    };
  }
  if (support && support !== "synced") {
    return {
      mood: "calm",
      text: online
        ? L("Seu pedido de apoio está na fila, a caminho do cirurgião de voo. Enquanto isso, que tal uma pausa de respiração comigo?", "Your support request is in the queue, on its way to the flight surgeon. Meanwhile, how about a breathing break with me?")
        : L("Seu pedido de apoio está salvo na fila e sai assim que o enlace com a Terra voltar.", "Your support request is saved in the queue and goes out as soon as the link to Earth is back."),
      actions: [{ label: L("Respirar 1 min", "Breathe 1 min"), to: "#/breathe", primary: true }, { label: L("Ver fila", "View queue"), to: "#/queue" }],
    };
  }

  if (done === MISSIONS.length) {
    return { mood: "excited", text: L("Dia completo! Corpo, mente e espírito em dia. Missão do dia cumprida, Polaris.", "Full day! Body, mind and spirit on track. Mission accomplished, Polaris."), actions: [{ label: L("Ver conquistas", "See achievements"), to: "#/challenges", primary: true }] };
  }

  if (!today.done.checkin) {
    const last3 = sleep.filter((o) => o.qualityState === "valid").slice(-3);
    const { trend } = trendForLatestOrigin(last3);
    if (trend.state === "descriptive_only" && trend.direction === "down") {
      const series = last3.map((o) => `${formatValue(o.value, "sleep_duration")} h`).join(" → ");
      const simNote = last3.every((o) => o.isSynthetic) ? L(", simulado", ", simulated") : "";
      return {
        mood: "thinking",
        text: L(
          `Seu sono vem diminuindo (${series}${simNote}). É só o que foi registrado, não um diagnóstico. Vamos ao check-in?`,
          `Your sleep has been going down (${series}${simNote}). That is only what was logged, not a diagnosis. Shall we check in?`,
        ),
        actions: [
          { label: L("Fazer check-in", "Check in"), to: "#/checkin", primary: true },
          { label: L("Ver detalhe", "See details"), to: "#/health/sleep_duration" },
          { label: L("Quero apoio", "I want support"), support: true },
        ],
      };
    }
  }

  if (!online) {
    return {
      mood: "calm",
      text: L("Estamos sem enlace com a Terra agora. Tudo o que você fizer fica salvo aqui e entra na fila de envio.", "We have no link to Earth right now. Everything you do is saved here and goes into the send queue."),
      actions: [{ label: L("Ver fila", "View queue"), to: "#/queue", primary: true }],
    };
  }

  const next = MISSIONS.find((m) => !today.done[m.id]);
  if (!next) return { mood: "happy", text: L("Tudo certo por aqui!", "All good here!"), actions: [] };
  const greet = hour < 12 ? L("Bom dia", "Good morning") : hour < 18 ? L("Boa tarde", "Good afternoon") : L("Boa noite", "Good evening");
  const lead =
    done === 0
      ? L(`${greet}! Bora começar a jornada de hoje?`, `${greet}! Ready to start today's journey?`)
      : L(`Mandou bem! ${done} de ${MISSIONS.length} missões feitas.`, `Nice work! ${done} of ${MISSIONS.length} missions done.`);
  const nextTitle = en ? next.title : MISSION_PT[next.id].title;
  return {
    mood: hour >= 22 || hour < 5 ? "sleepy" : "happy",
    text: `${lead} ${L("Próxima", "Next")}: ${nextTitle.toLowerCase()}.`,
    actions: MISSION_ROUTE[next.id] ? [{ label: L("Começar", "Start"), to: MISSION_ROUTE[next.id], primary: true }] : [],
  };
}
