import type { CSSProperties } from "react";
import { ChevronRight, LifeBuoy, Radiation } from "lucide-react";
import { useStore } from "../store";
import { useShell } from "../components/Shell";
import { Icon } from "../components/Icon";
import { PHOTO } from "../components/Credits";
import { MorseRule } from "../components/Logo";
import { INDICATOR_TINT } from "../components/tints";
import { OriginTag, RangeHint, Sparkline, relTime } from "../components/ui";
import { CAREER_LIMIT_MSV, INDICATORS, formatValue, indicator, type Group, type IndicatorDef } from "../domain/indicators";
import { MISSION } from "../domain/simulator";
import { withinWindow } from "../domain/trend";
import type { IconName } from "../domain/icons";
import type { IndicatorCode, Observation, Pillar } from "../domain/types";
import { locale, useLang } from "../i18n/lang";
import { useDomainText } from "../i18n/domainText";
import "./HealthRecord.css";

// Electronic health record (REQ-1, 9.1, 11.3; RV-7). Neutral colors: no risk traffic light.
// Each group is a telemetry panel: one row per indicator, all with the same structure.

const T = {
  pt: {
    // One supporting line per group; the icon lives only on the rows (not repeated in the header).
    groupNote: {
      vitals: "Sensores vestíveis · últimas 72 h",
      metabolism: "Monitor contínuo de glicose",
      exposure: "Dose diária e ar da cabine",
      routine: "O que sustenta o corpo no dia a dia",
      mind: "Como você se sente, nas suas palavras",
      spirit: "Sentido, conexão e pausa",
    } as Record<Group, string>,
    noSource: "origem não informada",
    noRecord: "nenhum registro ainda",
    noValue: "sem valor",
    noValueRecorded: "sem valor registrado",
    previous: (v: string) => `valor anterior: ${v}`,
    openDetail: "Abrir detalhe",
    bp: "Pressão arterial",
    sys: "sist.",
    dia: "diast.",
    colIndicator: "Indicador e faixa",
    colLast: "Último valor",
    colOrigin: "Origem e hora",
    radTitle: "Radiação acumulada",
    simulated: "Simulado",
    radSub: (d: number) => `dose estimada até o dia ${d}`,
    notCollected: "Não coletado",
    ofCareer: (l: number) => `do limite de carreira de ${l} mSv`,
    pctLabel: (p: string, l: number) => `${p}% do limite de carreira de ${l} mSv`,
    radNote: "Dosímetro CANS não conectado: valores fictícios da demo.",
    howCalc: "Como é calculado",
    calc: (m: string, n: number, d: number) =>
      `Média diária simulada de ${m} mSv (${n} registros) × ${d} dias de missão, comparada ao limite de carreira da NASA.`,
    photo: "Foto: NASA",
    record: "Prontuário de saúde",
    day: "dia",
    support: "Pedir apoio",
    legend: "Legenda dos selos de origem",
    manual: "Manual",
    missing: "Ausente",
    byDemo: "pela demo",
    byYou: "por você",
    withoutValue: "sem valor",
    withoutRecord: "sem registro",
  },
  en: {
    groupNote: {
      vitals: "Wearable sensors · last 72 h",
      metabolism: "Continuous glucose monitor",
      exposure: "Daily dose and cabin air",
      routine: "What keeps the body going day to day",
      mind: "How you feel, in your own words",
      spirit: "Meaning, connection and pause",
    } as Record<Group, string>,
    noSource: "source not given",
    noRecord: "no record yet",
    noValue: "no value",
    noValueRecorded: "no value recorded",
    previous: (v: string) => `previous value: ${v}`,
    openDetail: "Open details",
    bp: "Blood pressure",
    sys: "sys.",
    dia: "dia.",
    colIndicator: "Indicator and range",
    colLast: "Latest value",
    colOrigin: "Source and time",
    radTitle: "Cumulative radiation",
    simulated: "Simulated",
    radSub: (d: number) => `estimated dose through day ${d}`,
    notCollected: "Not collected",
    ofCareer: (l: number) => `of the ${l} mSv career limit`,
    pctLabel: (p: string, l: number) => `${p}% of the ${l} mSv career limit`,
    radNote: "CANS dosimeter not connected: fictional demo values.",
    howCalc: "How it is calculated",
    calc: (m: string, n: number, d: number) =>
      `Simulated daily average of ${m} mSv (${n} records) × ${d} mission days, compared with NASA's career limit.`,
    photo: "Photo: NASA",
    record: "Health record",
    day: "day",
    support: "Ask for support",
    legend: "Source badge legend",
    manual: "Manual",
    missing: "Missing",
    byDemo: "by the demo",
    byYou: "by you",
    withoutValue: "no value",
    withoutRecord: "no record",
  },
};

