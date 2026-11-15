import { useState, type CSSProperties } from "react";
import { ArrowLeft, ArrowRight, BookOpenText, ChartSpline, ClipboardCheck, ExternalLink, LifeBuoy, ListChecks, Ruler, Sparkles } from "lucide-react";
import { useStore } from "../store";
import { useShell } from "../components/Shell";
import { KindTag, OriginTag, RangeHint, fmtDateTime } from "../components/ui";
import { LineChart } from "../components/Chart";
import { formatValue, indicator, type IndicatorDef } from "../domain/indicators";
import { connectorFor } from "../domain/integrations";
import { TREND_RULE_VERSION, trendForLatestOrigin, withinWindow } from "../domain/trend";
import type { IndicatorCode, Observation, QualityState, SyncState } from "../domain/types";
import { useLang } from "../i18n/lang";
import { useDomainText } from "../i18n/domainText";
import { RadiationPanel, SignalTile } from "./HealthRecord";
import "./Indicator.css";

// Indicator detail with an explainable insight (REQ-2, 9.1; RV-7). It only describes: never diagnoses.
// Desktop: main column (chart, insight, records) + sticky side column (range, NASA/CSA context, actions).

const WINDOWS = [
  { hours: 24, pt: "24 h", en: "24 h" },
  { hours: 72, pt: "72 h", en: "72 h" },
  { hours: 168, pt: "7 d", en: "7 d" },
];

