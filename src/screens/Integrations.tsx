import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  Activity,
  Cable,
  Check,
  ChevronRight,
  ClipboardList,
  Download,
  ExternalLink,
  FileJson,
  Info,
  Lock,
  Map as MapIcon,
  Plug,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import "./Integrations.css";
import { useStore } from "../store";
import { STATUS_LABEL_PT } from "../domain/pt";
import { CONNECTORS, type Connector, type ConnectorKind, type ConnectorStatus } from "../domain/integrations";
import { indicator } from "../domain/indicators";
import { refById } from "../domain/references";
import { toFhirBundle } from "../domain/fhir";
import { PROFILE_ID, simulateConnectorReading } from "../domain/simulator";
import type { IconName } from "../domain/icons";
import { Icon } from "../components/Icon";
import { PHOTO } from "../components/Credits";
import { MorseRule } from "../components/Logo";
import { fmtDateTime, relTime } from "../components/ui";
import { locale, useLang } from "../i18n/lang";
import { useDomainText } from "../i18n/domainText";

// Integrations hub (REQ-11.4, 11.5, 11.7). No connector talks to a real system:
// SIMULATED = the demo generates data as if it came from it; ROADMAP = planned, no data.


const KIND_ICON: Record<ConnectorKind, IconName> = {
  wearable: "shirt",
  instrument: "radiation",
  environment: "air-vent",
  training: "dumbbell",
  study: "book",
  self_report: "user",
};

// Status with an icon and its own vivid color (the label stays as text).
const STATUS_ICON: Record<ConnectorStatus, LucideIcon> = {
  self_report: UserCheck,
  simulated: Activity,
  roadmap: MapIcon,
  needs_authorization: Lock,
};

// Identity color of each connector kind (icon only).
const KIND_TINT: Record<ConnectorKind, string> = {
  wearable: "#FF4D7E",
  instrument: "#FACC15",
  environment: "#34D399",
  training: "#FB923C",
  study: "#A78BFA",
  self_report: "#38BDF8",
};

const FLOW_STYLE: { icon: LucideIcon; tint: string }[] = [
  { icon: Plug, tint: "#38BDF8" },
  { icon: ShieldCheck, tint: "#34D399" },
  { icon: ClipboardList, tint: "#A78BFA" },
  { icon: FileJson, tint: "#FB923C" },
];

const GROUPS: { id: "in_use" | "roadmap"; statuses: ConnectorStatus[] }[] = [
  { id: "in_use", statuses: ["self_report", "simulated"] },
  { id: "roadmap", statuses: ["roadmap", "needs_authorization"] },
];

