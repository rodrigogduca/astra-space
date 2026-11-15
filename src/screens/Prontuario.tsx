import { ChevronRight, LifeBuoy } from "lucide-react";
import { useStore } from "../store";
import { useShell } from "../components/Shell";
import { Icon } from "../components/Icon";
import { PHOTO } from "../components/Credits";
import { Bar, OriginTag, RangeHint, Sparkline, relTime } from "../components/ui";
import { CAREER_LIMIT_MSV, GROUP_LABEL, INDICATORS, formatValue, indicator, type Group, type IndicatorDef } from "../domain/indicators";
import { connector } from "../domain/integrations";
import { MISSION } from "../domain/simulator";
import { withinWindow } from "../domain/trend";
import type { Observation, Pillar } from "../domain/types";
import "./Prontuario.css";

// Prontuário eletrônico de saúde (REQ-1, 9.1, 11.3; RV-7). Cores neutras: nada de semáforo de risco.
// Cada grupo é um painel de telemetria: uma linha por indicador, todas com a mesma estrutura.

const lastRecord = (all: Observation[]): Observation | undefined => all[all.length - 1];

const sourceName = (o: Observation) => (o.sourceRef ? connector(o.sourceRef)?.name ?? o.sourceRef : "origem não informada");

const PILLAR_COLOR: Record<Pillar, string> = { corpo: "var(--corpo)", mente: "var(--mente)", espirito: "var(--espirito)" };

// Uma linha de apoio por grupo; o ícone fica só nas linhas (não repete no cabeçalho).
const GROUP_NOTE: Record<Group, string> = {
  vitais: "Sensores vestíveis · últimas 72 h",
  metabolismo: "Monitor contínuo de glicose",
  exposicao: "Dose diária e ar da cabine",
  rotina: "O que sustenta o corpo no dia a dia",
  mente: "Como você se sente, nas suas palavras",
  espirito: "Sentido, conexão e pausa",
};

function Meta({ o }: { o?: Observation }) {
  return (
    <span className="tl-row__meta">
      <OriginTag o={o} />
      <span className="tl-row__when muted">
        {o ? relTime(o.observedAt) : "nenhum registro ainda"}
        {/* A fonte só aparece no painel largo; nos estreitos fica no detalhe do indicador. */}
        {o && <span className="tl-row__src"> · {sourceName(o)}</span>}
      </span>
    </span>
  );
}

function Row({ def }: { def: IndicatorDef }) {
  const { byCode, latest } = useStore();
  const all = byCode(def.code);
  // O registro mais recente manda: se veio sem valor, mostramos "—" + Ausente (nunca 0).
  const last = lastRecord(all);
  const value = last?.value ?? null;
  const previous = value === null ? latest(def.code) : undefined;
  const label = `${def.name}: ${value === null ? "sem valor" : `${formatValue(value, def.code)} ${def.unit}`}. Abrir detalhe`;
  return (
    <li>
      <a className="tl-row" href={`#/prontuario/${def.code}`} aria-label={label}>
        <span className={`icon-tile icon-tile--${def.pillar} tl-row__icon`}>
          <Icon name={def.icon} size={20} />
        </span>
        <span className="tl-row__name">
          <span className="tl-row__title">{def.name}</span>
          <span className="tl-row__hint">
            {value === null ? (
              <span className="hint">{previous ? `valor anterior: ${formatValue(previous.value, def.code)} ${def.unit}` : "sem valor registrado"}</span>
            ) : (
              <RangeHint value={value} def={def} />
            )}
          </span>
        </span>
        <span className="tl-row__value">
          <b>{formatValue(value, def.code)}</b>
          {value !== null && <span className="tl-row__unit">{def.unit}</span>}
        </span>
        <span className="tl-row__spark">
          <Sparkline points={withinWindow(all, 72, Date.now())} width={112} height={32} color={PILLAR_COLOR[def.pillar]} />
        </span>
        <Meta o={last} />
        <ChevronRight className="tl-row__go" size={18} aria-hidden />
      </a>
    </li>
  );
}

function PressureRow() {
  const { byCode } = useStore();
  const sysDef = indicator("bp_systolic");
  const diaDef = indicator("bp_diastolic");
  const sysAll = byCode("bp_systolic");
  const sys = lastRecord(sysAll);
  const dia = lastRecord(byCode("bp_diastolic"));
  const sysV = sys?.value ?? null;
  const diaV = dia?.value ?? null;
  const text = `${formatValue(sysV, "bp_systolic")}/${formatValue(diaV, "bp_diastolic")}`;
  const hasAny = sysV !== null || diaV !== null;
  return (
    <li>
      <a className="tl-row" href="#/prontuario/bp_systolic" aria-label={`Pressão arterial: ${hasAny ? `${text} mmHg` : "sem valor"}. Abrir detalhe`}>
        <span className="icon-tile icon-tile--corpo tl-row__icon">
          <Icon name={sysDef.icon} size={20} />
        </span>
        <span className="tl-row__name">
          <span className="tl-row__title">Pressão arterial</span>
          <span className="tl-row__hint tl-row__hint--pair">
            <span className="hint">sist. {sysV === null ? "sem valor" : <RangeHint value={sysV} def={sysDef} />}</span>
            <span className="hint">diast. {diaV === null ? "sem valor" : <RangeHint value={diaV} def={diaDef} />}</span>
          </span>
        </span>
        <span className="tl-row__value">
          <b>{text}</b>
          {hasAny && <span className="tl-row__unit">mmHg</span>}
        </span>
        <span className="tl-row__spark">
          <Sparkline points={withinWindow(sysAll, 72, Date.now())} width={112} height={32} color="var(--corpo)" />
        </span>
        <Meta o={sys} />
        <ChevronRight className="tl-row__go" size={18} aria-hidden />
      </a>
    </li>
  );
}