const T = {
  pt: {
    quality: { valid: "válido", missing: "ausente", invalid: "inválido", unverified: "não verificado" } as Record<QualityState, string>,
    sync: {
      local_only: "só no aparelho",
      pending: "pendente",
      ready: "pronto para envio",
      synced: "sincronizado",
      failed: "falhou",
    } as Record<SyncState, string>,
    rangeGeneral: "referência geral, não personalizada",
    rangeDemo: "meta da demo",
    rangeCareer: "limite de carreira",
    source: (s: string) => `Fonte: ${s}`,
    noRange: "Sem faixa geral",
    insufficientB: "Dados insuficientes para tendência",
    insufficient: " nesta janela (são precisos ao menos 2 registros válidos da mesma origem).",
    mixedB: "Tendência não calculada:",
    mixed: " os registros misturam origens diferentes (regra anti-mistura).",
    originWord: (synthetic: boolean | null): string => (synthetic ? "simulados" : "manuais"),
    dir: { up: "subiu", down: "desceu", flat: "ficou igual" },
    between: (a: string, b: string, n: number, origin: string) => `Entre ${a} e ${b}, os ${n} registros ${origin} foram de `,
    to: "para",
    simulated: "Simulado",
    manual: "Manual",
    usedRecords: "Registros e regra usados",
    records: "Registros",
    until: "até",
    rule: "Regra",
    version: "versão",
    excluded: (n: number) => `${n} ${n === 1 ? "registro de outra origem ficou" : "registros de outra origem ficaram"} de fora (regra anti-mistura).`,
    noRecordsWindow: "Sem registros nesta janela.",
    caption: (name: string) => `Registros de ${name}, mais recentes primeiro`,
    colTime: "Horário",
    colValue: "Valor",
    colOrigin: "Origem",
    colQuality: "Qualidade · envio",
    showing: (shown: number, total: number) => `Mostrando os ${shown} mais recentes de ${total} registros.`,
    checkin: "Fazer check-in",
    support: "Pedir apoio",
    back: "Voltar ao prontuário",
    bp: "Pressão arterial",
    noRecord: "nenhum registro ainda",
    previous: "valor anterior:",
    systolic: "Sistólica",
    diastolic: "Diastólica",
    series: "Série",
    last: (w: string) => `últimas ${w}`,
    highlighted: (l: string) => `Faixa em destaque: ${l}`,
    timeWindow: "Janela de tempo",
    whatChanged: (w: string) => `O que mudou nas últimas ${w}`,
    disclaimer: "Descreve, não diagnostica: a interpretação é da equipe médica da missão.",
    howCalc: "Como é calculado e o que não significa",
    howCalcText: (w: string, v: string) =>
      `O Astra compara o primeiro e o último registro válido da janela (${w}), só da mesma origem do mais recente. É um cálculo descritivo e reproduzível (regra ${v}); nenhum modelo de IA decide nada aqui.`,
    notMeans: [
      "Não identifica a causa da mudança.",
      "Não é diagnóstico nem orientação de tratamento.",
      "Não compara você com outras pessoas.",
      "Os valores desta demo são simulados; não vêm de nenhum astronauta.",
    ],
    recordsTitle: (bp: boolean, w: string) => `Registros ${bp ? "da sistólica " : ""}· últimas ${w}`,
    diaRecords: "Registros da diastólica",
    sideLabel: "Faixa, contexto e ações",
    rangeTitle: "Faixa de referência",
    actions: "Ações",
    context: "Contexto NASA/CSA",
    openSource: "Abrir fonte",
    newTab: " (abre em nova aba)",
    limitation: (withSection: boolean) => `Limitação${withSection ? " e seção" : ""}`,
    section: (s: string) => `Seção: ${s}`,
  },
  en: {
    quality: { valid: "valid", missing: "missing", invalid: "invalid", unverified: "unverified" } as Record<QualityState, string>,
    sync: {
      local_only: "on this device only",
      pending: "pending",
      ready: "ready to send",
      synced: "synced",
      failed: "failed",
    } as Record<SyncState, string>,
    rangeGeneral: "general reference, not personalized",
    rangeDemo: "demo goal",
    rangeCareer: "career limit",
    source: (s: string) => `Source: ${s}`,
    noRange: "No general range",
    insufficientB: "Not enough data for a trend",
    insufficient: " in this window (at least 2 valid records from the same source are needed).",
    mixedB: "Trend not calculated:",
    mixed: " the records mix different sources (no-mixing rule).",
    originWord: (synthetic: boolean | null): string => (synthetic ? "simulated" : "manual"),
    dir: { up: "up", down: "down", flat: "unchanged" },
    between: (a: string, b: string, n: number, origin: string) => `Between ${a} and ${b}, the ${n} ${origin} records went from `,
    to: "to",
    simulated: "Simulated",
    manual: "Manual",
    usedRecords: "Records and rule used",
    records: "Records",
    until: "to",
    rule: "Rule",
    version: "version",
    excluded: (n: number) => `${n} ${n === 1 ? "record from another source was" : "records from another source were"} left out (no-mixing rule).`,
    noRecordsWindow: "No records in this window.",
    caption: (name: string) => `${name} records, most recent first`,
    colTime: "Time",
    colValue: "Value",
    colOrigin: "Source",
    colQuality: "Quality · sync",
    showing: (shown: number, total: number) => `Showing the ${shown} most recent of ${total} records.`,
    checkin: "Do a check-in",
    support: "Ask for support",
    back: "Back to health record",
    bp: "Blood pressure",
    noRecord: "no record yet",
    previous: "previous value:",
    systolic: "Systolic",
    diastolic: "Diastolic",
    series: "Series",
    last: (w: string) => `last ${w}`,
    highlighted: (l: string) => `Highlighted range: ${l}`,
    timeWindow: "Time window",
    whatChanged: (w: string) => `What changed in the last ${w}`,
    disclaimer: "Describes, does not diagnose: interpretation belongs to the mission medical team.",
    howCalc: "How it is calculated and what it does not mean",
    howCalcText: (w: string, v: string) =>
      `Astra compares the first and last valid record in the window (${w}), using only the same source as the most recent one. It is a descriptive, reproducible calculation (rule ${v}); no AI model decides anything here.`,
    notMeans: [
      "It does not identify the cause of the change.",
      "It is not a diagnosis or treatment advice.",
      "It does not compare you with other people.",
      "The values in this demo are simulated; they do not come from any astronaut.",
    ],
    recordsTitle: (bp: boolean, w: string) => `${bp ? "Systolic records" : "Records"} · last ${w}`,
    diaRecords: "Diastolic records",
    sideLabel: "Range, context and actions",
    rangeTitle: "Reference range",
    actions: "Actions",
    context: "NASA/CSA context",
    openSource: "Open source",
    newTab: " (opens in a new tab)",
    limitation: (withSection: boolean) => `Limitation${withSection ? " and section" : ""}`,
    section: (s: string) => `Section: ${s}`,
  },
};

type Dict = (typeof T)["pt"];

