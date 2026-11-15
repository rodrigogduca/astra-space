import { useState, type CSSProperties } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BatteryFull,
  BatteryLow,
  Check,
  CircleCheck,
  CircleDashed,
  CloudRain,
  Compass,
  Info,
  Leaf,
  LifeBuoy,
  Minus,
  NotebookPen,
  Plus,
  SkipForward,
  Sparkles,
  Sun,
  ThumbsUp,
  Undo2,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useStore } from "../store";
import { useShell } from "../components/Shell";
import { Catro } from "../components/Catro";
import { Icon } from "../components/Icon";
import { INDICATOR_TINT } from "../components/tints";
import { indicator, formatValue } from "../domain/indicators";
import { mission } from "../domain/gamification";
import type { IndicatorCode } from "../domain/types";
import { locale, useLang } from "../i18n/lang";
import { useDomainText } from "../i18n/domainText";
import "./CheckIn.css";

// REQ-5: morning and evening check-in in 2 steps (fill → review → save).
// No free text (5.6). A skipped field becomes null / missing (5.4), never 0.

type Mode = "morning" | "evening";
type Step = "fill" | "review" | "done";
type Feeling = "no" | "log" | "support";
// undefined = not answered yet · null = skipped (missing)
type Answer = number | null | undefined;

const SCALE = Array.from({ length: 11 }, (_, i) => i);

const FEELING_OPTIONS: { id: Feeling; icon: LucideIcon }[] = [
  { id: "no", icon: ThumbsUp },
  { id: "log", icon: NotebookPen },
  { id: "support", icon: LifeBuoy },
];