function GroupPanel({ group, wide = false }: { group: Group; wide?: boolean }) {
  const defs = INDICATORS.filter((d) => d.group === group && d.code !== "bp_diastolic");
  return (
    <section className={`panel tl ${wide ? "tl--wide" : ""}`} aria-labelledby={`pr-group-${group}`}>
      <div className="tl__title">
        <h2 id={`pr-group-${group}`}>{GROUP_LABEL[group]}</h2>
        <p className="muted small">{GROUP_NOTE[group]}</p>
      </div>
      {wide && (
        <div className="tl-cols small muted" aria-hidden>
          <span />
          <span>Indicador e faixa</span>
          <span>Último valor</span>
          <span>72 h</span>
          <span>Origem e hora</span>
          <span />
        </div>
      )}
      <ul className="tl__list" role="list">
        {defs.map((def) => (def.code === "bp_systolic" ? <PressureRow key={def.code} /> : <Row key={def.code} def={def} />))}
      </ul>
    </section>
  );
}

const fmtNum = (v: number, d: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });

function RadiationPanel() {
  const { byCode } = useStore();
  const daily = byCode("radiation_dose").filter((o) => o.isSynthetic && o.qualityState === "valid" && o.value !== null);
  const mean = daily.length ? daily.reduce((s, o) => s + (o.value as number), 0) / daily.length : null;
  const total = mean === null ? null : mean * MISSION.day;
  const pct = total === null ? 0 : total / CAREER_LIMIT_MSV;
  return (
    <section className="panel pr-rad" aria-labelledby="pr-rad-title">
      <div className="pr-rad__head">
        <h2 id="pr-rad-title">Radiação acumulada</h2>
        <span className="tag tag--sim">Simulado</span>
      </div>
      {total === null || mean === null ? (
        <div className="pr-rad__figure">
          <p className="pr-rad__value">
            <b>—</b>
          </p>
          <span className="tag tag--missing">Não coletado</span>
        </div>
      ) : (
        <>
          <div className="pr-rad__figure">
            <p className="pr-rad__value">
              <b>{fmtNum(total, 1)}</b>
              <span className="pr-rad__unit">mSv</span>
            </p>
            <p className="pr-rad__pct">
              <b>{fmtNum(pct * 100, 1)}%</b>
              <span className="muted small">do limite de {CAREER_LIMIT_MSV} mSv</span>
            </p>
          </div>
          <div className="pr-rad__bar" role="img" aria-label={`${fmtNum(pct * 100, 1)}% do limite de carreira de ${CAREER_LIMIT_MSV} mSv`}>
            <Bar value={pct} color="var(--accent)" height={12} />
            <div className="pr-rad__scale small muted num" aria-hidden>
              <span>0</span>
              <span>{CAREER_LIMIT_MSV} mSv · NASA-STD-3001</span>
            </div>
          </div>
          <details className="pr-details small">
            <summary>Como é calculado</summary>
            <p>
              Média diária simulada de {fmtNum(mean, 2)} mSv ({daily.length} registros) × {MISSION.day} dias de missão, comparada ao limite de
              carreira da NASA. O dosímetro CANS não está conectado: valores fictícios.
            </p>
          </details>
        </>
      )}
    </section>
  );
}

export function Prontuario() {
  const { openSupport } = useShell();
  return (
    <div className="page prontuario">
      <div className="pr-top">
        <header className="pr-hero">
          <div className="photo-band pr-band">
            <img src={PHOTO.night} alt="" />
            <span className="photo-band__credit">Foto: NASA</span>
            <div className="photo-band__body pr-band__body">
              <span className="pr-avatar" aria-hidden>
                P
              </span>
              <div className="pr-band__id">
                <h1>{MISSION.callSign}</h1>
                <p className="pr-band__meta num">
                  Prontuário de saúde · {MISSION.crewId} · {MISSION.name} · dia {MISSION.day}
                </p>
              </div>
              <button type="button" className="btn btn--primary pr-band__support" onClick={openSupport}>
                <LifeBuoy size={18} aria-hidden /> Pedir apoio
              </button>
            </div>
          </div>
          <p className="pr-legend small" aria-label="Legenda dos selos de origem">
            <span>
              <span className="tag tag--sim">Simulado</span> pela demo
            </span>
            <span>
              <span className="tag tag--manual">Manual</span> por você
            </span>
            <span>
              <span className="tag tag--missing">Ausente</span> sem valor
            </span>
            <span>
              <span className="tag tag--missing">Não coletado</span> sem registro
            </span>
          </p>
        </header>
        <RadiationPanel />
      </div>

      <GroupPanel group="vitais" wide />

      {/* Duas linhas de dois painéis: corpo (sensores + rotina) e depois mente e espírito. */}
      <div className="pr-groups">
        <div className="pr-groups__stack">
          <GroupPanel group="metabolismo" />
          <GroupPanel group="exposicao" />
        </div>
        <GroupPanel group="rotina" />
      </div>
      <div className="pr-groups">
        <GroupPanel group="mente" />
        <GroupPanel group="espirito" />
      </div>
    </div>
  );
}
