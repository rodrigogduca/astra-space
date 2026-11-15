import { useEffect, useRef } from "react";
import { useStore } from "../store";
import { Catro } from "./Catro";
import { useLang } from "../i18n/lang";

const T = {
  pt: {
    state: { local_only: "salvo só neste aparelho", pending: "na fila de envio", ready: "pronto para envio", synced: "recebido pelo canal do cirurgião de voo (simulado)", failed: "com falha no envio: tente de novo pela fila" },
    title: "Pedir apoio",
    today: "Pedido de hoje:",
    onTheWay: "Seu pedido já está a caminho. Você pode continuar usando o Astra normalmente.",
    channel: "Canal:",
    channelValue: "cirurgião de voo da missão",
    sim: "Simulado",
    channelNote: "Na missão real, o canal é configurado pela equipe médica.",
    whatLabel: "O que será enviado:",
    what: "só um pedido de contato. Seus registros de saúde não vão junto, a menos que você escolha depois.",
    noDiag: "O Astra não avalia gravidade nem faz diagnóstico. Em emergência, siga o procedimento da missão.",
    offlineLabel: "Sem enlace agora:",
    offline: "o pedido fica na fila e sai quando a conexão voltar.",
    close: "Fechar",
    notNow: "Agora não",
    again: "Pedir de novo",
    confirm: "Confirmar pedido",
  },
  en: {
    state: { local_only: "saved only on this device", pending: "in the send queue", ready: "ready to send", synced: "received by the flight surgeon channel (simulated)", failed: "failed to send: try again from the queue" },
    title: "Ask for support",
    today: "Today's request:",
    onTheWay: "Your request is already on its way. You can keep using Astra as usual.",
    channel: "Channel:",
    channelValue: "the mission flight surgeon",
    sim: "Simulated",
    channelNote: "In a real mission, the channel is set up by the medical team.",
    whatLabel: "What will be sent:",
    what: "only a contact request. Your health records do not go with it unless you choose so later.",
    noDiag: "Astra does not assess severity or make diagnoses. In an emergency, follow the mission procedure.",
    offlineLabel: "No link right now:",
    offline: "the request waits in the queue and goes out when the connection is back.",
    close: "Close",
    notNow: "Not now",
    again: "Ask again",
    confirm: "Confirm request",
  },
};

// REQ-9: request for human support. Native <dialog> opened with showModal(): the browser handles focus,
// inert page, Esc/back gesture, and returns focus to the opener (modern-web-guidance: dialog).
export function SupportDialog({ onClose }: { onClose: () => void }) {
  const { state, dispatch, supportEvent } = useStore();
  const t = useLang().pick(T);
  const ref = useRef<HTMLDialogElement>(null);
  const pending = supportEvent && supportEvent.state !== "synced" && supportEvent.state !== "failed";

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (!d.open) d.showModal();
    d.addEventListener("close", onClose);
    return () => d.removeEventListener("close", onClose);
  }, [onClose]);

  return (
    <dialog ref={ref} className="dialog" aria-labelledby="support-title" closedby="any">
      <div className="row" style={{ marginBottom: 10 }}>
        <Catro mood="calm" size={60} />
        <h2 id="support-title">{t.title}</h2>
      </div>
      {supportEvent && (
        <p className="small" style={{ marginBottom: 12 }}>
          <b>{t.today}</b> {t.state[supportEvent.state]}.
        </p>
      )}
      {pending ? (
        <p>{t.onTheWay}</p>
      ) : (
        <div className="stack">
          <p>
            <b>{t.channel}</b> {t.channelValue} <span className="tag tag--simulated">{t.sim}</span>
            <br />
            <span className="muted small">{t.channelNote}</span>
          </p>
          <p>
            <b>{t.whatLabel}</b> {t.what}
          </p>
          <p className="muted small">{t.noDiag}</p>
          {!state.online && (
            <p className="small">
              <b>{t.offlineLabel}</b> {t.offline}
            </p>
          )}
        </div>
      )}
      <form method="dialog" className="row" style={{ justifyContent: "flex-end", marginTop: 20 }}>
        <button type="submit" value="cancel" className="btn btn--ghost" autoFocus>
          {pending ? t.close : t.notNow}
        </button>
        {!pending && (
          <button type="submit" value="confirm" className="btn btn--primary" onClick={() => dispatch({ type: "requestSupport" })}>
            {supportEvent ? t.again : t.confirm}
          </button>
        )}
      </form>
    </dialog>
  );
}