const T = {
  pt: {
    feeling: {
      no: { label: "Não", help: "Tudo no habitual" },
      log: { label: "Sim, quero registrar", help: "Fica anotado no dia" },
      support: { label: "Quero ver apoio disponível", help: "Abre o canal da missão" },
    } as Record<Feeling, { label: string; help: string }>,
    stepName: (c: 1 | 2): string => (c === 1 ? "Responder" : "Revisar"),
    step: (c: number, name: string) => `Passo ${c} de 2 · ${name}`,
    skipped: "Pulado",
    optional: "Opcional",
    zeroToTen: "De 0 a 10",
    ofTen: " de 10",
    scaleGroup: (short: string) => `${short}, de 0 a 10`,
    scaleBtn: (short: string, n: number) => `${short} ${n} de 10`,
    skippedNote: "Será salvo como ausente, sem valor. Nunca vira zero.",
    undo: "Desfazer",
    skipQ: "Pular esta pergunta",
    sleepQ: "Quantas horas você dormiu?",
    startAt7: "Começar em 7 h",
    lessHalf: "Menos meia hora",
    moreHalf: "Mais meia hora",
    halfSteps: "de meia em meia hora",
    missSleep: "horas de sono",
    missEnergy: "energia",
    missFeeling: "como você se sente",
    missStress: "estresse (responda ou pule)",
    missPurpose: "propósito (responda ou pule)",
    missOne: "pelo menos um dos dois campos",
    titleMorning: "Check-in matinal",
    titleEvening: "Check-in noturno",
    doneMorning: "Bom dia registrado!",
    doneEvening: "Boa noite registrada!",
    xpLabel: (n: number) => `Mais ${n} XP`,
    noXp: "Novo registro guardado. O XP desta missão já tinha sido contado hoje.",
    savedOnline: "Salvo neste aparelho e na fila de envio para a Terra.",
    savedOffline: "Salvo neste aparelho e na fila de envio; sobe sozinho quando o enlace voltar.",
    seeSupport: "Ver apoio disponível",
    back: "Voltar à jornada",
    seeRecord: "Ver no prontuário",
    another: "Fazer outro registro",
    reviewTitle: "Revisar antes de salvar",
    caption: (title: string) => `Resumo do ${title.toLowerCase()}`,
    colField: "Campo",
    colValue: "Valor",
    colSource: "Origem",
    noValue: "sem valor",
    absent: "Ausente",
    manual: "Manual",
    feelingRow: "Diferente do habitual?",
    reviewNote: "Pulado fica ausente, nunca zero. A escala 0 a 10 é da interface, não um limiar de saúde.",
    edit: "Voltar e editar",
    save: "Salvar",
    catroMorning: (
      <>
        Bom dia, Polaris! <b>Três toques rápidos</b> e seu dia começa registrado.
      </>
    ),
    catroEvening: (
      <>
        Fim de expediente em órbita. <b>Como foi o dia</b> por dentro?
      </>
    ),
    already: "Missão já concluída hoje. Um novo check-in entra como mais um registro.",
    energyQ: "Como está sua energia?",
    energyLow: "Sem energia",
    energyHigh: "Cheio de energia",
    moodQ: "E o humor?",
    moodLow: "Para baixo",
    moodHigh: "Ótimo",
    feelingQ: "Você se sente diferente do habitual?",
    supportNote: "Depois de salvar, abrimos o canal de apoio da missão para você.",
    stressQ: "Quanto estresse hoje?",
    stressLow: "Tranquilo",
    stressHigh: "Muito estresse",
    purposeQ: "O dia teve sentido para você?",
    purposeLow: "Pouco sentido",
    purposeHigh: "Muito sentido",
    ready: "Tudo pronto. Confira antes de salvar.",
    missing: (items: string[]) => `Falta: ${items.join(", ")}.`,
    review: "Revisar",
    catro: "Catro, o gato cuidador espacial do Astra",
  },
  en: {
    feeling: {
      no: { label: "No", help: "All as usual" },
      log: { label: "Yes, log it", help: "Noted for today" },
      support: { label: "Show me support options", help: "Opens the mission channel" },
    } as Record<Feeling, { label: string; help: string }>,
    stepName: (c: 1 | 2): string => (c === 1 ? "Answer" : "Review"),
    step: (c: number, name: string) => `Step ${c} of 2 · ${name}`,
    skipped: "Skipped",
    optional: "Optional",
    zeroToTen: "From 0 to 10",
    ofTen: " of 10",
    scaleGroup: (short: string) => `${short}, from 0 to 10`,
    scaleBtn: (short: string, n: number) => `${short} ${n} of 10`,
    skippedNote: "Saved as missing, with no value. Never turns into zero.",
    undo: "Undo",
    skipQ: "Skip this question",
    sleepQ: "How many hours did you sleep?",
    startAt7: "Start at 7 h",
    lessHalf: "Half an hour less",
    moreHalf: "Half an hour more",
    halfSteps: "in half-hour steps",
    missSleep: "hours of sleep",
    missEnergy: "energy",
    missFeeling: "how you feel",
    missStress: "stress (answer or skip)",
    missPurpose: "purpose (answer or skip)",
    missOne: "at least one of the two",
    titleMorning: "Morning check-in",
    titleEvening: "Evening check-in",
    doneMorning: "Morning logged!",
    doneEvening: "Evening logged!",
    xpLabel: (n: number) => `Plus ${n} XP`,
    noXp: "New entry saved. This mission's XP was already counted today.",
    savedOnline: "Saved on this device and in the queue to Earth.",
    savedOffline: "Saved on this device and in the queue; it goes up on its own when the link is back.",
    seeSupport: "See support options",
    back: "Back to journey",
    seeRecord: "See in health record",
    another: "Log another entry",
    reviewTitle: "Review before saving",
    caption: (title: string) => `${title} summary`,
    colField: "Field",
    colValue: "Value",
    colSource: "Source",
    noValue: "no value",
    absent: "Missing",
    manual: "Manual",
    feelingRow: "Different from usual?",
    reviewNote: "Skipped stays missing, never zero. The 0 to 10 scale belongs to the app, not a health threshold.",
    edit: "Go back and edit",
    save: "Save",
    catroMorning: (
      <>
        Good morning, Polaris! <b>Three quick taps</b> and your day is logged.
      </>
    ),
    catroEvening: (
      <>
        Shift's over in orbit. <b>How was your day</b> on the inside?
      </>
    ),
    already: "Mission already done today. A new check-in counts as one more entry.",
    energyQ: "How's your energy?",
    energyLow: "Drained",
    energyHigh: "Full of energy",
    moodQ: "And your mood?",
    moodLow: "Down",
    moodHigh: "Great",
    feelingQ: "Do you feel different from usual?",
    supportNote: "After saving, we'll open the mission support channel for you.",
    stressQ: "How much stress today?",
    stressLow: "Calm",
    stressHigh: "A lot of stress",
    purposeQ: "Did the day feel meaningful?",
    purposeLow: "Not much",
    purposeHigh: "Very meaningful",
    ready: "All set. Check it before saving.",
    missing: (items: string[]) => `Still needed: ${items.join(", ")}.`,
    review: "Review",
    catro: "Catro, Astra's space care cat",
  },
};