const lastRecord = (all: Observation[]): Observation | undefined => all[all.length - 1];

const PILLAR_COLOR: Record<Pillar, string> = { body: "var(--body)", mind: "var(--mind)", spirit: "var(--spirit)" };

// Title icon for each group (section with an icon; each signal's own icon lives on its row).
const GROUP_ICON: Record<Group, IconName> = {
  vitals: "heart-pulse",
  metabolism: "droplet",
  exposure: "radiation",
  routine: "moon",
  mind: "brain",
  spirit: "sparkles",
};

// Tile with the signal's own icon in its identity color (INDICATOR_TINT). Not a traffic light.
// Radiation has its own emblem: a yellow icon on a dark background, to draw attention.
export function SignalTile({ code, size = 24, className = "" }: { code: IndicatorCode; size?: number; className?: string }) {
  const rad = code === "radiation_dose";
  return (
    <span className={`signal-tile ${rad ? "signal-tile--rad" : ""} ${className}`} style={{ "--tint": INDICATOR_TINT[code] } as CSSProperties} aria-hidden>
      {rad ? <Radiation size={size} strokeWidth={2.25} /> : <Icon name={indicator(code).icon} size={size} strokeWidth={2.25} />}
    </span>
  );
}

const stagger = (i: number) => ({ "--i": i }) as CSSProperties;

function Meta({ o }: { o?: Observation }) {
  const t = useLang().pick(T);
  const dt = useDomainText();
  const sourceName = (x: Observation) => (x.sourceRef ? dt.connector(x.sourceRef)?.name ?? x.sourceRef : t.noSource);
  return (
    <span className="telemetry-row__meta">
      <OriginTag o={o} />
      <span className="telemetry-row__when muted">
        {o ? relTime(o.observedAt) : t.noRecord}
        {/* The source only shows on the wide panel; on narrow ones it lives in the indicator detail. */}
        {o && <span className="telemetry-row__src"> · {sourceName(o)}</span>}
      </span>
    </span>
  );
}

function Row({ def, i }: { def: IndicatorDef; i: number }) {
  const { byCode, latest } = useStore();
  const t = useLang().pick(T);
  const name = useDomainText().indicator(def.code).name;
  const all = byCode(def.code);
  // The most recent record wins: if it has no value, we show "—" + Missing (never 0).
  const last = lastRecord(all);
  const value = last?.value ?? null;
  const previous = value === null ? latest(def.code) : undefined;
  const label = `${name}: ${value === null ? t.noValue : `${formatValue(value, def.code)} ${def.unit}`}. ${t.openDetail}`;
  return (
    <li className="stagger-in" style={stagger(i)}>
      <a className={`telemetry-row ${def.code === "radiation_dose" ? "telemetry-row--rad" : ""}`} href={`#/health/${def.code}`} aria-label={label}>
        <SignalTile code={def.code} className="telemetry-row__icon" />
        <span className="telemetry-row__name">
          <span className="telemetry-row__title">{name}</span>
          <span className="telemetry-row__hint">
            {value === null ? (
              <span className="hint">{previous ? t.previous(`${formatValue(previous.value, def.code)} ${def.unit}`) : t.noValueRecorded}</span>
            ) : (
              <RangeHint value={value} def={def} />
            )}
          </span>
        </span>
        <span className="telemetry-row__value">
          <b>{formatValue(value, def.code)}</b>
          {value !== null && <span className="telemetry-row__unit">{def.unit}</span>}
        </span>
        <span className="telemetry-row__spark">
          <Sparkline points={withinWindow(all, 72, Date.now())} width={112} height={32} color={PILLAR_COLOR[def.pillar]} />
        </span>
        <Meta o={last} />
        <ChevronRight className="telemetry-row__go" size={18} aria-hidden />
      </a>
    </li>
  );
}