const T = {
  pt: {
    // Badge label in sentence case (RV-8); the domain value (STATUS_LABEL) goes in the title attribute.
    status: { self_report: "Autorrelato", simulated: "Simulado", roadmap: "Roadmap", needs_authorization: "Requer autorização" } as Record<ConnectorStatus, string>,
    sum: { self_report: "Autorrelato", simulated: "Simulados", roadmap: "Roadmap" },
    flow: [
      { title: "Conectores", text: "Vestíveis, instrumentos, ambiente, treino e estudos" },
      { title: "Validação", text: "Unidade, horário e faixa estrutural; leitura quebrada vira inválida" },
      { title: "Prontuário", text: "Cada registro guarda a origem (sourceRef)" },
      { title: "Exportação FHIR", text: "Bundle HL7 FHIR R4 com etiqueta Simulado" },
    ],
    groups: {
      in_use: { title: "Em uso na demo", text: "O check-in do próprio Astra e os conectores que a demo simula." },
      roadmap: { title: "Previstos (roadmap)", text: "Fontes que o Astra poderia receber no futuro. Hoje não trazem dados." },
    },
    moreLines: (n: number) => `(+${n} linhas)`,
    details: "Detalhes",
    generic: "Genérico",
    feeds: "Indicadores que alimenta",
    lastReading: "Última leitura",
    noData: "sem dados",
    records: "Registros",
    openSource: "Abrir fonte",
    syncing: "Sincronizando…",
    syncNow: "Sincronizar agora",
    newReading: "Nova leitura simulada recebida",
    photoAlt: "A Estação Espacial Internacional em órbita, com a Terra ao fundo",
    photo: "Foto: NASA",
    title: "Central de integrações",
    lead: "Na versão real, os dados chegariam aqui sem digitar nada. Nesta demo, são simulados.",
    byStatus: "Conectores por status",
    flowTitle: "Como os dados chegam",
    flowLead: "Toda leitura passa pelas mesmas quatro etapas.",
    steps: "Etapas",
    noReal: "Nenhum conector está ligado a sistemas reais da NASA/CSA.",
    noRealNote: "Simulado: a demo gera os dados. Roadmap: previsto, sem dados.",
    fhirTitle: "Exportar FHIR",
    fhirLead1: "HL7 FHIR R4: bundle com ",
    fhirLead2: " recursos Observation",
    excluded: (n: number) => `; ${n} leituras inválidas ficaram de fora`,
    download: "Baixar JSON",
    sim: "Simulado",
    simTag: "em meta.tag de cada recurso sintético.",
    preview: "Prévia do JSON e códigos",
    file: (f: string) => `Arquivo ${f}. LOINC só nos códigos confirmados; os demais usam o código local urn:astra:indicator.`,
    previewAria: (n: number) => `Prévia das primeiras ${n} linhas do JSON`,
    connectors: "Conectores",
    total: (n: number) => `${n} no total`,
  },
  en: {
    status: { self_report: "Self-report", simulated: "Simulated", roadmap: "Roadmap", needs_authorization: "Needs authorization" } as Record<ConnectorStatus, string>,
    sum: { self_report: "Self-report", simulated: "Simulated", roadmap: "Roadmap" },
    flow: [
      { title: "Connectors", text: "Wearables, instruments, environment, exercise and studies" },
      { title: "Validation", text: "Unit, timestamp and structural range; a broken reading becomes invalid" },
      { title: "Health record", text: "Every record keeps its origin (sourceRef)" },
      { title: "FHIR export", text: "HL7 FHIR R4 bundle tagged Simulated" },
    ],
    groups: {
      in_use: { title: "In use in the demo", text: "Astra's own check-in and the connectors the demo simulates." },
      roadmap: { title: "Planned (roadmap)", text: "Sources Astra could receive in the future. They bring no data today." },
    },
    moreLines: (n: number) => `(+${n} lines)`,
    details: "Details",
    generic: "Generic",
    feeds: "Indicators it feeds",
    lastReading: "Last reading",
    noData: "no data",
    records: "Records",
    openSource: "Open source",
    syncing: "Syncing…",
    syncNow: "Sync now",
    newReading: "New simulated reading received",
    photoAlt: "The International Space Station in orbit, with Earth in the background",
    photo: "Photo: NASA",
    title: "Integrations hub",
    lead: "In the real version, data would arrive here with no typing. In this demo, it is simulated.",
    byStatus: "Connectors by status",
    flowTitle: "How data arrives",
    flowLead: "Every reading goes through the same four steps.",
    steps: "Steps",
    noReal: "No connector is linked to real NASA/CSA systems.",
    noRealNote: "Simulated: the demo generates the data. Roadmap: planned, no data.",
    fhirTitle: "Export FHIR",
    fhirLead1: "HL7 FHIR R4: bundle with ",
    fhirLead2: " Observation resources",
    excluded: (n: number) => `; ${n} invalid ${n === 1 ? "reading was" : "readings were"} left out`,
    download: "Download JSON",
    sim: "Simulated",
    simTag: "in the meta.tag of every synthetic resource.",
    preview: "JSON preview and codes",
    file: (f: string) => `File ${f}. LOINC only for confirmed codes; the others use the local code urn:astra:indicator.`,
    previewAria: (n: number) => `Preview of the first ${n} lines of the JSON`,
    connectors: "Connectors",
    total: (n: number) => `${n} in total`,
  },
};

// Only show "Sync now" for connectors that generate live readings. The demo scenario is fixed history.
const canSync = (c: Connector) => c.status === "simulated" && c.id !== "demo-scenario" && simulateConnectorReading(c.id, 0, 0).length > 0;

const PREVIEW_LINES = 40;
const FILE_NAME = `astra-fhir-${PROFILE_ID}.json`;