// Queue event label, stored in English; the queue screen translates it when the UI is in Portuguese.
const FEELING_LABEL: Record<Feeling, string> = {
  no: "no",
  log: "yes, logged",
  support: "wants to see support",
};

type Ends = { low: string; high: string; lowIcon: LucideIcon; highIcon: LucideIcon };

// Subtle progress below the title (never a label above it): short bar + "Step 1 of 2 · Answer".
function StepIndicator({ current, extra }: { current: 1 | 2; extra?: React.ReactNode }) {
  const t = useLang().pick(T);
  const name = t.stepName(current);
  return (
    <p className="ci-progress small">
      <span className="ci-progress__bar" aria-hidden>
        <span style={{ width: `${current * 50}%` }} />
      </span>
      <span className="num">
        {t.step(current, name)}
      </span>
      {extra}
    </p>
  );
}

function FieldHead({ code, label, right }: { code: IndicatorCode; label: string; right?: React.ReactNode }) {
  // Visible group title; the <fieldset> points to it with aria-labelledby.
  const def = indicator(code);
  return (
    <div className="ci-field__head">
      <span className="icon-tile ci-tile" style={{ "--tint": INDICATOR_TINT[code] } as CSSProperties} aria-hidden>
        <Icon name={def.icon} size={22} strokeWidth={2.25} />
      </span>
      <span className="ci-field__legend" id={`ci-${code}-label`}>
        {label}
      </span>
      {right}
    </div>
  );
}