function RangeInfo({ def, title, t }: { def: IndicatorDef; title?: string; t: Dict }) {
  const r = def.range;
  const txt = useDomainText().indicator(def.code);
  return (
    <div className="indicator-range">
      {title && <p className="indicator-range__who small muted">{title}</p>}
      {r ? (
        <>
          <p className="indicator-range__label num">{txt.rangeLabel}</p>
          <p className="indicator-range__kind small">
            {r.kind === "general_reference" ? (
              t.rangeGeneral
            ) : r.kind === "demo_goal" ? (
              <>
                {t.rangeDemo} · <KindTag kind="hypothesis" />
              </>
            ) : (
              t.rangeCareer
            )}
          </p>
          <p className="muted small">{t.source(txt.rangeSource ?? r.source)}</p>
        </>
      ) : (
        <p className="indicator-range__label indicator-range__label--none">{t.noRange}</p>
      )}
      {txt.scaleNote && <p className="muted small">{txt.scaleNote}</p>}
    </div>
  );
}

function signed(delta: number, code: IndicatorCode) {
  const abs = formatValue(Math.abs(delta), code);
  return delta > 0 ? `+${abs}` : delta < 0 ? `−${abs}` : abs;
}

function TrendLine({ code, points, showName, t }: { code: IndicatorCode; points: Observation[]; showName: boolean; t: Dict }) {
  const def = indicator(code);
  const name = useDomainText().indicator(code).name;
  const { trend, excluded, synthetic } = trendForLatestOrigin(points);
  const originWord = t.originWord(synthetic);
  return (
    <div className="indicator-trend">
      {showName && <h3 className="indicator-trend__label">{name}</h3>}
      {trend.state === "insufficient_data" && (
        <p>
          <b>{t.insufficientB}</b>
          {t.insufficient}
        </p>
      )}
      {trend.state === "mixed_origins_blocked" && (
        <p>
          <b>{t.mixedB}</b>
          {t.mixed}
        </p>
      )}
      {trend.state === "descriptive_only" &&
        (() => {
          const first = points.find((p) => p.observationId === trend.inputIds[0]);
          const last = points.find((p) => p.observationId === trend.inputIds[1]);
          const dir = trend.direction === "up" ? t.dir.up : trend.direction === "down" ? t.dir.down : t.dir.flat;
          return (
            <>
              <p className="indicator-trend__sentence">
                {t.between(fmtDateTime(trend.start), fmtDateTime(trend.end), trend.points, originWord)}
                <b>
                  {formatValue(first?.value ?? null, code)} {def.unit}
                </b>{" "}
                {t.to}{" "}
                <b>
                  {formatValue(last?.value ?? null, code)} {def.unit}
                </b>{" "}
                (Δ {signed(trend.delta, code)} {def.unit}; {dir}).{" "}
                {trend.isSynthetic ? <span className="tag tag--simulated">{t.simulated}</span> : <span className="tag tag--manual">{t.manual}</span>}
              </p>
              <details className="indicator-details small">
                <summary>{t.usedRecords}</summary>
                <dl className="indicator-trend__meta">
                  <div>
                    <dt>{t.records}</dt>
                    <dd className="indicator-id">
                      {trend.inputIds[0]} <ArrowRight size={13} aria-label={t.until} /> {trend.inputIds[1]}
                    </dd>
                  </div>
                  <div>
                    <dt>{t.rule}</dt>
                    <dd>
                      describeTrend · {t.version} {TREND_RULE_VERSION}
                    </dd>
                  </div>
                </dl>
              </details>
            </>
          );
        })()}
      {excluded > 0 && <p className="indicator-trend__excluded small">{t.excluded(excluded)}</p>}
    </div>
  );
}

// The default connector already shows in the header; the table only repeats it when a record came from another source.
function RecordsTable({ points, code, feedName, t }: { points: Observation[]; code: IndicatorCode; feedName?: string; t: Dict }) {
  const dt = useDomainText();
  const rows = [...points].sort((a, b) => Date.parse(b.observedAt) - Date.parse(a.observedAt)).slice(0, 20);
  const def = indicator(code);
  const sourceName = (o: Observation) => (o.sourceRef ? dt.connector(o.sourceRef)?.name ?? o.sourceRef : "—");
  if (!rows.length) return <p className="muted">{t.noRecordsWindow}</p>;
  return (
    <>
      <div className="indicator-table-wrap">
        <table className="indicator-table">
          <caption className="visually-hidden">{t.caption(dt.indicator(code).name)}</caption>
          <thead>
            <tr>
              <th scope="col">{t.colTime}</th>
              <th scope="col" className="indicator-table__num">
                {t.colValue}
              </th>
              <th scope="col">{t.colOrigin}</th>
              <th scope="col">{t.colQuality}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.observationId}>
                <th scope="row">{fmtDateTime(o.observedAt)}</th>
                <td className="indicator-table__num">
                  <b>{formatValue(o.value, code)}</b> {o.value !== null && <span className="muted">{o.unit ?? def.unit}</span>}
                </td>
                <td>
                  <OriginTag o={o} />
                </td>
                <td className="indicator-table__src muted">
                  {sourceName(o) !== feedName && `${sourceName(o)} · `}
                  {t.quality[o.qualityState]} · {t.sync[o.syncState]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {points.length > rows.length && <p className="muted small">{t.showing(rows.length, points.length)}</p>}
    </>
  );
}