export function Integrations() {
  const { state, dispatch, observations } = useStore();
  const [spinning, setSpinning] = useState<Record<string, boolean>>({});
  const [justSynced, setJustSynced] = useState<string | null>(null);
  const timers = useRef<number[]>([]);
  const { lang, pick } = useLang();
  const t = pick(T);
  const dt = useDomainText();

  useEffect(() => () => timers.current.forEach((t) => clearTimeout(t)), []);

  const perConnector = useMemo(() => {
    const map = new Map<string, { count: number; last?: string }>();
    for (const o of observations) {
      if (!o.sourceRef) continue;
      const cur = map.get(o.sourceRef) ?? { count: 0 };
      cur.count += 1;
      if (!cur.last || Date.parse(o.observedAt) > Date.parse(cur.last)) cur.last = o.observedAt;
      map.set(o.sourceRef, cur);
    }
    return map;
  }, [observations]);

  const summary = useMemo(() => {
    const n = (...s: ConnectorStatus[]) => CONNECTORS.filter((c) => s.includes(c.status)).length;
    return [
      { key: "self_report", value: n("self_report"), status: "self_report" as ConnectorStatus },
      { key: "simulated", value: n("simulated"), status: "simulated" as ConnectorStatus },
      { key: "roadmap", value: n("roadmap", "needs_authorization"), status: "roadmap" as ConnectorStatus },
    ] as const;
  }, []);

  const bundle = useMemo(() => toFhirBundle(observations, { profileId: PROFILE_ID, generatedAt: new Date().toISOString() }), [observations]);
  const json = useMemo(() => JSON.stringify(bundle, null, 2), [bundle]);
  const preview = useMemo(() => {
    const lines = json.split("\n");
    return lines.slice(0, PREVIEW_LINES).join("\n") + (lines.length > PREVIEW_LINES ? `\n  … ${t.moreLines(lines.length - PREVIEW_LINES)}` : "");
  }, [json, t]);
  const excluded = observations.length - bundle.entry.length;

  function sync(id: string) {
    if (spinning[id]) return;
    setSpinning((s) => ({ ...s, [id]: true }));
    dispatch({ type: "syncConnector", id });
    timers.current.push(
      window.setTimeout(() => {
        setSpinning((s) => ({ ...s, [id]: false }));
        setJustSynced(id);
      }, 600),
      window.setTimeout(() => setJustSynced((cur) => (cur === id ? null : cur)), 2600),
    );
  }

  function download() {
    const blob = new Blob([json], { type: "application/fhir+json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = FILE_NAME;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function renderConnector(c0: Connector, idx: number) {
    const c = dt.connector(c0.id) ?? c0;
    const info = perConnector.get(c.id);
    const synced = state.lastSync[c.id];
    const last = synced && (!info?.last || Date.parse(synced) > Date.parse(info.last)) ? synced : info?.last;
    const ref = c.referenceId ? refById(c.referenceId) : undefined;
    const busy = !!spinning[c.id];
    const live = canSync(c);
    const StatusIcon = STATUS_ICON[c.status];
    return (
      <li
        key={c.id}
        className={`integ-con integ-con--${c.status} stagger-in`}
        style={{ "--tint": KIND_TINT[c.kind], "--i": idx } as CSSProperties}
        aria-labelledby={`con-${c.id}`}
      >
        <span className="integ-con__icon" aria-hidden>
          <Icon name={KIND_ICON[c.kind]} size={22} strokeWidth={2.25} />
        </span>

        <div className="integ-con__main">
          <div className="integ-con__title">
            <h4 id={`con-${c.id}`}>{c.name}</h4>
            <span className={`integ-status integ-status--${c.status}`} title={lang === "pt" ? STATUS_LABEL_PT[c.status] : dt.status(c.status)}>
              <StatusIcon size={14} strokeWidth={2.5} aria-hidden /> {t.status[c.status]}
            </span>
          </div>
          <p className="integ-con__measures small">{c.measures}</p>
          <details className="integ-con__more small">
            <summary>{t.details}</summary>
            <p className="muted">
              {c.institution === "Generic" ? t.generic : c.institution} · {dt.kind(c.kind)}
            </p>
            <ul className="integ-con__feeds" aria-label={t.feeds}>
              {c.feeds.map((code) => {
                const def = indicator(code);
                const txt = dt.indicator(code);
                return (
                  <li key={code}>
                    <a className="chip integ-chip" href={`#/health/${code}`} title={txt.name}>
                      <Icon name={def.icon} size={15} /> {txt.short}
                    </a>
                  </li>
                );
              })}
            </ul>
            <p className="muted">{c.sourceNote}</p>
          </details>
        </div>

        <div className="integ-con__side">
          <dl className="integ-con__stats small">
            <div>
              <dt>{t.lastReading}</dt>
              <dd className="num">{last ? <time dateTime={last} title={fmtDateTime(last)}>{relTime(last)}</time> : t.noData}</dd>
            </div>
            <div>
              <dt>{t.records}</dt>
              <dd className="num">{info?.count ?? 0}</dd>
            </div>
          </dl>
          {(ref || live) && (
            <div className="integ-con__actions">
              {ref && (
                <a className="btn btn--ghost btn--sm" href={ref.url} target="_blank" rel="noopener noreferrer">
                  {t.openSource} <ExternalLink size={15} aria-hidden />
                </a>
              )}
              {live && (
                <button type="button" className="btn btn--primary btn--sm" onClick={() => sync(c.id)} disabled={busy} aria-busy={busy}>
                  <RefreshCw size={16} aria-hidden className={busy ? "integ-spin" : undefined} />
                  {busy ? t.syncing : t.syncNow}
                </button>
              )}
            </div>
          )}
          {live && (
            <p className="integ-con__ok small" role="status" aria-live="polite">
              {justSynced === c.id && (
                <>
                  <Check size={15} aria-hidden /> {t.newReading}
                </>
              )}
            </p>
          )}
        </div>
      </li>
    );
  }

  return (
    <div className="page integ">
      <header className="photo-band integ-band">
        <img src={PHOTO.iss} alt={t.photoAlt} />
        <span className="photo-band__credit">{t.photo}</span>
        <div className="photo-band__body integ-band__body">
          <div className="integ-band__text">
            <h1>{t.title}</h1>
            <MorseRule className="integ-band__morse" />
            <p>{t.lead}</p>
          </div>
          <dl className="integ-band__sum" aria-label={t.byStatus}>
            {summary.map((s) => {
              const I = STATUS_ICON[s.status];
              return (
                <div key={s.key} className={`integ-sum integ-sum--${s.status}`}>
                  <dt>
                    <I size={15} strokeWidth={2.5} aria-hidden /> {t.sum[s.key]}
                  </dt>
                  <dd className="display num">{s.value}</dd>
                </div>
              );
            })}
          </dl>
        </div>
      </header>

      {/* Full-width flow: 4 nodes joined by straight wires that pass through the center of the icons. */}
      <section className="panel integ-flow-panel" aria-labelledby="integ-flow-title">
        <div className="panel__head">
          <div>
            <h2 id="integ-flow-title" className="integ-h2">
              <span className="integ-h2__icon" aria-hidden>
                <Workflow size={18} strokeWidth={2.5} />
              </span>
              {t.flowTitle}
            </h2>
            <p>{t.flowLead}</p>
          </div>
        </div>
        <ol className="integ-flow" aria-label={t.steps}>
          {FLOW_STYLE.map((step, i) => (
            <li key={i} className="integ-flow__step" style={{ "--tint": step.tint, "--i": i } as CSSProperties}>
              <span className="integ-flow__node" aria-hidden>
                <step.icon size={28} strokeWidth={2.25} />
              </span>
              {i < FLOW_STYLE.length - 1 && (
                <span className="integ-flow__wire" aria-hidden>
                  <ChevronRight size={18} strokeWidth={2.75} />
                </span>
              )}
              <span className="integ-flow__text">
                <b>{t.flow[i].title}</b>
                <span className="small muted">{t.flow[i].text}</span>
              </span>
            </li>
          ))}
        </ol>
        <p className="integ-note" role="note">
          <Info size={20} aria-hidden className="integ-note__icon" />
          <span>
            <b>{t.noReal}</b>{" "}
            <span className="muted">{t.noRealNote}</span>
          </span>
        </p>
      </section>

      <section className="panel integ-fhir" aria-labelledby="integ-fhir">
        <div className="panel__head">
          <div>
            <h2 id="integ-fhir" className="integ-h2">
              <span className="integ-h2__icon integ-h2__icon--fhir" aria-hidden>
                <FileJson size={18} strokeWidth={2.5} />
              </span>
              {t.fhirTitle}
            </h2>
            <p>
              {t.fhirLead1}
              <b className="num">{bundle.entry.length.toLocaleString(locale())}</b>
              {t.fhirLead2}
              {excluded > 0 ? t.excluded(excluded) : ""}.
            </p>
          </div>
          <button type="button" className="btn btn--primary" onClick={download}>
            <Download size={18} aria-hidden /> {t.download}
          </button>
        </div>
        <p className="integ-fhir__tag small">
          <span className="tag tag--simulated">{t.sim}</span>
          <span className="muted">{t.simTag}</span>
        </p>
        <details className="integ-fhir__more">
          <summary>{t.preview}</summary>
          <p className="small muted">
            {t.file(FILE_NAME)}
          </p>
          <pre className="integ-fhir__pre" tabIndex={0} aria-label={t.previewAria(PREVIEW_LINES)}>
            <code>{preview}</code>
          </pre>
        </details>
      </section>

      <section className="panel" aria-labelledby="integ-connectors">
        <div className="panel__head">
          <h2 id="integ-connectors" className="integ-h2">
            <span className="integ-h2__icon integ-h2__icon--con" aria-hidden>
              <Cable size={18} strokeWidth={2.5} />
            </span>
            {t.connectors}
          </h2>
          <span className="integ-count num">{t.total(CONNECTORS.length)}</span>
        </div>
        {GROUPS.map((g) => {
          const list = CONNECTORS.filter((c) => g.statuses.includes(c.status));
          if (!list.length) return null;
          return (
            <div key={g.id} className="integ-group" role="group" aria-labelledby={`integ-${g.id}`}>
              <div className="integ-group__head">
                <h3 id={`integ-${g.id}`}>
                  {t.groups[g.id].title} <span className="integ-count num">· {list.length}</span>
                </h3>
                <p className="small muted">{t.groups[g.id].text}</p>
              </div>
              <ul className="integ-list">{list.map(renderConnector)}</ul>
            </div>
          );
        })}
      </section>
    </div>
  );
}
