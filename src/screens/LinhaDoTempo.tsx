import { useState } from "react";
import {
  Check,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  Inbox,
  LifeBuoy,
  NotebookPen,
  Plug,
  RotateCcw,
  RotateCw,
  Send,
  Target,
  TriangleAlert,
  Wifi,
  WifiOff,
  type LucideIcon,
} from "lucide-react";
import { useStore } from "../store";
import { Icon } from "../components/Icon";
import { OriginTag, fmtDateTime, relTime } from "../components/ui";
import { indicator, formatValue } from "../domain/indicators";
import { connector } from "../domain/integrations";
import type { Observation, SyncEvent, SyncState } from "../domain/types";
import "./LinhaDoTempo.css";

// REQ-8.3–8.6: fila de envio simulada, registros locais, legenda de origens e reinício da demo.
// Estados da fila (PENDING/READY/SYNCED/FAILED) com nomes em português e cores neutras; só a falha usa o destaque.

type View = "registros" | "fila";

const STATE_LABEL: Record<SyncState, string> = {
  local_only: "Só local",
  pending: "Pendente",
  ready: "Pronto",
  synced: "Sincronizado",
  failed: "Falhou",
};

const STATE_HELP: Record<SyncState, string> = {
  local_only: "Só neste aparelho",
  pending: "Aguardando o enlace",
  ready: "Pronto para enviar",
  synced: "Recebido na Terra",
  failed: "Envio não confirmado",
};

const STATE_ICON: Record<SyncState, LucideIcon> = {
  local_only: Clock3,
  pending: Clock3,
  ready: Send,
  synced: Check,
  failed: TriangleAlert,
};

const TYPE_ICON: Record<SyncEvent["type"], LucideIcon> = {
  check_in: ClipboardCheck,
  mission_done: Target,
  support_request: LifeBuoy,
};

const COUNTED: SyncState[] = ["pending", "ready", "synced", "failed"];

interface Group {
  key: string;
  at: string;
  source: string;
  items: Observation[];
}

function groupRecords(manual: Observation[], live: Observation[]): Group[] {
  const map = new Map<string, Group>();
  for (const o of [...manual, ...live]) {
    const src = o.sourceRef ?? o.origin;
    const key = `${o.observedAt}|${src}`;
    const g = map.get(key) ?? { key, at: o.observedAt, source: src, items: [] };
    g.items.push(o);
    map.set(key, g);
  }
  return [...map.values()].sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
}

const shortKey = (k: string) => (k.length > 14 ? `…${k.slice(-12)}` : k);

function Empty({ text }: { text: string }) {
  return (
    <div className="tl-empty">
      <Inbox size={32} aria-hidden />
      <p>{text}</p>
      <a className="btn btn--primary btn--sm" href="#/checkin">
        Fazer check-in
      </a>
    </div>
  );
}

