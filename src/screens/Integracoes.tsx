import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Check, ClipboardList, Download, ExternalLink, FileJson, Info, Plug, RefreshCw, ShieldCheck, type LucideIcon } from "lucide-react";
import "./Integracoes.css";
import { useStore } from "../store";
import { CONNECTORS, KIND_LABEL, STATUS_LABEL, type Connector, type ConnectorKind, type ConnectorStatus } from "../domain/integrations";
import { indicator } from "../domain/indicators";
import { refById } from "../domain/references";
import { toFhirBundle } from "../domain/fhir";
import { PROFILE_ID, simulateConnectorReading } from "../domain/simulator";
import type { IconName } from "../domain/icons";
import { Icon } from "../components/Icon";
import { PHOTO } from "../components/Credits";
import { fmtDateTime, relTime } from "../components/ui";

// Central de integrações (REQ-11.4, 11.5, 11.7). Nenhum conector fala com sistema real:
// SIMULADO = a demo gera dados como se viessem dele; ROADMAP = previsto, sem dados.

const STATUS_CLASS: Record<ConnectorStatus, string> = {
  ativo: "tag--ativo",
  simulado: "tag--sim",
  roadmap: "tag--roadmap",
  requer_autorizacao: "tag--roadmap",
};

// Rótulo do selo em caixa normal (RV-8); o valor do domínio (STATUS_LABEL) vai no title.
const STATUS_TEXT: Record<ConnectorStatus, string> = {
  ativo: "Autorrelato",
  simulado: "Simulado",
  roadmap: "Roadmap",
  requer_autorizacao: "Requer autorização",
};

const KIND_ICON: Record<ConnectorKind, IconName> = {
  vestivel: "shirt",
  instrumento: "radiation",
  ambiente: "air-vent",
  treino: "dumbbell",
  estudo: "book",
  autorrelato: "user",
};

const FLOW: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Plug, title: "Conectores", text: "Vestíveis, instrumentos, ambiente, treino e estudos" },
  { icon: ShieldCheck, title: "Validação", text: "Unidade, horário e faixa estrutural; leitura quebrada vira inválida" },
  { icon: ClipboardList, title: "Prontuário", text: "Cada registro guarda a origem (sourceRef)" },
  { icon: FileJson, title: "Exportação FHIR", text: "Bundle HL7 FHIR R4 com etiqueta Simulado" },
];

const GROUPS: { id: string; title: string; text: string; statuses: ConnectorStatus[] }[] = [
  {
    id: "uso",
    title: "Em uso na demo",
    text: "O check-in do próprio Astra e os conectores que a demo simula.",
    statuses: ["ativo", "simulado"],
  },
  {
    id: "roadmap",
    title: "Previstos (roadmap)",
    text: "Fontes que o Astra poderia receber no futuro. Hoje não trazem dados.",
    statuses: ["roadmap", "requer_autorizacao"],
  },
];

// Só mostra "Sincronizar agora" em quem gera leitura ao vivo. O cenário demo é histórico fixo.
const canSync = (c: Connector) => c.status === "simulado" && c.id !== "cenario-demo" && simulateConnectorReading(c.id, 0, 0).length > 0;

const PREVIEW_LINES = 40;
const FILE_NAME = `astra-fhir-${PROFILE_ID}.json`;

