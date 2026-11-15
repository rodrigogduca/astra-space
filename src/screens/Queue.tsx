import { useState, type CSSProperties } from "react";
import {
  CircleCheck,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  Hourglass,
  Tags,
  LifeBuoy,
  NotebookPen,
  Plug,
  Radiation,
  RotateCcw,
  RotateCw,
  Send,
  SatelliteDish,
  Target,
  TriangleAlert,
  Wifi,
  WifiOff,
  type LucideIcon,
} from "lucide-react";
import { useStore } from "../store";
import { Icon } from "../components/Icon";
import { Catro, type CatroMood } from "../components/Catro";
import { AstraSymbol } from "../components/Logo";
import { OriginTag, fmtDateTime, relTime } from "../components/ui";
import { indicator, formatValue } from "../domain/indicators";
import { INDICATOR_TINT } from "../components/tints";
import type { Observation, SyncEvent, SyncState } from "../domain/types";
import { MISSIONS, type MissionId } from "../domain/gamification";
import { useLang } from "../i18n/lang";
import { useDomainText } from "../i18n/domainText";
import "./Queue.css";

// REQ-8.3–8.6: simulated send queue, local records, origin legend and demo reset.
// Queue states (PENDING/READY/SYNCED/FAILED) with localized names, an icon and their own vivid color
// (amber, blue, green, pink-red). The state text always accompanies the color.

type View = "records" | "queue";

const T = {
  pt: {
    state: { local_only: "Só local", pending: "Pendente", ready: "Pronto", synced: "Sincronizado", failed: "Falhou" } as Record<SyncState, string>,
    help: {
      local_only: "Só neste aparelho",
      pending: "Aguardando o enlace",
      ready: "Pronto para enviar",
      synced: "Recebido na Terra",
      failed: "Envio não confirmado",
    } as Record<SyncState, string>,
    checkIn: "Fazer check-in",
    supportEvent: "Pedido de apoio ao cirurgião de voo",
    checkInEvent: "Check-in",
    missionDone: (title: string, xp: number) => `Missão concluída: ${title} (+${xp} XP)`,
    title: "Linha do tempo",
    lead: "Tudo é salvo neste aparelho primeiro. O envio para a Terra é simulado.",
    linkOn: "Enlace com a Terra online",
    linkOff: "Enlace com a Terra offline",
    onText: "Eventos da fila sobem sozinhos: pendente, pronto, sincronizado.",
    offText: "Sem enlace: os eventos ficam pendentes e sincronizam ao reconectar.",
    goOffline: "Ficar offline",
    reconnect: "Reconectar",
    failNext: "Simular falha no próximo envio",
    failNextText: "O próximo evento pronto para envio vira falha.",
    byState: "Eventos por estado",
    queueTitle: "Fila de envio",
    recordsTitle: "Registros neste aparelho",
    show: "Mostrar",
    records: "Registros",
    queue: "Fila",
    emptyQueue: "Fila vazia por aqui. Faça um check-in e acompanhe o envio para a Terra.",
    sendDetails: "Detalhes do envio",
    attempts: "Tentativas",
    event: "Evento",
    idemKey: "Chave de idempotência",
    retry: "Tentar novamente",
    emptyRecords: "Nenhum registro seu ainda. Seus check-ins aparecem aqui.",
    astraCheckIn: "Check-in Astra",
    legend: "Legenda de origens",
    lg: {
      manual: ["Manual", "Você registrou."],
      sim: ["Simulado", "Gerado pela demo; não é medida real."],
      ext: ["Externo", "Sistema externo autorizado; desligado na demo."],
      missing: ["Ausente", "Pulado ou não coletado; nunca vira zero."],
    },
    reset: "Reiniciar demo",
    resetText: "Apaga check-ins, missões, leituras e a fila deste navegador.",
    sure: "Tem certeza?",
    undo: "Isso não pode ser desfeito.",
    yesReset: "Sim, apagar e reiniciar",
    cancel: "Cancelar",
  },
  en: {
    state: { local_only: "Local only", pending: "Pending", ready: "Ready", synced: "Synced", failed: "Failed" } as Record<SyncState, string>,
    help: {
      local_only: "Only on this device",
      pending: "Waiting for the link",
      ready: "Ready to send",
      synced: "Received on Earth",
      failed: "Delivery not confirmed",
    } as Record<SyncState, string>,
    checkIn: "Check in",
    supportEvent: "Support request to the flight surgeon",
    checkInEvent: "Check-in",
    missionDone: (title: string, xp: number) => `Mission done: ${title} (+${xp} XP)`,
    title: "Timeline",
    lead: "Everything is saved on this device first. Sending to Earth is simulated.",
    linkOn: "Earth link online",
    linkOff: "Earth link offline",
    onText: "Queued events move up on their own: pending, ready, synced.",
    offText: "No link: events stay pending and sync when you reconnect.",
    goOffline: "Go offline",
    reconnect: "Reconnect",
    failNext: "Simulate a failure on the next send",
    failNextText: "The next event ready to send will fail.",
    byState: "Events by state",
    queueTitle: "Send queue",
    recordsTitle: "Records on this device",
    show: "Show",
    records: "Records",
    queue: "Queue",
    emptyQueue: "The queue is empty for now. Do a check-in and watch it travel to Earth.",
    sendDetails: "Send details",
    attempts: "Attempts",
    event: "Event",
    idemKey: "Idempotency key",
    retry: "Try again",
    emptyRecords: "No records from you yet. Your check-ins show up here.",
    astraCheckIn: "Astra check-in",
    legend: "Origin legend",
    lg: {
      manual: ["Manual", "You logged it."],
      sim: ["Simulated", "Generated by the demo; not a real measurement."],
      ext: ["External", "Authorized external system; turned off in the demo."],
      missing: ["Missing", "Skipped or not collected; never becomes zero."],
    },
    reset: "Reset demo",
    resetText: "Deletes check-ins, missions, readings and the queue in this browser.",
    sure: "Are you sure?",
    undo: "This cannot be undone.",
    yesReset: "Yes, delete and reset",
    cancel: "Cancel",
  },
};

