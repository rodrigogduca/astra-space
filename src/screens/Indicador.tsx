import { useState } from "react";
import { ArrowLeft, ArrowRight, ClipboardCheck, ExternalLink, LifeBuoy } from "lucide-react";
import { useStore } from "../store";
import { useShell } from "../components/Shell";
import { Icon } from "../components/Icon";
import { KindTag, OriginTag, RangeHint, fmtDateTime } from "../components/ui";
import { LineChart } from "../components/Chart";
import { PILLAR_LABEL, formatValue, indicator, type IndicatorDef } from "../domain/indicators";
import { connector, connectorFor } from "../domain/integrations";
import { refById } from "../domain/references";
import { TREND_RULE_VERSION, trendForLatestOrigin, withinWindow } from "../domain/trend";
import type { IndicatorCode, Observation, QualityState, SyncState } from "../domain/types";
import "./Indicador.css";

// Detalhe do indicador com insight explicável (REQ-2, 9.1; RV-7). Só descreve: nunca diagnostica.
// Desktop: coluna principal (gráfico, insight, registros) + coluna lateral fixa (faixa, contexto NASA/CSA, ações).

const WINDOWS = [
  { hours: 24, label: "24 h" },
  { hours: 72, label: "72 h" },
  { hours: 168, label: "7 d" },
];

const QUALITY_LABEL: Record<QualityState, string> = {
  valid: "válido",
  missing: "ausente",
  invalid: "inválido",
  unverified: "não verificado",
};

const SYNC_LABEL: Record<SyncState, string> = {
  local_only: "só no aparelho",
  pending: "pendente",
  ready: "pronto para envio",
  synced: "sincronizado",
  failed: "falhou",
};

const sourceName = (o: Observation) => (o.sourceRef ? connector(o.sourceRef)?.name ?? o.sourceRef : "—");

function RangeInfo({ def, title }: { def: IndicatorDef; title?: string }) {
  const r = def.range;
  return (
    <div className="ind-range">
      {title && <p className="ind-range__who small muted">{title}</p>}
      {r ? (
        <>
          <p className="ind-range__label num">{r.label}</p>
          <p className="ind-range__kind small">
            {r.kind === "referencia_geral" ? (
              "referência geral, não personalizada"
            ) : r.kind === "meta_demo" ? (
              <>
                meta da demo · <KindTag kind="hipotese" />
              </>
            ) : (
              "limite de carreira"
            )}
          </p>
          <p className="muted small">Fonte: {r.source}</p>
        </>
      ) : (
        <p className="ind-range__label ind-range__label--none">Sem faixa geral</p>
      )}
      {def.scaleNote && <p className="muted small">{def.scaleNote}</p>}
    </div>
  );
}

function signed(delta: number, code: IndicatorCode) {
  const abs = formatValue(Math.abs(delta), code);
  return delta > 0 ? `+${abs}` : delta < 0 ? `−${abs}` : abs;
}

function TrendLine({ code, points, showName }: { code: IndicatorCode; points: Observation[]; showName: boolean }) {
  const def = indicator(code);
  const { trend, excluded, synthetic } = trendForLatestOrigin(points);
  const originWord = synthetic ? "simulados" : "manuais";
  return (
    <div className="ind-trend">
      {showName && <h3 className="ind-trend__label">{def.name}</h3>}
      {trend.state === "insufficient_data" && (
        <p>
          <b>Dados insuficientes para tendência</b> nesta janela (são precisos ao menos 2 registros válidos da mesma origem).
        </p>
      )}
      {trend.state === "mixed_origins_blocked" && (
        <p>
          <b>Tendência não calculada:</b> os registros misturam origens diferentes (regra anti-mistura).
        </p>
      )}
      {trend.state === "descriptive_only" &&
        (() => {
          const first = points.find((p) => p.observationId === trend.inputIds[0]);
          const last = points.find((p) => p.observationId === trend.inputIds[1]);
          const dir = trend.direction === "up" ? "subiu" : trend.direction === "down" ? "desceu" : "ficou igual";
          return (
            <>
              <p className="ind-trend__sentence">
                Entre {fmtDateTime(trend.start)} e {fmtDateTime(trend.end)}, os {trend.points} registros {originWord} foram de{" "}
                <b>
                  {formatValue(first?.value ?? null, code)} {def.unit}
                </b>{" "}
                para{" "}
                <b>
                  {formatValue(last?.value ?? null, code)} {def.unit}
                </b>{" "}
                (Δ {signed(trend.delta, code)} {def.unit}; {dir}).{" "}
                {trend.isSynthetic ? <span className="tag tag--sim">Simulado</span> : <span className="tag tag--manual">Manual</span>}
              </p>
              <details className="ind-details small">
                <summary>Registros e regra usados</summary>
                <dl className="ind-trend__meta">
                  <div>
                    <dt>Registros</dt>
                    <dd className="ind-id">
                      {trend.inputIds[0]} <ArrowRight size={13} aria-label="até" /> {trend.inputIds[1]}
                    </dd>
                  </div>
                  <div>
                    <dt>Regra</dt>
                    <dd>describeTrend · versão {TREND_RULE_VERSION}</dd>
                  </div>
                </dl>
              </details>
            </>
          );
        })()}
      {excluded > 0 && (
        <p className="ind-trend__excluded small">
          {excluded} {excluded === 1 ? "registro de outra origem ficou" : "registros de outra origem ficaram"} de fora (regra anti-mistura).
        </p>
      )}
    </div>
  );
}