export function LinhaDoTempo() {
  const { state, dispatch } = useStore();
  const [view, setView] = useState<View>("fila");
  const [confirmReset, setConfirmReset] = useState(false);

  const counts = Object.fromEntries(COUNTED.map((s) => [s, state.outbox.filter((e) => e.state === s).length])) as Record<SyncState, number>;
  const queue = [...state.outbox].reverse();
  const groups = groupRecords(state.manual, state.live);
  const LinkIcon = state.online ? Wifi : WifiOff;

  return (
    <div className="page ldt">
      <div className="page__head">
        <div>
          <h1>Linha do tempo</h1>
          <p>Tudo é salvo neste aparelho primeiro. O envio para a Terra é simulado.</p>
        </div>
      </div>

      <section className={`panel tl-link ${state.online ? "is-on" : "is-off"}`} aria-labelledby="tl-link-title">
        <div className="tl-link__status">
          <span className={`icon-tile ${state.online ? "icon-tile--corpo" : ""}`} aria-hidden>
            <LinkIcon size={20} />
          </span>
          <div className="tl-link__text">
            <h2 id="tl-link-title">Enlace com a Terra {state.online ? "online" : "offline"}</h2>
            <p className="muted small">
              {state.online
                ? "Eventos da fila sobem sozinhos: pendente, pronto, sincronizado."
                : "Sem enlace: os eventos ficam pendentes e sincronizam ao reconectar."}
            </p>
          </div>
          <button type="button" className={`btn btn--sm ${state.online ? "" : "btn--primary"}`} onClick={() => dispatch({ type: "toggleOnline" })}>
            {state.online ? (
              <>
                <WifiOff size={16} aria-hidden /> Ficar offline
              </>
            ) : (
              <>
                <Wifi size={16} aria-hidden /> Reconectar
              </>
            )}
          </button>
        </div>

        <div className="tl-switch">
          <button
            type="button"
            role="switch"
            aria-checked={state.failNext}
            aria-labelledby="tl-switch-label"
            className={`tl-switch__track ${state.failNext ? "is-on" : ""}`}
            onClick={() => dispatch({ type: "toggleFailNext" })}
          >
            <span className="tl-switch__thumb" />
          </button>
          <span className="tl-switch__text">
            <b id="tl-switch-label">Simular falha no próximo envio</b>
            <span className="muted small">O próximo evento pronto para envio vira falha.</span>
          </span>
        </div>

        <ul className="tl-counts" aria-label="Eventos por estado">
          {COUNTED.map((s) => {
            const I = STATE_ICON[s];
            return (
              <li key={s} className={`tl-count tl-count--${s}`}>
                <span className="tl-count__label small">
                  <I size={15} aria-hidden /> {STATE_LABEL[s]}
                </span>
                <b className="num">{counts[s]}</b>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="grid-2">
        <section className="panel tl-main" aria-labelledby="tl-main-title">
          <div className="panel__head">
            <h2 id="tl-main-title">{view === "fila" ? "Fila de envio" : "Registros neste aparelho"}</h2>
            <div className="tl-filters" role="group" aria-label="Mostrar">
              <button type="button" className={`chip ${view === "registros" ? "chip--on" : ""}`} aria-pressed={view === "registros"} onClick={() => setView("registros")}>
                <ClipboardList size={16} aria-hidden /> Registros <span className="num">({groups.length})</span>
              </button>
              <button type="button" className={`chip ${view === "fila" ? "chip--on" : ""}`} aria-pressed={view === "fila"} onClick={() => setView("fila")}>
                <Send size={16} aria-hidden /> Fila <span className="num">({state.outbox.length})</span>
              </button>
            </div>
          </div>

          {view === "fila" ? (
            queue.length === 0 ? (
              <Empty text="Fila vazia. Faça um check-in ou conclua uma missão para ver o envio acontecer." />
            ) : (
              <ol className="tl-queue">
                {queue.map((e) => {
                  const S = STATE_ICON[e.state];
                  const T = TYPE_ICON[e.type];
                  return (
                    <li key={e.eventId} className={`tl-event tl-event--${e.state}`}>
                      <span className="tl-event__marker" aria-hidden>
                        <S size={15} strokeWidth={2.5} />
                      </span>
                      <div className="tl-event__body">
                        <div className="tl-event__top">
                          <b className="tl-event__label">
                            <T size={17} aria-hidden className="tl-event__type" /> {e.label}
                          </b>
                          <span className={`tl-state tl-state--${e.state}`}>{STATE_LABEL[e.state]}</span>
                        </div>
                        <p className="tl-event__meta small">
                          <span className="num">
                            {fmtDateTime(e.createdAt)} · {relTime(e.createdAt)} · {STATE_HELP[e.state].toLowerCase()}
                          </span>
                        </p>
                        <details className="tl-event__tech small">
                          <summary>Detalhes do envio</summary>
                          <dl>
                            <div>
                              <dt>Tentativas</dt>
                              <dd className="num">{e.attempts}</dd>
                            </div>
                            <div>
                              <dt>Evento</dt>
                              <dd>{e.eventId}</dd>
                            </div>
                            <div>
                              <dt>Chave de idempotência</dt>
                              <dd title={e.idempotencyKey}>{shortKey(e.idempotencyKey)}</dd>
                            </div>
                          </dl>
                        </details>
                        {e.state === "failed" && (
                          <button type="button" className="btn btn--primary btn--sm tl-retry" onClick={() => dispatch({ type: "retry", eventId: e.eventId })}>
                            <RotateCw size={16} aria-hidden /> Tentar novamente
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )
          ) : groups.length === 0 ? (
            <Empty text="Nenhum registro seu ainda. Check-ins e leituras de “Sinais do dia” aparecem aqui." />
          ) : (
            <ol className="tl-records">
              {groups.map((g) => {
                const c = connector(g.source);
                const isManual = g.items[0].origin === "manual";
                const SrcIcon = isManual ? NotebookPen : Plug;
                return (
                  <li key={g.key} className="tl-group">
                    <div className="tl-group__head">
                      <b className="num">{fmtDateTime(g.at)}</b>
                      <span className="tl-group__src small">
                        <SrcIcon size={15} aria-hidden /> {c?.name ?? (isManual ? "Check-in Astra" : g.source)}
                      </span>
                    </div>
                    <ul className="tl-obs">
                      {g.items.map((o) => {
                        const def = indicator(o.indicatorCode);
                        return (
                          <li key={o.observationId}>
                            <span className="tl-obs__name">
                              <Icon name={def.icon} size={17} className="tl-obs__icon" /> {def.short}
                            </span>
                            <span className="tl-obs__val num">
                              {formatValue(o.value, o.indicatorCode)} {o.value !== null && <small>{def.unit}</small>}
                            </span>
                            <OriginTag o={o} />
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        <aside className="stack tl-aside">
          <section className="panel tl-legend" aria-labelledby="tl-legend-title">
            <h2 id="tl-legend-title">Legenda de origens</h2>
            <dl>
              <div>
                <dt>
                  <span className="tag tag--manual">Manual</span>
                </dt>
                <dd>Você registrou.</dd>
              </div>
              <div>
                <dt>
                  <span className="tag tag--sim">Simulado</span>
                </dt>
                <dd>Gerado pela demo; não é medida real.</dd>
              </div>
              <div>
                <dt>
                  <span className="tag tag--ext">Externo</span>
                </dt>
                <dd>Sistema externo autorizado; desligado na demo.</dd>
              </div>
              <div>
                <dt>
                  <span className="tag tag--missing">Ausente</span>
                </dt>
                <dd>Pulado ou não coletado; nunca vira zero.</dd>
              </div>
            </dl>
          </section>

          <section className="panel tl-reset" aria-labelledby="tl-reset-title">
            <h2 id="tl-reset-title">Reiniciar demo</h2>
            <p className="small muted">Apaga check-ins, missões, leituras e a fila deste navegador.</p>
            {confirmReset ? (
              <div className="tl-confirm" role="alertdialog" aria-labelledby="tl-confirm-text">
                <p id="tl-confirm-text" className="small">
                  <TriangleAlert size={18} aria-hidden />
                  <span>
                    <b>Tem certeza?</b> Isso não pode ser desfeito.
                  </span>
                </p>
                <div className="row">
                  <button
                    type="button"
                    className="btn btn--primary btn--sm"
                    onClick={() => {
                      dispatch({ type: "reset" });
                      setConfirmReset(false);
                    }}
                  >
                    Sim, apagar e reiniciar
                  </button>
                  <button type="button" className="btn btn--sm" onClick={() => setConfirmReset(false)} autoFocus>
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" className="btn btn--sm tl-reset__btn" onClick={() => setConfirmReset(true)}>
                <RotateCcw size={16} aria-hidden /> Reiniciar demo
              </button>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