export function Indicator({ code }: { code: IndicatorCode }) {
  const def = indicator(code);
  const { byCode, latest } = useStore();
  const { openSupport } = useShell();
  const { lang, pick } = useLang();
  const t = pick(T);
  const dt = useDomainText();
  const txt = dt.indicator(code);
  const [hours, setHours] = useState(72);
  const isBp = code === "bp_systolic";
  const dia = indicator("bp_diastolic");

  const all = byCode(code);
  const lastRec = all[all.length - 1];
  const lastValid = latest(code);
  const now = Date.now();
  const points = withinWindow(all, hours, now);
  const diaPoints = isBp ? withinWindow(byCode("bp_diastolic"), hours, now) : [];
  const diaLast = isBp ? latest("bp_diastolic") : undefined;
  const windowLabel = WINDOWS.find((w) => w.hours === hours)![lang];
  const shownValue = lastRec?.value ?? null;
  const feed = connectorFor(code);
  const feedName = feed ? dt.connector(feed.id)?.name ?? feed.name : undefined;
  const refs = def.referenceIds.map((id) => dt.reference(id)).filter((r) => !!r);
  const selfReport = def.inputMode === "self_report";
  const actions = (
    <>
      {selfReport && (
        <a className="btn btn--primary btn--block" href="#/checkin">
          <ClipboardCheck size={18} aria-hidden /> {t.checkin}
        </a>
      )}
      <button type="button" className={`btn btn--block ${selfReport ? "" : "btn--primary"}`} onClick={openSupport}>
        <LifeBuoy size={18} aria-hidden /> {t.support}
      </button>
    </>
  );
  const sensor = txt.sensor;

  return (
    <div className="page indicator-page">
      {/* Back is a full pill button above the header. The supporting line moves below the value when the header stacks. */}
      <a className="btn indicator-back" href="#/health">
        <ArrowLeft size={18} aria-hidden />
        <span>{t.back}</span>
      </a>
      <header className="panel indicator-head">
        <SignalTile code={code} size={32} className="indicator-head__tile" />
        <h1 className="indicator-head__title">{isBp ? t.bp : txt.name}</h1>
        <p className="indicator-head__meta small">
          <span className={`indicator-pillar indicator-pillar--${def.pillar}`}>{dt.pillar(def.pillar)}</span>
          {(sensor || feedName) && <span>{[sensor, feedName].filter(Boolean).join(" · ")}</span>}
        </p>
        <div className="indicator-head__value">
          <p className="indicator-head__figure">
            <b className="display num">
              {isBp ? `${formatValue(shownValue, code)}/${formatValue(diaLast?.value ?? null, "bp_diastolic")}` : formatValue(shownValue, code)}
            </b>
            {shownValue !== null && <span className="indicator-head__unit">{def.unit}</span>}
          </p>
          <p className="indicator-head__when">
            <OriginTag o={lastRec} />
            <span className="muted small">{lastRec ? fmtDateTime(lastRec.observedAt) : t.noRecord}</span>
          </p>
          {shownValue !== null && !isBp && <RangeHint value={shownValue} def={def} />}
          {shownValue === null && lastValid && (
            <p className="muted small">
              {t.previous} {formatValue(lastValid.value, code)} {def.unit} ({fmtDateTime(lastValid.observedAt)})
            </p>
          )}
        </div>
        {/* On phone and tablet the actions move up to the first screen; the side column only appears at the end of the page. */}
        <div className="indicator-head__actions">{actions}</div>
      </header>

      <div className="indicator-layout">
        <div className="indicator-main">
          {code === "radiation_dose" && <RadiationPanel titleId="indicator-rad-title" className="stagger-in indicator-rad" />}
          <section className="panel stagger-in" style={{ "--i": 1 } as CSSProperties} aria-labelledby="indicator-chart-title">
            <div className="panel__head">
              <div>
                <h2 id="indicator-chart-title" className="indicator-h2">
                  <ChartSpline size={20} aria-hidden className="indicator-h2__icon" />
                  {isBp ? t.systolic : t.series} · {t.last(windowLabel)}
                </h2>
                {def.range && <p>{t.highlighted(txt.rangeLabel ?? def.range.label)}</p>}
              </div>
              <div className="indicator-window" role="group" aria-label={t.timeWindow}>
                {WINDOWS.map((w) => (
                  <button
                    key={w.hours}
                    type="button"
                    className={`chip ${hours === w.hours ? "chip--on" : ""}`}
                    aria-pressed={hours === w.hours}
                    onClick={() => setHours(w.hours)}
                  >
                    {w[lang]}
                  </button>
                ))}
              </div>
            </div>
            <LineChart points={points} range={def.range} />
            {isBp && (
              <div className="indicator-sub">
                <h3>
                  {t.diastolic} · {t.last(windowLabel)}
                </h3>
                <LineChart points={diaPoints} range={dia.range} height={180} />
              </div>
            )}
          </section>

          <section className="panel indicator-insight stagger-in" style={{ "--i": 2 } as CSSProperties} aria-labelledby="indicator-insight-title">
            <div className="panel__head">
              <h2 id="indicator-insight-title" className="indicator-h2">
                <Sparkles size={20} aria-hidden className="indicator-h2__icon" />
                {t.whatChanged(windowLabel)}
              </h2>
              <KindTag kind="interpretation" />
            </div>
            <TrendLine code={code} points={points} showName={isBp} t={t} />
            {isBp && <TrendLine code="bp_diastolic" points={diaPoints} showName t={t} />}
            <p className="indicator-disclaimer small">{t.disclaimer}</p>
            <details className="indicator-details small">
              <summary>{t.howCalc}</summary>
              <p>{t.howCalcText(windowLabel, TREND_RULE_VERSION)}</p>
              <ul>
                {t.notMeans.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </details>
          </section>

          <section className="panel stagger-in" style={{ "--i": 3 } as CSSProperties} aria-labelledby="indicator-records-title">
            <div className="panel__head">
              <h2 id="indicator-records-title" className="indicator-h2">
                <ListChecks size={20} aria-hidden className="indicator-h2__icon" />
                {t.recordsTitle(isBp, windowLabel)}
              </h2>
            </div>
            <RecordsTable points={points} code={code} feedName={feedName} t={t} />
            {isBp && (
              <div className="indicator-sub">
                <h3>{t.diaRecords}</h3>
                <RecordsTable points={diaPoints} code="bp_diastolic" feedName={feedName} t={t} />
              </div>
            )}
          </section>
        </div>

        <aside className="panel indicator-side" aria-label={t.sideLabel}>
          <section className="indicator-side__block" aria-labelledby="indicator-range-title">
            <h2 id="indicator-range-title" className="indicator-side__title">
              <Ruler size={18} aria-hidden className="indicator-h2__icon" /> {t.rangeTitle}
            </h2>
            {isBp ? (
              <div className="indicator-range-pair">
                <RangeInfo def={def} title={t.systolic} t={t} />
                <RangeInfo def={dia} title={t.diastolic} t={t} />
              </div>
            ) : (
              <RangeInfo def={def} t={t} />
            )}
          </section>

          <section className="indicator-side__block indicator-actions" aria-label={t.actions}>
            {actions}
          </section>

          {refs.length > 0 && (
            <section className="indicator-side__block" aria-labelledby="indicator-refs-title">
              <h2 id="indicator-refs-title" className="indicator-side__title">
                <BookOpenText size={18} aria-hidden className="indicator-h2__icon" /> {t.context}
              </h2>
              <div className="indicator-refs">
                {refs.map((ref) => (
                  <article key={ref.id} className="indicator-ref">
                    <h3>{ref.title}</h3>
                    <p className="small">{ref.claim}</p>
                    <p className="indicator-ref__meta small">
                      <KindTag kind="fact" />
                      <span className="muted">
                        {ref.institution} · {ref.pageDate}
                      </span>
                      <a href={ref.url} target="_blank" rel="noopener noreferrer" className="indicator-ref__link">
                        {t.openSource} <ExternalLink size={14} aria-hidden />
                        <span className="visually-hidden">{t.newTab}</span>
                      </a>
                    </p>
                    <details className="indicator-details small">
                      <summary>{t.limitation(!!ref.section)}</summary>
                      <p>{ref.limitation}</p>
                      {ref.section && <p>{t.section(ref.section)}</p>}
                    </details>
                  </article>
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