function PressureRow({ i }: { i: number }) {
  const { byCode } = useStore();
  const t = useLang().pick(T);
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
    <li className="stagger-in" style={stagger(i)}>
      <a className="telemetry-row" href="#/health/bp_systolic" aria-label={`${t.bp}: ${hasAny ? `${text} mmHg` : t.noValue}. ${t.openDetail}`}>
        <SignalTile code="bp_systolic" className="telemetry-row__icon" />
        <span className="telemetry-row__name">
          <span className="telemetry-row__title">{t.bp}</span>
          <span className="telemetry-row__hint telemetry-row__hint--pair">
            <span className="hint">{t.sys} {sysV === null ? t.noValue : <RangeHint value={sysV} def={sysDef} />}</span>
            <span className="hint">{t.dia} {diaV === null ? t.noValue : <RangeHint value={diaV} def={diaDef} />}</span>
          </span>
        </span>
        <span className="telemetry-row__value">
          <b>{text}</b>
          {hasAny && <span className="telemetry-row__unit">mmHg</span>}
        </span>
        <span className="telemetry-row__spark">
          <Sparkline points={withinWindow(sysAll, 72, Date.now())} width={112} height={32} color="var(--body)" />
        </span>
        <Meta o={sys} />
        <ChevronRight className="telemetry-row__go" size={18} aria-hidden />
      </a>
    </li>
  );
}

function GroupPanel({ group, wide = false, order = 0 }: { group: Group; wide?: boolean; order?: number }) {
  const defs = INDICATORS.filter((d) => d.group === group && d.code !== "bp_diastolic");
  const t = useLang().pick(T);
  const dt = useDomainText();
  return (
    <section className={`panel telemetry telemetry--${group} ${wide ? "telemetry--wide" : "stagger-in"}`} style={wide ? undefined : stagger(order)} aria-labelledby={`record-group-${group}`}>
      <div className="telemetry__title">
        <h2 id={`record-group-${group}`}>
          <span className={`telemetry__icon telemetry__icon--${group}`} aria-hidden>
            <Icon name={GROUP_ICON[group]} size={18} strokeWidth={2.25} />
          </span>
          {dt.group(group)}
        </h2>
        <p className="muted small">{t.groupNote[group]}</p>
      </div>
      {wide && (
        <div className="telemetry-cols small muted" aria-hidden>
          <span />
          <span>{t.colIndicator}</span>
          <span>{t.colLast}</span>
          <span>72 h</span>
          <span>{t.colOrigin}</span>
          <span />
        </div>
      )}
      <ul className="telemetry__list" role="list">
        {defs.map((def, i) => (def.code === "bp_systolic" ? <PressureRow key={def.code} i={i} /> : <Row key={def.code} def={def} i={i} />))}
      </ul>
    </section>
  );
}

const fmtNum = (v: number, d: number) => v.toLocaleString(locale(), { minimumFractionDigits: d, maximumFractionDigits: d });