function ScalePicker({
  code,
  label,
  value,
  onChange,
  optional,
  ends,
}: {
  code: IndicatorCode;
  label: string;
  value: Answer;
  onChange: (v: Answer) => void;
  optional?: boolean;
  ends: Ends;
}) {
  const t = useLang().pick(T);
  const short = useDomainText().indicator(code).short;
  const id = `ci-${code}`;
  const Low = ends.lowIcon;
  const High = ends.highIcon;
  return (
    <fieldset className={`ci-field ${value === null ? "is-skipped" : ""}`} aria-labelledby={`${id}-label`}>
      <FieldHead
        code={code}
        label={label}
        right={
          <span id={`${id}-state`} className="ci-field__value" aria-live="polite">
            {value === null ? (
              <span className="tag tag--missing">{t.skipped}</span>
            ) : value === undefined ? (
              <span className="muted small">{optional ? t.optional : t.zeroToTen}</span>
            ) : (
              <>
                <b className="num">{value}</b>
                <span className="muted small">{t.ofTen}</span>
              </>
            )}
          </span>
        }
      />
      <div className="ci-scale" role="group" aria-label={t.scaleGroup(short)}>
        {SCALE.map((n) => (
          <button
            key={n}
            type="button"
            className={`ci-scale__btn num ${value === n ? "is-on" : ""}`}
            aria-pressed={value === n}
            aria-label={t.scaleBtn(short, n)}
            onClick={() => onChange(n)}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="ci-scale__ends small">
        <span>
          <Low size={16} aria-hidden /> {ends.low}
        </span>
        <span>
          {ends.high} <High size={16} aria-hidden />
        </span>
      </div>
      {optional && (
        <div className="ci-skip">
          {value === null ? (
            <>
              <span className="muted small">{t.skippedNote}</span>
              <button type="button" className="btn btn--sm" aria-pressed onClick={() => onChange(undefined)}>
                <Undo2 size={16} aria-hidden /> {t.undo}
              </button>
            </>
          ) : (
            <button type="button" className="btn btn--sm btn--ghost" aria-pressed={false} onClick={() => onChange(null)}>
              <SkipForward size={16} aria-hidden /> {t.skipQ}
            </button>
          )}
        </div>
      )}
    </fieldset>
  );
}

function SleepStepper({ value, onChange }: { value: Answer; onChange: (v: number) => void }) {
  const t = useLang().pick(T);
  const cur = typeof value === "number" ? value : null;
  const step = (d: number) => {
    const next = cur === null ? 7 : Math.round((cur + d) * 2) / 2;
    onChange(Math.max(0, Math.min(14, next)));
  };
  // Value on the title line (as in the scales); below, − and + flanking a 0 to 14 h bar.
  return (
    <fieldset className="ci-field" aria-labelledby="ci-sleep_duration-label">
      <FieldHead
        code="sleep_duration"
        label={t.sleepQ}
        right={
          cur === null ? (
            <button type="button" className="btn btn--sm" onClick={() => onChange(7)}>
              {t.startAt7}
            </button>
          ) : (
            <output className="ci-field__value" aria-live="polite">
              <b className="num">{formatValue(cur, "sleep_duration")}</b>
              <span className="muted small"> h</span>
            </output>
          )
        }
      />
      <div className="ci-stepper">
        <button type="button" className="ci-stepper__btn" aria-label={t.lessHalf} onClick={() => step(-0.5)} disabled={cur === 0}>
          <Minus size={22} strokeWidth={2.5} aria-hidden />
        </button>
        <span className="ci-stepper__track" aria-hidden>
          <span style={{ width: `${((cur ?? 0) / 14) * 100}%` }} />
        </span>
        <button type="button" className="ci-stepper__btn" aria-label={t.moreHalf} onClick={() => step(0.5)} disabled={cur === 14}>
          <Plus size={22} strokeWidth={2.5} aria-hidden />
        </button>
      </div>
      <div className="ci-scale__ends small">
        <span>0 h</span>
        <span>{t.halfSteps}</span>
        <span>14 h</span>
      </div>
    </fieldset>
  );
}

const nowTime = () => new Date().toLocaleTimeString(locale(), { hour: "2-digit", minute: "2-digit" });

export function CheckIn({ mode }: { mode: Mode }) {
  const { state, dispatch } = useStore();
  const { openSupport } = useShell();
  const t = useLang().pick(T);
  const dt = useDomainText();
  const missionId = mode === "morning" ? "checkin" : "evening";
  const m = mission(missionId);

  const [step, setStep] = useState<Step>("fill");
  const [sleep, setSleep] = useState<Answer>(undefined);
  const [energy, setEnergy] = useState<Answer>(undefined);
  const [mood, setMood] = useState<Answer>(undefined);
  const [feeling, setFeeling] = useState<Feeling | undefined>(undefined);
  const [stress, setStress] = useState<Answer>(undefined);
  const [purpose, setPurpose] = useState<Answer>(undefined);
  const [reviewTime, setReviewTime] = useState(nowTime);
  const [gainedXp, setGainedXp] = useState(0);

  const alreadyDone = !!state.today.done[missionId];

  const values: Partial<Record<IndicatorCode, number | null>> =
    mode === "morning"
      ? { sleep_duration: sleep ?? null, energy_self_report: energy ?? null, mood_self_report: mood ?? null }
      : { stress_self_report: stress ?? null, purpose_self_report: purpose ?? null };

  const missingRequired: string[] = [];
  if (mode === "morning") {
    if (typeof sleep !== "number") missingRequired.push(t.missSleep);
    if (typeof energy !== "number") missingRequired.push(t.missEnergy);
    if (!feeling) missingRequired.push(t.missFeeling);
  } else {
    if (stress === undefined) missingRequired.push(t.missStress);
    if (purpose === undefined) missingRequired.push(t.missPurpose);
    if (stress === null && purpose === null) missingRequired.push(t.missOne);
  }
  const canReview = missingRequired.length === 0;

  const restart = () => {
    setSleep(undefined);
    setEnergy(undefined);
    setMood(undefined);
    setFeeling(undefined);
    setStress(undefined);
    setPurpose(undefined);
    setGainedXp(0);
    setStep("fill");
  };

  const save = () => {
    const label =
      mode === "morning" ? `Morning check-in · different from usual: ${FEELING_LABEL[feeling ?? "no"]}` : "Evening check-in";
    setGainedXp(alreadyDone ? 0 : m.xp);
    dispatch({ type: "checkIn", input: { values, label, missionId } });
    setStep("done");
    if (mode === "morning" && feeling === "support") openSupport();
  };

  const title = mode === "morning" ? t.titleMorning : t.titleEvening;

  if (step === "done") {
    return (
      <div className="page ci">
        <section className="panel ci-panel ci-done" aria-labelledby="ci-done-title">
          <Catro mood="excited" size={190} className="catro--float" title={t.catro} />
          <h1 id="ci-done-title">{mode === "morning" ? t.doneMorning : t.doneEvening}</h1>
          {gainedXp > 0 ? (
            <p className="ci-xp num" aria-label={t.xpLabel(gainedXp)}>
              <Icon name="star" size={24} /> <span className="display">+{gainedXp}</span> XP
            </p>
          ) : (
            <p className="muted">{t.noXp}</p>
          )}
          <p className="muted ci-done__text">
            {state.online ? t.savedOnline : t.savedOffline}
          </p>
          {mode === "morning" && feeling === "support" && (
            <button type="button" className="btn btn--sm" onClick={openSupport}>
              <LifeBuoy size={18} aria-hidden /> {t.seeSupport}
            </button>
          )}
          <div className="ci-actions">
            <a className="btn btn--primary" href="#/">
              {t.back}
            </a>
            <a className="btn" href="#/health">
              {t.seeRecord}
            </a>
          </div>
          <button type="button" className="btn btn--quiet btn--sm" onClick={restart}>
            {t.another}
          </button>
        </section>
      </div>
    );
  }

  if (step === "review") {
    const feelingOpt = FEELING_OPTIONS.find((f) => f.id === feeling);
    return (
      <div className="page ci">
        <section className="panel ci-panel" aria-labelledby="ci-title">
          <header className="ci-head">
            <h1 id="ci-title">{t.reviewTitle}</h1>
            <StepIndicator
              current={2}
              extra={
                <span className="muted">
                  {title} · <span className="num">{reviewTime}</span>
                </span>
              }
            />
          </header>

          <div className="ci-table-wrap">
            <table className="ci-table">
              <caption className="visually-hidden">{t.caption(title)}</caption>
              <thead>
                <tr>
                  <th scope="col">{t.colField}</th>
                  <th scope="col">{t.colValue}</th>
                  <th scope="col">{t.colSource}</th>
                </tr>
              </thead>
              <tbody>
                {(Object.entries(values) as [IndicatorCode, number | null][]).map(([code, v]) => {
                  const def = indicator(code);
                  return (
                    <tr key={code}>
                      <th scope="row">
                        <span className="ci-table__field">
                          <Icon name={def.icon} size={18} className="ci-table__icon" /> {dt.indicator(code).short}
                        </span>
                      </th>
                      <td className="ci-table__val num">
                        {v === null ? (
                          <span className="ci-table__none">{t.noValue}</span>
                        ) : (
                          <>
                            {formatValue(v, code)} <span className="ci-table__unit-inline">{def.unit}</span>
                          </>
                        )}
                      </td>
                      <td>{v === null ? <span className="tag tag--missing">{t.absent}</span> : <span className="tag tag--manual">{t.manual}</span>}</td>
                    </tr>
                  );
                })}
                {mode === "morning" && feelingOpt && (
                  <tr>
                    <th scope="row">
                      <span className="ci-table__field">
                        <Compass size={18} className="ci-table__icon" aria-hidden /> {t.feelingRow}
                      </span>
                    </th>
                    <td className="ci-table__val ci-table__text">{t.feeling[feelingOpt.id].label}</td>
                    <td>
                      <span className="tag tag--manual">{t.manual}</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <p className="ci-note small">
            <Info size={18} aria-hidden />
            <span>{t.reviewNote}</span>
          </p>

          <div className="ci-actions">
            <button type="button" className="btn" onClick={() => setStep("fill")}>
              <ArrowLeft size={18} aria-hidden /> {t.edit}
            </button>
            <button type="button" className="btn btn--primary" onClick={save}>
              <Check size={18} strokeWidth={3} aria-hidden /> {t.save}
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page ci">
      <section className="panel ci-panel" aria-labelledby="ci-title">
        <header className="ci-head">
          <div className="ci-head__title">
            <h1 id="ci-title">{title}</h1>
            <span className="ci-reward num">
              <Sparkles size={16} strokeWidth={2.5} aria-hidden /> +{m.xp} XP
            </span>
          </div>
          <StepIndicator current={1} />
        </header>

        <div className="speech ci-speech">
          <Catro mood="wink" size={112} title={t.catro} />
          <p className="speech__bubble ci-speech__bubble">{mode === "morning" ? t.catroMorning : t.catroEvening}</p>
        </div>

        {alreadyDone && (
          <p className="ci-already small" role="status">
            <CircleCheck size={18} aria-hidden />
            <span>{t.already}</span>
          </p>
        )}

        <div className="ci-fields">
          {mode === "morning" ? (
            <>
              <SleepStepper value={sleep} onChange={setSleep} />
              <ScalePicker
                code="energy_self_report"
                label={t.energyQ}
                value={energy}
                onChange={setEnergy}
                ends={{ low: t.energyLow, high: t.energyHigh, lowIcon: BatteryLow, highIcon: BatteryFull }}
              />
              <ScalePicker
                code="mood_self_report"
                label={t.moodQ}
                value={mood}
                onChange={setMood}
                optional
                ends={{ low: t.moodLow, high: t.moodHigh, lowIcon: CloudRain, highIcon: Sun }}
              />
              <fieldset className="ci-field" aria-labelledby="ci-feeling-label">
                <div className="ci-field__head">
                  <span className="icon-tile icon-tile--mind" aria-hidden>
                    <Compass size={20} />
                  </span>
                  <span className="ci-field__legend" id="ci-feeling-label">
                    {t.feelingQ}
                  </span>
                </div>
                <div className="ci-options">
                  {FEELING_OPTIONS.map((f) => {
                    const I = f.icon;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        className={`ci-option ${feeling === f.id ? "is-on" : ""}`}
                        aria-pressed={feeling === f.id}
                        onClick={() => setFeeling(f.id)}
                      >
                        <I size={20} aria-hidden />
                        <b>{t.feeling[f.id].label}</b>
                        <span className="ci-option__help small">{t.feeling[f.id].help}</span>
                      </button>
                    );
                  })}
                </div>
                {feeling === "support" && <p className="muted small">{t.supportNote}</p>}
              </fieldset>
            </>
          ) : (
            <>
              <ScalePicker
                code="stress_self_report"
                label={t.stressQ}
                value={stress}
                onChange={setStress}
                optional
                ends={{ low: t.stressLow, high: t.stressHigh, lowIcon: Leaf, highIcon: Zap }}
              />
              <ScalePicker
                code="purpose_self_report"
                label={t.purposeQ}
                value={purpose}
                onChange={setPurpose}
                optional
                ends={{ low: t.purposeLow, high: t.purposeHigh, lowIcon: CircleDashed, highIcon: Compass }}
              />
            </>
          )}
        </div>

        <footer className="ci-footer">
          <p className="muted small" aria-live="polite">
            {canReview ? t.ready : t.missing(missingRequired)}
          </p>
          <button
            type="button"
            className="btn btn--primary"
            disabled={!canReview}
            onClick={() => {
              setReviewTime(nowTime());
              setStep("review");
            }}
          >
            {t.review} <ArrowRight size={18} aria-hidden />
          </button>
        </footer>
      </section>
    </div>
  );
}