// O conector padrão já aparece no cabeçalho; a tabela só o repete quando o registro veio de outra fonte.
function RecordsTable({ points, code, feedName }: { points: Observation[]; code: IndicatorCode; feedName?: string }) {
  const rows = [...points].sort((a, b) => Date.parse(b.observedAt) - Date.parse(a.observedAt)).slice(0, 20);
  const def = indicator(code);
  if (!rows.length) return <p className="muted">Sem registros nesta janela.</p>;
  return (
    <>
      <div className="ind-table-wrap">
        <table className="ind-table">
          <caption className="visually-hidden">Registros de {def.name}, mais recentes primeiro</caption>
          <thead>
            <tr>
              <th scope="col">Horário</th>
              <th scope="col" className="ind-table__num">
                Valor
              </th>
              <th scope="col">Origem</th>
              <th scope="col">Qualidade · envio</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.observationId}>
                <th scope="row">
                  {fmtDateTime(o.observedAt)}
                </th>
                <td className="ind-table__num">
                  <b>{formatValue(o.value, code)}</b> {o.value !== null && <span className="muted">{o.unit ?? def.unit}</span>}
                </td>
                <td>
                  <OriginTag o={o} />
                </td>
                <td className="ind-table__src muted">
                  {sourceName(o) !== feedName && `${sourceName(o)} · `}
                  {QUALITY_LABEL[o.qualityState]} · {SYNC_LABEL[o.syncState]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {points.length > rows.length && (
        <p className="muted small">
          Mostrando os {rows.length} mais recentes de {points.length} registros.
        </p>
      )}
    </>
  );
}

