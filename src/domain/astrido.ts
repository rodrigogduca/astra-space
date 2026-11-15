import type { Observation, SyncState } from "./types";
import type { AstridoMood } from "../components/Astrido";
import { MISSIONS, doneCount, type MissionId, type TodayState } from "./gamification";
import { trendForLatestOrigin } from "./trend";
import { formatValue } from "./indicators";

// Fala do Astrido (REQ-4). Descreve o que foi registrado; nunca usa "risco", "piora" ou causa.

export type AstridoAction = { label: string; to?: string; support?: boolean; primary?: boolean };

export interface AstridoLine {
  mood: AstridoMood;
  text: string;
  actions: AstridoAction[];
}

const MISSION_ROUTE: Partial<Record<MissionId, string>> = {
  checkin: "#/checkin",
  evening: "#/noturno",
  breathe: "#/respirar",
  gratitude: "#/gratidao",
};

export function astridoSays(input: {
  today: TodayState;
  sleep: Observation[];
  online: boolean;
  support?: SyncState; // estado do pedido de apoio de hoje na fila, se houver
  hour: number;
}): AstridoLine {
  const { today, sleep, online, support, hour } = input;
  const done = doneCount(today);

  // Só fala do apoio enquanto o pedido não foi confirmado; depois volta ao fluxo normal.
  if (support === "failed") {
    return {
      mood: "calm",
      text: "O envio do seu pedido de apoio falhou. Ele continua salvo aqui: tente de novo pela fila.",
      actions: [{ label: "Ver fila", to: "#/linha-do-tempo", primary: true }],
    };
  }
  if (support && support !== "synced") {
    return {
      mood: "calm",
      text: online
        ? "Seu pedido de apoio está na fila, a caminho do cirurgião de voo. Enquanto isso, que tal uma pausa de respiração comigo?"
        : "Seu pedido de apoio está salvo na fila e sai assim que o enlace com a Terra voltar.",
      actions: [{ label: "Respirar 1 min", to: "#/respirar", primary: true }, { label: "Ver fila", to: "#/linha-do-tempo" }],
    };
  }

  if (done === MISSIONS.length) {
    return { mood: "excited", text: "Dia completo! Corpo, mente e espírito em dia. Você é uma estrela de verdade.", actions: [{ label: "Ver conquistas", to: "#/desafios", primary: true }] };
  }

  if (!today.done.checkin) {
    const last3 = sleep.filter((o) => o.qualityState === "valid").slice(-3);
    const { trend } = trendForLatestOrigin(last3);
    if (trend.state === "descriptive_only" && trend.direction === "down") {
      const serie = last3.map((o) => `${formatValue(o.value, "sleep_duration")} h`).join(" → ");
      const sim = last3.every((o) => o.isSynthetic) ? ", simulado" : "";
      return {
        mood: "thinking",
        text: `Seu sono vem diminuindo (${serie}${sim}). É só o que foi registrado, não um diagnóstico. Vamos ao check-in?`,
        actions: [
          { label: "Fazer check-in", to: "#/checkin", primary: true },
          { label: "Ver detalhe", to: "#/prontuario/sleep_duration" },
          { label: "Quero apoio", support: true },
        ],
      };
    }
  }

  if (!online) {
    return {
      mood: "calm",
      text: "Estamos sem enlace com a Terra agora. Tudo o que você fizer fica salvo aqui e entra na fila de envio.",
      actions: [{ label: "Ver fila", to: "#/linha-do-tempo", primary: true }],
    };
  }

  const next = MISSIONS.find((m) => !today.done[m.id]);
  if (!next) return { mood: "happy", text: "Tudo certo por aqui!", actions: [] };
  const greet = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const lead = done === 0 ? `${greet}! Bora começar a jornada de hoje?` : `Mandou bem! ${done} de ${MISSIONS.length} missões feitas.`;
  return {
    mood: hour >= 22 || hour < 5 ? "sleepy" : "happy",
    text: `${lead} Próxima: ${next.title.toLowerCase()}.`,
    actions: MISSION_ROUTE[next.id] ? [{ label: "Começar", to: MISSION_ROUTE[next.id], primary: true }] : [],
  };
}