export function Integracoes() {
  const { state, dispatch, observations } = useStore();
  const [spinning, setSpinning] = useState<Record<string, boolean>>({});
  const [justSynced, setJustSynced] = useState<string | null>(null);
  const timers = useRef<number[]>([]);

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
      { label: "Autorrelato", value: n("ativo") },
      { label: "Simulados", value: n("simulado") },
      { label: "Roadmap", value: n("roadmap", "requer_autorizacao") },
    ];
  }, []);

  const bundle = useMemo(() => toFhirBundle(observations, { profileId: PROFILE_ID, generatedAt: new Date().toISOString() }), [observations]);
  const json = useMemo(() => JSON.stringify(bundle, null, 2), [bundle]);
  const preview = useMemo(() => {
    const lines = json.split("\n");
    return lines.slice(0, PREVIEW_LINES).join("\n") + (lines.length > PREVIEW_LINES ? `\n  … (+${lines.length - PREVIEW_LINES} linhas)` : "");
  }, [json]);
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

  function renderConnector(c: Connector) {
    const info = perConnector.get(c.id);
    const synced = state.lastSync[c.id];
    const last = synced && (!info?.last || Date.parse(synced) > Date.parse(info.last)) ? synced : info?.last;
    const ref = c.referenceId ? refById(c.referenceId) : undefined;
    const busy = !!spinning[c.id];
    const live = canSync(c);
    return (
      <li key={c.id} className={`integ-con integ-con--${c.status}`} aria-labelledby={`con-${c.id}`}>
        <span className="integ-con__icon" aria-hidden>
          <Icon name={KIND_ICON[c.kind]} size={20} />
        </span>

        <div className="integ-con__main">
          <div className="integ-con__title">
            <h4 id={`con-${c.id}`}>{c.name}</h4>
            <span className={`tag ${STATUS_CLASS[c.status]}`} title={STATUS_LABEL[c.status]}>
              {STATUS_TEXT[c.status]}
            </span>
          </div>
          <p className="integ-con__measures small">{c.measures}</p>
          <details className="integ-con__more small">
            <summary>Detalhes</summary>
            <p className="muted">
              {c.institution} · {KIND_LABEL[c.kind]}
            </p>
            <ul className="integ-con__feeds" aria-label="Indicadores que alimenta">
              {c.feeds.map((code) => {
                const def = indicator(code);
                return (
                  <li key={code}>
                    <a className="chip integ-chip" href={`#/prontuario/${code}`} title={def.name}>
                      <Icon name={def.icon} size={15} /> {def.short}
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
              <dt>Última leitura</dt>
              <dd className="num">{last ? <time dateTime={last} title={fmtDateTime(last)}>{relTime(last)}</time> : "sem dados"}</dd>
            </div>
            <div>
              <dt>Registros</dt>
              <dd className="num">{info?.count ?? 0}</dd>
            </div>
          </dl>
          {(ref || live) && (
            <div className="integ-con__actions">
              {ref && (
                <a className="btn btn--ghost btn--sm" href={ref.url} target="_blank" rel="noopener noreferrer">
                  Abrir fonte <ExternalLink size={15} aria-hidden />
                </a>
              )}
              {live && (
                <button type="button" className="btn btn--primary btn--sm" onClick={() => sync(c.id)} disabled={busy} aria-busy={busy}>
                  <RefreshCw size={16} aria-hidden className={busy ? "integ-spin" : undefined} />
                  {busy ? "Sincronizando…" : "Sincronizar agora"}
                </button>
              )}
            </div>
          )}
          {live && (
            <p className="integ-con__ok small" role="status" aria-live="polite">
              {justSynced === c.id && (
                <>
                  <Check size={15} aria-hidden /> Nova leitura simulada recebida
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
        <img src={PHOTO.iss} alt="A Estação Espacial Internacional em órbita, com a Terra ao fundo" />
        <span className="photo-band__credit">Foto: NASA</span>
        <div className="photo-band__body integ-band__body">
          <div className="integ-band__text">
            <h1>Central de integrações</h1>
            <p>Na versão real, os dados chegariam aqui sem digitar nada. Nesta demo, são simulados.</p>
          </div>
          <dl className="integ-band__sum" aria-label="Conectores por status">
            {summary.map((s) => (
              <div key={s.label}>
                <dt>{s.label}</dt>
                <dd className="num">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </header>

      {/* Fluxo e exportação lado a lado: dois painéis de leitura curta antes da lista longa de conectores. */}
      <div className="grid-2 integ-top">
        <section className="panel" aria-labelledby="integ-fluxo">
          <div className="panel__head">
            <div>
              <h2 id="integ-fluxo">Como os dados chegam</h2>
              <p>Toda leitura passa pelas mesmas quatro etapas.</p>
            </div>
          </div>
          {/* O fluxo é uma frase: quatro etapas em linha, ligadas por setas. */}
          <ol className="integ-flow" aria-label="Etapas">
            {FLOW.map((step, i) => (
              <li key={step.title} className="integ-flow__step">
                {i > 0 && <ArrowRight size={18} aria-hidden className="integ-flow__arrow" />}
                <span className={`integ-flow__node ${i === FLOW.length - 1 ? "is-last" : ""}`}>
                  <step.icon size={18} aria-hidden />
                </span>
                <b>{step.title}</b>
              </li>
            ))}
          </ol>
          <details className="integ-flow__more small">
            <summary>O que cada etapa faz</summary>
            <dl>
              {FLOW.map((step) => (
                <div key={step.title}>
                  <dt>{step.title}</dt>
                  <dd>{step.text}</dd>
                </div>
              ))}
            </dl>
          </details>
          <p className="integ-note" role="note">
            <Info size={20} aria-hidden className="integ-note__icon" />
            <span>
              <b>Nenhum conector está ligado a sistemas reais da NASA/CSA.</b>{" "}
              <span className="muted">Simulado: a demo gera os dados. Roadmap: previsto, sem dados.</span>
            </span>
          </p>
        </section>
        <section className="panel integ-fhir" aria-labelledby="integ-fhir">
          <div className="panel__head">
            <div>
              <h2 id="integ-fhir">Exportar prontuário (HL7 FHIR R4)</h2>
              <p>
                Bundle com <b className="num">{bundle.entry.length}</b> recursos Observation
                {excluded > 0 ? `; ${excluded} leituras inválidas ficaram de fora` : ""}.
              </p>
            </div>
            <button type="button" className="btn btn--primary" onClick={download}>
              <Download size={18} aria-hidden /> Baixar JSON
            </button>
          </div>
          <p className="integ-fhir__tag small">
            <span className="tag tag--sim">Simulado</span>
            <span className="muted">em meta.tag de cada recurso sintético.</span>
          </p>
          <details className="integ-fhir__more">
            <summary>Prévia do JSON e códigos</summary>
            <p className="small muted">
              Arquivo {FILE_NAME}. LOINC só nos códigos confirmados; os demais usam o código local urn:astra:indicator.
            </p>
            <pre className="integ-fhir__pre" tabIndex={0} aria-label={`Prévia das primeiras ${PREVIEW_LINES} linhas do JSON`}>
              <code>{preview}</code>
            </pre>
          </details>
        </section>
      </div>

      <section className="panel" aria-labelledby="integ-conectores">
        <div className="panel__head">
          <h2 id="integ-conectores">Conectores</h2>
          <span className="integ-count num">{CONNECTORS.length} no total</span>
        </div>
        {GROUPS.map((g) => {
          const list = CONNECTORS.filter((c) => g.statuses.includes(c.status));
          if (!list.length) return null;
          return (
            <div key={g.id} className="integ-group" role="group" aria-labelledby={`integ-${g.id}`}>
              <div className="integ-group__head">
                <h3 id={`integ-${g.id}`}>
                  {g.title} <span className="integ-count num">· {list.length}</span>
                </h3>
                <p className="small muted">{g.text}</p>
              </div>
              <ul className="integ-list">{list.map(renderConnector)}</ul>
            </div>
          );
        })}
      </section>
    </div>
  );
}
