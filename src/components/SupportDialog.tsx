import { useEffect, useRef } from "react";
import { useStore } from "../store";
import { Astrido } from "./Astrido";

const STATE_TEXT = {
  local_only: "salvo só neste aparelho",
  pending: "na fila de envio",
  ready: "pronto para envio",
  synced: "recebido pelo canal do cirurgião de voo (simulado)",
  failed: "com falha no envio: tente de novo pela fila",
} as const;

// REQ-9: pedido de apoio humano. <dialog> nativo aberto com showModal(): o navegador dá foco,
// página inerte, Esc/gesto de voltar e devolve o foco a quem abriu (modern-web-guidance: dialog).
export function SupportDialog({ onClose }: { onClose: () => void }) {
  const { state, dispatch, supportEvent } = useStore();
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
        <Astrido mood="calm" size={60} />
        <h2 id="support-title">Pedir apoio</h2>
      </div>
      {supportEvent && (
        <p className="small" style={{ marginBottom: 12 }}>
          <b>Pedido de hoje:</b> {STATE_TEXT[supportEvent.state]}.
        </p>
      )}
      {pending ? (
        <p>Seu pedido já está a caminho. Você pode continuar usando o Astra normalmente.</p>
      ) : (
        <div className="stack">
          <p>
            <b>Canal:</b> cirurgião de voo da missão <span className="tag tag--sim">Simulado</span>
            <br />
            <span className="muted small">Na missão real, o canal é configurado pela equipe médica.</span>
          </p>
          <p>
            <b>O que será enviado:</b> só um pedido de contato. Seus registros de saúde <b>não</b> vão junto, a menos que você escolha
            depois.
          </p>
          <p className="muted small">O Astra não avalia gravidade nem faz diagnóstico. Em emergência, siga o procedimento da missão.</p>
          {!state.online && (
            <p className="small">
              <b>Sem enlace agora:</b> o pedido fica na fila e sai quando a conexão voltar.
            </p>
          )}
        </div>
      )}
      <form method="dialog" className="row" style={{ justifyContent: "flex-end", marginTop: 20 }}>
        <button type="submit" value="cancel" className="btn btn--ghost" autoFocus>
          {pending ? "Fechar" : "Agora não"}
        </button>
        {!pending && (
          <button type="submit" value="confirm" className="btn btn--primary" onClick={() => dispatch({ type: "requestSupport" })}>
            {supportEvent ? "Pedir de novo" : "Confirmar pedido"}
          </button>
        )}
      </form>
    </dialog>
  );
}