// Highlight piece: cumulative mission radiation, with a yellow emblem on a dark background (signal identity, not an alert).
// Also used in the daily dose indicator detail.
export function RadiationPanel({ titleId = "record-rad-title", className = "" }: { titleId?: string; className?: string }) {
  const { byCode } = useStore();
  const t = useLang().pick(T);
  const daily = byCode("radiation_dose").filter((o) => o.isSynthetic && o.qualityState === "valid" && o.value !== null);
  const mean = daily.length ? daily.reduce((s, o) => s + (o.value as number), 0) / daily.length : null;
  const total = mean === null ? null : mean * MISSION.day;
  const pct = total === null ? 0 : total / CAREER_LIMIT_MSV;
  return (
    <section className={`panel record-rad ${className}`} aria-labelledby={titleId}>
      <div className="record-rad__head">
        <span className="record-rad__emblem" aria-hidden>
          <Radiation size={40} strokeWidth={2} />
        </span>
        <div className="record-rad__titles">
          <h2 id={titleId}>{t.radTitle}</h2>
          <p className="record-rad__sub small">
            <span className="tag tag--simulated">{t.simulated}</span> {t.radSub(MISSION.day)}
          </p>
        </div>
      </div>
      {total === null || mean === null ? (
        <div className="record-rad__figure">
          <p className="record-rad__value">
            <b className="display">—</b>
          </p>
          <span className="tag tag--missing">{t.notCollected}</span>
        </div>
      ) : (
        <>
          <div className="record-rad__figure">
            <p className="record-rad__value">
              <b className="display num">{fmtNum(total, 1)}</b>
              <span className="record-rad__unit">mSv</span>
            </p>
            <p className="record-rad__pct">
              <b className="num">{fmtNum(pct * 100, 1)}%</b>
              <span className="small">{t.ofCareer(CAREER_LIMIT_MSV)}</span>
            </p>
          </div>
          <div className="record-rad__bar" role="img" aria-label={t.pctLabel(fmtNum(pct * 100, 1), CAREER_LIMIT_MSV)}>
            <div className="record-rad__track">
              <span className="record-rad__fill" style={{ width: `${Math.max(0.01, Math.min(1, pct)) * 100}%` }} />
            </div>
            <div className="record-rad__scale small num" aria-hidden>
              <span>0</span>
              <span>{CAREER_LIMIT_MSV} mSv · NASA-STD-3001</span>
            </div>
          </div>
          <p className="record-rad__note small">
            <span className="record-rad__note-dot" aria-hidden />
            {t.radNote}
          </p>
          <details className="record-details small">
            <summary>{t.howCalc}</summary>
            <p>{t.calc(fmtNum(mean, 2), daily.length, MISSION.day)}</p>
          </details>
        </>
      )}
    </section>
  );
}

export function HealthRecord() {
  const { openSupport } = useShell();
  const t = useLang().pick(T);
  const dt = useDomainText();
  return (
    <div className="page health-record">
      <div className="record-top">
        <header className="record-hero">
          <div className="photo-band record-band">
            <img src={PHOTO.night} alt="" />
            <span className="photo-band__credit">{t.photo}</span>
            <div className="photo-band__body record-band__body">
              <span className="record-avatar" aria-hidden>
                P
              </span>
              <div className="record-band__id">
                <h1>{MISSION.callSign}</h1>
                <MorseRule className="record-band__morse" />
                <p className="record-band__meta num">
                  {t.record} · {MISSION.crewId} · {dt.missionName} · {t.day} {MISSION.day}
                </p>
              </div>
              <button type="button" className="btn btn--primary record-band__support" onClick={openSupport}>
                <LifeBuoy size={18} aria-hidden /> {t.support}
              </button>
            </div>
          </div>
          <p className="record-legend small" aria-label={t.legend}>
            <span>
              <span className="tag tag--simulated">{t.simulated}</span> {t.byDemo}
            </span>
            <span>
              <span className="tag tag--manual">{t.manual}</span> {t.byYou}
            </span>
            <span>
              <span className="tag tag--missing">{t.missing}</span> {t.withoutValue}
            </span>
            <span>
              <span className="tag tag--missing">{t.notCollected}</span> {t.withoutRecord}
            </span>
          </p>
        </header>
        <RadiationPanel />
      </div>

      <GroupPanel group="vitals" wide />

      {/* Mosaic of 3 equal columns: [metabolism | radiation and environment (2 columns)] and [routine | mind | spirit].
          Each panel is as tall as its content; none is left large and empty. */}
      <div className="record-mosaic">
        <GroupPanel group="metabolism" order={2} />
        <GroupPanel group="exposure" order={3} />
        <GroupPanel group="routine" order={4} />
        <GroupPanel group="mind" order={5} />
        <GroupPanel group="spirit" order={6} />
      </div>
    </div>
  );
}