export function Indicador({ code }: { code: IndicatorCode }) {
  const def = indicator(code);
  const { byCode, latest } = useStore();
  const { openSupport } = useShell();
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
  const windowLabel = WINDOWS.find((w) => w.hours === hours)!.label;
  const shownValue = lastRec?.value ?? null;
  const feed = connectorFor(code);
  const refs = def.referenceIds.map(refById).filter((r): r is NonNullable<typeof r> => !!r);
  const selfReport = def.inputMode === "autorrelato";
  const actions = (
    <>
      {selfReport && (
        <a className="btn btn--primary btn--block" href="#/checkin">
          <ClipboardCheck size={18} aria-hidden /> Fazer check-in
        </a>
      )}
      <button type="button" className={`btn btn--block ${selfReport ? "" : "btn--primary"}`} onClick={openSupport}>
        <LifeBuoy size={18} aria-hidden /> Pedir apoio
      </button>
    </>
  );

  return (
    <div className="page indicador">
      {/* Voltar é um ícone ao lado do título (nunca rótulo acima dele). A linha de apoio desce para baixo do valor quando o cabeçalho empilha. */}
      <header className="panel ind-head">
        <a className="ind-back" href="#/prontuario" aria-label="Voltar ao prontuário" title="Voltar ao prontuário">
          <ArrowLeft size={20} aria-hidden />
        </a>
        <span className={`icon-tile icon-tile--${def.pillar} ind-head__tile`}>
          <Icon name={def.icon} size={28} />
        </span>
        <h1 className="ind-head__title">{isBp ? "Pressão arterial" : def.name}</h1>
        <p className="ind-head__meta small">
          <span className={`ind-pillar ind-pillar--${def.pillar}`}>{PILLAR_LABEL[def.pillar]}</span>
          {(def.sensor || feed) && <span>{[def.sensor, feed?.name].filter(Boolean).join(" · ")}</span>}
        </p>
        <div className="ind-head__value">
          <p className="ind-head__figure">
            <b>
              {isBp ? `${formatValue(shownValue, code)}/${formatValue(diaLast?.value ?? null, "bp_diastolic")}` : formatValue(shownValue, code)}
            </b>
            {shownValue !== null && <span className="ind-head__unit">{def.unit}</span>}
          </p>
          <p className="ind-head__when">
            <OriginTag o={lastRec} />
            <span className="muted small">{lastRec ? fmtDateTime(lastRec.observedAt) : "nenhum registro ainda"}</span>
          </p>
          {shownValue !== null && !isBp && <RangeHint value={shownValue} def={def} />}
          {shownValue === null && lastValid && (
            <p className="muted small">
              valor anterior: {formatValue(lastValid.value, code)} {def.unit} ({fmtDateTime(lastValid.observedAt)})
            </p>
          )}
        </div>
        {/* No celular e no tablet as ações sobem para a primeira tela; a lateral só aparece no fim da página. */}
        <div className="ind-head__actions">{actions}</div>
      </header>

      <div className="ind-layout">
        <div className="ind-main">
          <section className="panel" aria-labelledby="ind-chart-title">
            <div className="panel__head">
              <div>
                <h2 id="ind-chart-title">{isBp ? "Sistólica" : "Série"} · últimas {windowLabel}</h2>
                {def.range && <p>Faixa em destaque: {def.range.label}</p>}
              </div>
              <div className="ind-window" role="group" aria-label="Janela de tempo">
                {WINDOWS.map((w) => (
                  <button
                    key={w.hours}
                    type="button"
                    className={`chip ${hours === w.hours ? "chip--on" : ""}`}
                    aria-pressed={hours === w.hours}
                    onClick={() => setHours(w.hours)}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
            </div>
            <LineChart points={points} range={def.range} />
            {isBp && (
              <div className="ind-sub">
                <h3>Diastólica · últimas {windowLabel}</h3>
                <LineChart points={diaPoints} range={dia.range} height={180} />
              </div>
            )}
          </section>

          <section className="panel ind-insight" aria-labelledby="ind-insight-title">
            <div className="panel__head">
              <h2 id="ind-insight-title">O que mudou nas últimas {windowLabel}</h2>
              <KindTag kind="interpretacao" />
            </div>
            <TrendLine code={code} points={points} showName={isBp} />
            {isBp && <TrendLine code="bp_diastolic" points={diaPoints} showName />}
            <p className="ind-disclaimer small">Descreve, não diagnostica: a interpretação é da equipe médica da missão.</p>
            <details className="ind-details small">
              <summary>Como é calculado e o que não significa</summary>
              <p>
                O Astra compara o primeiro e o último registro válido da janela ({windowLabel}), só da mesma origem do mais recente. É um cálculo
                descritivo e reproduzível (regra {TREND_RULE_VERSION}); nenhum modelo de IA decide nada aqui.
              </p>
              <ul>
                <li>Não identifica a causa da mudança.</li>
                <li>Não é diagnóstico nem orientação de tratamento.</li>
                <li>Não compara você com outras pessoas.</li>
                <li>Os valores desta demo são simulados; não vêm de nenhum astronauta.</li>
              </ul>
            </details>
          </section>

          <section className="panel" aria-labelledby="ind-records-title">
            <div className="panel__head">
              <h2 id="ind-records-title">
                Registros {isBp ? "da sistólica " : ""}· últimas {windowLabel}
              </h2>
            </div>
            <RecordsTable points={points} code={code} feedName={feed?.name} />
            {isBp && (
              <div className="ind-sub">
                <h3>Registros da diastólica</h3>
                <RecordsTable points={diaPoints} code="bp_diastolic" feedName={feed?.name} />
              </div>
            )}
          </section>
        </div>

        <aside className="panel ind-side" aria-label="Faixa, contexto e ações">
          <section className="ind-side__block" aria-labelledby="ind-range-title">
            <h2 id="ind-range-title" className="ind-side__title">
              Faixa de referência
            </h2>
            {isBp ? (
              <div className="ind-range-pair">
                <RangeInfo def={def} title="Sistólica" />
                <RangeInfo def={dia} title="Diastólica" />
              </div>
            ) : (
              <RangeInfo def={def} />
            )}
          </section>

          <section className="ind-side__block ind-actions" aria-label="Ações">
            {actions}
          </section>

          {refs.length > 0 && (
            <section className="ind-side__block" aria-labelledby="ind-refs-title">
              <h2 id="ind-refs-title" className="ind-side__title">
                Contexto NASA/CSA
              </h2>
              <div className="ind-refs">
                {refs.map((ref) => (
                  <article key={ref.id} className="ind-ref">
                    <h3>{ref.title}</h3>
                    <p className="small">{ref.claim}</p>
                    <p className="ind-ref__meta small">
                      <KindTag kind="fato" />
                      <span className="muted">
                        {ref.institution} · {ref.pageDate}
                      </span>
                      <a href={ref.url} target="_blank" rel="noopener noreferrer" className="ind-ref__link">
                        Abrir fonte <ExternalLink size={14} aria-hidden />
                        <span className="visually-hidden"> (abre em nova aba)</span>
                      </a>
                    </p>
                    <details className="ind-details small">
                      <summary>Limitação{ref.section ? " e seção" : ""}</summary>
                      <p>{ref.limitation}</p>
                      {ref.section && <p>Seção: {ref.section}</p>}
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