const STATE_ICON: Record<SyncState, LucideIcon> = {
  local_only: Clock3,
  pending: Hourglass,
  ready: Send,
  synced: CircleCheck,
  failed: TriangleAlert,
};

const TYPE_ICON: Record<SyncEvent["type"], LucideIcon> = {
  check_in: ClipboardCheck,
  mission_done: Target,
  support_request: LifeBuoy,
};

const COUNTED: SyncState[] = ["pending", "ready", "synced", "failed"];

// Check-in labels are stored in English (see CheckIn.tsx); this turns them into Portuguese.
const CHECKIN_LABEL_PT: [string, string][] = [
  ["Morning check-in · different from usual: ", "Check-in matinal · diferente do habitual: "],
  ["Evening check-in", "Check-in noturno"],
  ["wants to see support", "quer ver apoio"],
  ["yes, logged", "sim, registrado"],
  [": no", ": não"],
];

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

function Empty({ text, mood }: { text: string; mood: CatroMood }) {
  const t = useLang().pick(T);
  return (
    <div className="timeline-empty">
      <Catro mood={mood} size={104} />
      <p>{text}</p>
      <a className="btn btn--primary btn--sm" href="#/checkin">
        {t.checkIn}
      </a>
    </div>
  );
}

export function Queue() {
  const { state, dispatch } = useStore();
  const [view, setView] = useState<View>("queue");
  const [confirmReset, setConfirmReset] = useState(false);
  const { lang, pick } = useLang();
  const t = pick(T);
  const dt = useDomainText();

  // The stored label is English (history); the UI label is built from type + missionId.
  const eventLabel = (e: SyncEvent) => {
    const m = e.missionId && MISSIONS.some((x) => x.id === e.missionId) ? (e.missionId as MissionId) : undefined;
    if (lang === "pt") {
      if (e.type === "support_request") return t.supportEvent;
      if (e.type === "mission_done" && m) return t.missionDone(dt.mission(m).title, MISSIONS.find((x) => x.id === m)!.xp);
      if (e.type === "check_in") return CHECKIN_LABEL_PT.reduce((s, [en, pt]) => s.replace(en, pt), e.label);
      return e.label;
    }
    if (e.type === "support_request") return t.supportEvent;
    if (!m) return e.type === "check_in" ? t.checkInEvent : e.label;
    const title = dt.mission(m).title;
    return e.type === "check_in" ? `Check-in: ${title}` : t.missionDone(title, MISSIONS.find((x) => x.id === m)!.xp);
  };

  const counts = Object.fromEntries(COUNTED.map((s) => [s, state.outbox.filter((e) => e.state === s).length])) as Record<SyncState, number>;
  const queue = [...state.outbox].reverse();
  const groups = groupRecords(state.manual, state.live);
  const LinkIcon = state.online ? Wifi : WifiOff;

  return (
    <div className="page queue">
      <div className="page__head">
        <div>
          <h1>{t.title}</h1>
          <p className="queue-local">
            <AstraSymbol size={22} />
            <span>{t.lead}</span>
          </p>
        </div>
      </div>

      <section className={`panel timeline-link ${state.online ? "is-on" : "is-off"}`} aria-labelledby="timeline-link-title">
        <div className="timeline-link__status">
          <span className={`icon-tile ${state.online ? "icon-tile--body" : ""}`} aria-hidden>
            <LinkIcon size={20} />
          </span>
          <div className="timeline-link__text">
            <h2 id="timeline-link-title">{state.online ? t.linkOn : t.linkOff}</h2>
            <p className="muted small">
              {state.online
                ? t.onText
                : t.offText}
            </p>
          </div>
          <button type="button" className={`btn btn--sm ${state.online ? "" : "btn--primary"}`} onClick={() => dispatch({ type: "toggleOnline" })}>
            {state.online ? (
              <>
                <WifiOff size={16} aria-hidden /> {t.goOffline}
              </>
            ) : (
              <>
                <Wifi size={16} aria-hidden /> {t.reconnect}
              </>
            )}
          </button>
        </div>

        <div className="timeline-switch">
          <button
            type="button"
            role="switch"
            aria-checked={state.failNext}
            aria-labelledby="timeline-switch-label"
            className={`timeline-switch__track ${state.failNext ? "is-on" : ""}`}
            onClick={() => dispatch({ type: "toggleFailNext" })}
          >
            <span className="timeline-switch__thumb" />
          </button>
          <span className="timeline-switch__text">
            <b id="timeline-switch-label">{t.failNext}</b>
            <span className="muted small">{t.failNextText}</span>
          </span>
        </div>

        <ul className="timeline-counts" aria-label={t.byState}>
          {COUNTED.map((s) => {
            const I = STATE_ICON[s];
            return (
              <li key={s} className={`timeline-count timeline-count--${s} timeline-st--${s}`}>
                <span className="timeline-count__label small">
                  <span className="timeline-count__ico" aria-hidden>
                    <I size={16} strokeWidth={2.5} />
                  </span>
                  {t.state[s]}
                </span>
                <b className="num">{counts[s]}</b>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="grid-2">
        <section className="panel timeline-main" aria-labelledby="timeline-main-title">
          <div className="panel__head">
            <h2 id="timeline-main-title" className="queue-h2">
              <span className="queue-h2__icon" aria-hidden>
                {view === "queue" ? <SatelliteDish size={18} strokeWidth={2.5} /> : <ClipboardList size={18} strokeWidth={2.5} />}
              </span>
              {view === "queue" ? t.queueTitle : t.recordsTitle}
            </h2>
            <div className="timeline-filters" role="group" aria-label={t.show}>
              <button type="button" className={`chip ${view === "records" ? "chip--on" : ""}`} aria-pressed={view === "records"} onClick={() => setView("records")}>
                <ClipboardList size={16} aria-hidden /> {t.records} <span className="num">({groups.length})</span>
              </button>
              <button type="button" className={`chip ${view === "queue" ? "chip--on" : ""}`} aria-pressed={view === "queue"} onClick={() => setView("queue")}>
                <Send size={16} aria-hidden /> {t.queue} <span className="num">({state.outbox.length})</span>
              </button>
            </div>
          </div>

          {view === "queue" ? (
            queue.length === 0 ? (
              <Empty mood="sleepy" text={t.emptyQueue} />
            ) : (
              <ol className="timeline-queue">
                {queue.map((e, i) => {
                  const S = STATE_ICON[e.state];
                  const TypeIcon = TYPE_ICON[e.type];
                  return (
                    <li key={e.eventId} className={`timeline-event timeline-event--${e.state} timeline-st--${e.state} stagger-in`} style={{ "--i": i } as CSSProperties}>
                      <span className="timeline-event__marker" aria-hidden>
                        <S size={15} strokeWidth={2.5} />
                      </span>
                      <div className="timeline-event__body">
                        <div className="timeline-event__top">
                          <b className="timeline-event__label">
                            <TypeIcon size={17} aria-hidden className="timeline-event__type" /> {eventLabel(e)}
                          </b>
                          <span className={`timeline-state timeline-state--${e.state}`}>
                            <S size={13} strokeWidth={2.75} aria-hidden /> {t.state[e.state]}
                          </span>
                        </div>
                        <p className="timeline-event__meta small">
                          <span className="num">
                            {fmtDateTime(e.createdAt)} · {relTime(e.createdAt)} · {lang === "pt" ? t.help[e.state].toLowerCase() : t.help[e.state].charAt(0).toLowerCase() + t.help[e.state].slice(1)}
                          </span>
                        </p>
                        <details className="timeline-event__tech small">
                          <summary>{t.sendDetails}</summary>
                          <dl>
                            <div>
                              <dt>{t.attempts}</dt>
                              <dd className="num">{e.attempts}</dd>
                            </div>
                            <div>
                              <dt>{t.event}</dt>
                              <dd>{e.eventId}</dd>
                            </div>
                            <div>
                              <dt>{t.idemKey}</dt>
                              <dd title={e.idempotencyKey}>{shortKey(e.idempotencyKey)}</dd>
                            </div>
                          </dl>
                        </details>
                        {e.state === "failed" && (
                          <button type="button" className="btn btn--primary btn--sm timeline-retry" onClick={() => dispatch({ type: "retry", eventId: e.eventId })}>
                            <RotateCw size={16} aria-hidden /> {t.retry}
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )
          ) : groups.length === 0 ? (
            <Empty mood="thinking" text={t.emptyRecords} />
          ) : (
            <ol className="timeline-records">
              {groups.map((g, i) => {
                const c = dt.connector(g.source);
                const isManual = g.items[0].origin === "manual";
                const SrcIcon = isManual ? NotebookPen : Plug;
                return (
                  <li key={g.key} className="timeline-group stagger-in" style={{ "--i": i } as CSSProperties}>
                    <div className="timeline-group__head">
                      <b className="num">{fmtDateTime(g.at)}</b>
                      <span className="timeline-group__src small">
                        <SrcIcon size={15} aria-hidden /> {c?.name ?? (isManual ? t.astraCheckIn : g.source)}
                      </span>
                    </div>
                    <ul className="timeline-obs">
                      {g.items.map((o) => {
                        const def = indicator(o.indicatorCode);
                        return (
                          <li key={o.observationId}>
                            <span className="timeline-obs__name">
                              <span className="timeline-obs__tile" style={{ "--tint": INDICATOR_TINT[o.indicatorCode] } as CSSProperties} aria-hidden>
                                {o.indicatorCode === "radiation_dose" ? <Radiation size={16} strokeWidth={2.5} /> : <Icon name={def.icon} size={16} strokeWidth={2.5} />}
                              </span>{" "}
                              {dt.indicator(o.indicatorCode).short}
                            </span>
                            <span className="timeline-obs__val num">
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

        <aside className="stack timeline-aside">
          <section className="panel timeline-legend" aria-labelledby="timeline-legend-title">
            <h2 id="timeline-legend-title" className="queue-h2">
              <span className="queue-h2__icon queue-h2__icon--legend" aria-hidden>
                <Tags size={18} strokeWidth={2.5} />
              </span>
              {t.legend}
            </h2>
            <dl>
              <div>
                <dt>
                  <span className="tag tag--manual">{t.lg.manual[0]}</span>
                </dt>
                <dd>{t.lg.manual[1]}</dd>
              </div>
              <div>
                <dt>
                  <span className="tag tag--simulated">{t.lg.sim[0]}</span>
                </dt>
                <dd>{t.lg.sim[1]}</dd>
              </div>
              <div>
                <dt>
                  <span className="tag tag--ext">{t.lg.ext[0]}</span>
                </dt>
                <dd>{t.lg.ext[1]}</dd>
              </div>
              <div>
                <dt>
                  <span className="tag tag--missing">{t.lg.missing[0]}</span>
                </dt>
                <dd>{t.lg.missing[1]}</dd>
              </div>
            </dl>
          </section>

          <section className="panel timeline-reset" aria-labelledby="timeline-reset-title">
            <h2 id="timeline-reset-title" className="queue-h2">
              <span className="queue-h2__icon queue-h2__icon--reset" aria-hidden>
                <RotateCcw size={18} strokeWidth={2.5} />
              </span>
              {t.reset}
            </h2>
            <p className="small muted">{t.resetText}</p>
            {confirmReset ? (
              <div className="timeline-confirm" role="alertdialog" aria-labelledby="timeline-confirm-text">
                <p id="timeline-confirm-text" className="small">
                  <TriangleAlert size={18} aria-hidden />
                  <span>
                    <b>{t.sure}</b> {t.undo}
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
                    {t.yesReset}
                  </button>
                  <button type="button" className="btn btn--sm" onClick={() => setConfirmReset(false)} autoFocus>
                    {t.cancel}
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" className="btn btn--sm timeline-reset__btn" onClick={() => setConfirmReset(true)}>
                <RotateCcw size={16} aria-hidden /> {t.reset}
              </button>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
