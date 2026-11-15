import { useState } from "react";
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
  Sun,
  ThumbsUp,
  Undo2,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useStore } from "../store";
import { useShell } from "../components/Shell";
import { Astrido } from "../components/Astrido";
import { Icon } from "../components/Icon";
import { indicator, formatValue } from "../domain/indicators";
import { mission } from "../domain/gamification";
import type { IndicatorCode } from "../domain/types";
import "./CheckIn.css";

// REQ-5: check-in matinal e noturno em 2 passos (preencher → revisar → salvar).
// Sem texto livre (5.6). Campo pulado vira null / ausente (5.4), nunca 0.

type Mode = "manha" | "noite";
type Step = "preencher" | "revisar" | "feito";
type Feeling = "nao" | "registrar" | "apoio";
// undefined = ainda não respondeu · null = pulou (ausente)
type Answer = number | null | undefined;

const SCALE = Array.from({ length: 11 }, (_, i) => i);

const FEELING_OPTIONS: { id: Feeling; label: string; help: string; icon: LucideIcon }[] = [
  { id: "nao", label: "Não", help: "Tudo no habitual", icon: ThumbsUp },
  { id: "registrar", label: "Sim, quero registrar", help: "Fica anotado no dia", icon: NotebookPen },
  { id: "apoio", label: "Quero ver apoio disponível", help: "Abre o canal da missão", icon: LifeBuoy },
];

const FEELING_LABEL: Record<Feeling, string> = {
  nao: "não",
  registrar: "sim, registrado",
  apoio: "quer ver apoio",
};

type Ends = { low: string; high: string; lowIcon: LucideIcon; highIcon: LucideIcon };

// Progresso discreto embaixo do título (nunca rótulo acima dele): barra curta + "Passo 1 de 2 · Responder".
function StepIndicator({ current, extra }: { current: 1 | 2; extra?: React.ReactNode }) {
  const name = current === 1 ? "Responder" : "Revisar";
  return (
    <p className="ci-progress small">
      <span className="ci-progress__bar" aria-hidden>
        <span style={{ width: `${current * 50}%` }} />
      </span>
      <span className="num">
        Passo {current} de 2 · {name}
      </span>
      {extra}
    </p>
  );
}

function FieldHead({ code, label, right }: { code: IndicatorCode; label: string; right?: React.ReactNode }) {
  // Título visível do grupo; o <fieldset> aponta para ele com aria-labelledby.
  const def = indicator(code);
  return (
    <div className="ci-field__head">
      <span className={`icon-tile icon-tile--${def.pillar}`} aria-hidden>
        <Icon name={def.icon} size={20} />
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
  const def = indicator(code);
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
              <span className="tag tag--missing">Pulado</span>
            ) : value === undefined ? (
              <span className="muted small">{optional ? "Opcional" : "De 0 a 10"}</span>
            ) : (
              <>
                <b className="num">{value}</b>
                <span className="muted small"> de 10</span>
              </>
            )}
          </span>
        }
      />
      <div className="ci-scale" role="group" aria-label={`${def.short}, de 0 a 10`}>
        {SCALE.map((n) => (
          <button
            key={n}
            type="button"
            className={`ci-scale__btn num ${value === n ? "is-on" : ""}`}
            aria-pressed={value === n}
            aria-label={`${def.short} ${n} de 10`}
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
              <span className="muted small">Será salvo como ausente, sem valor. Nunca vira zero.</span>
              <button type="button" className="btn btn--sm" aria-pressed onClick={() => onChange(undefined)}>
                <Undo2 size={16} aria-hidden /> Desfazer
              </button>
            </>
          ) : (
            <button type="button" className="btn btn--sm btn--ghost" aria-pressed={false} onClick={() => onChange(null)}>
              <SkipForward size={16} aria-hidden /> Pular esta pergunta
            </button>
          )}
        </div>
      )}
    </fieldset>
  );
}

function SleepStepper({ value, onChange }: { value: Answer; onChange: (v: number) => void }) {
  const cur = typeof value === "number" ? value : null;
  const step = (d: number) => {
    const next = cur === null ? 7 : Math.round((cur + d) * 2) / 2;
    onChange(Math.max(0, Math.min(14, next)));
  };
  // Valor na linha do título (como nas escalas); embaixo, − e + ladeando uma barra de 0 a 14 h.
  return (
    <fieldset className="ci-field" aria-labelledby="ci-sleep_duration-label">
      <FieldHead
        code="sleep_duration"
        label="Quantas horas você dormiu?"
        right={
          cur === null ? (
            <button type="button" className="btn btn--sm" onClick={() => onChange(7)}>
              Começar em 7 h
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
        <button type="button" className="ci-stepper__btn" aria-label="Menos meia hora" onClick={() => step(-0.5)} disabled={cur === 0}>
          <Minus size={22} strokeWidth={2.5} aria-hidden />
        </button>
        <span className="ci-stepper__track" aria-hidden>
          <span style={{ width: `${((cur ?? 0) / 14) * 100}%` }} />
        </span>
        <button type="button" className="ci-stepper__btn" aria-label="Mais meia hora" onClick={() => step(0.5)} disabled={cur === 14}>
          <Plus size={22} strokeWidth={2.5} aria-hidden />
        </button>
      </div>
      <div className="ci-scale__ends small">
        <span>0 h</span>
        <span>de meia em meia hora</span>
        <span>14 h</span>
      </div>
    </fieldset>
  );
}

const nowTime = () => new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

export function CheckIn({ mode }: { mode: Mode }) {
  const { state, dispatch } = useStore();
  const { openSupport } = useShell();
  const missionId = mode === "manha" ? "checkin" : "evening";
  const m = mission(missionId);

  const [step, setStep] = useState<Step>("preencher");
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
    mode === "manha"
      ? { sleep_duration: sleep ?? null, energy_self_report: energy ?? null, mood_self_report: mood ?? null }
      : { stress_self_report: stress ?? null, purpose_self_report: purpose ?? null };

  const missingRequired: string[] = [];
  if (mode === "manha") {
    if (typeof sleep !== "number") missingRequired.push("horas de sono");
    if (typeof energy !== "number") missingRequired.push("energia");
    if (!feeling) missingRequired.push("como você se sente");
  } else {
    if (stress === undefined) missingRequired.push("estresse (responda ou pule)");
    if (purpose === undefined) missingRequired.push("propósito (responda ou pule)");
    if (stress === null && purpose === null) missingRequired.push("pelo menos um dos dois campos");
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
    setStep("preencher");
  };

  const save = () => {
    const label =
      mode === "manha" ? `Check-in matinal · diferente do habitual: ${FEELING_LABEL[feeling ?? "nao"]}` : "Check-in noturno";
    setGainedXp(alreadyDone ? 0 : m.xp);
    dispatch({ type: "checkIn", input: { values, label, missionId } });
    setStep("feito");
    if (mode === "manha" && feeling === "apoio") openSupport();
  };

  const title = mode === "manha" ? "Check-in matinal" : "Check-in noturno";

  if (step === "feito") {
    return (
      <div className="page ci">
        <section className="panel ci-panel ci-done" aria-labelledby="ci-done-title">
          <Astrido mood="excited" size={150} />
          <h1 id="ci-done-title">{mode === "manha" ? "Bom dia registrado!" : "Boa noite registrada!"}</h1>
          {gainedXp > 0 ? (
            <p className="ci-xp num" aria-label={`Mais ${gainedXp} XP`}>
              <Icon name="star" size={24} /> +{gainedXp} XP
            </p>
          ) : (
            <p className="muted">Novo registro guardado. O XP desta missão já tinha sido contado hoje.</p>
          )}
          <p className="muted ci-done__text">
            Salvo neste aparelho e na fila de envio{state.online ? " para a Terra." : "; sobe sozinho quando o enlace voltar."}
          </p>
          {mode === "manha" && feeling === "apoio" && (
            <button type="button" className="btn btn--sm" onClick={openSupport}>
              <LifeBuoy size={18} aria-hidden /> Ver apoio disponível
            </button>
          )}
          <div className="ci-actions">
            <a className="btn btn--primary" href="#/">
              Voltar à jornada
            </a>
            <a className="btn" href="#/prontuario">
              Ver no prontuário
            </a>
          </div>
          <button type="button" className="btn btn--quiet btn--sm" onClick={restart}>
            Fazer outro registro
          </button>
        </section>
      </div>
    );
  }

  if (step === "revisar") {
    const feelingOpt = FEELING_OPTIONS.find((f) => f.id === feeling);
    return (
      <div className="page ci">
        <section className="panel ci-panel" aria-labelledby="ci-title">
          <header className="ci-head">
            <h1 id="ci-title">Revisar antes de salvar</h1>
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
              <caption className="visually-hidden">Resumo do {title.toLowerCase()}</caption>
              <thead>
                <tr>
                  <th scope="col">Campo</th>
                  <th scope="col">Valor</th>
                  <th scope="col">Origem</th>
                </tr>
              </thead>
              <tbody>
                {(Object.entries(values) as [IndicatorCode, number | null][]).map(([code, v]) => {
                  const def = indicator(code);
                  return (
                    <tr key={code}>
                      <th scope="row">
                        <span className="ci-table__field">
                          <Icon name={def.icon} size={18} className="ci-table__icon" /> {def.short}
                        </span>
                      </th>
                      <td className="ci-table__val num">
                        {v === null ? (
                          <span className="ci-table__none">sem valor</span>
                        ) : (
                          <>
                            {formatValue(v, code)} <span className="ci-table__unit-inline">{def.unit}</span>
                          </>
                        )}
                      </td>
                      <td>{v === null ? <span className="tag tag--missing">Ausente</span> : <span className="tag tag--manual">Manual</span>}</td>
                    </tr>
                  );
                })}
                {mode === "manha" && feelingOpt && (
                  <tr>
                    <th scope="row">
                      <span className="ci-table__field">
                        <Compass size={18} className="ci-table__icon" aria-hidden /> Diferente do habitual?
                      </span>
                    </th>
                    <td className="ci-table__val ci-table__text">{feelingOpt.label}</td>
                    <td>
                      <span className="tag tag--manual">Manual</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <p className="ci-note small">
            <Info size={18} aria-hidden />
            <span>Pulado fica ausente, nunca zero. A escala 0 a 10 é da interface, não um limiar de saúde.</span>
          </p>

          <div className="ci-actions">
            <button type="button" className="btn" onClick={() => setStep("preencher")}>
              <ArrowLeft size={18} aria-hidden /> Voltar e editar
            </button>
            <button type="button" className="btn btn--primary" onClick={save}>
              <Check size={18} strokeWidth={3} aria-hidden /> Salvar
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
              <Icon name={m.icon} size={16} /> +{m.xp} XP
            </span>
          </div>
          <StepIndicator current={1} />
        </header>

        <div className="ci-speech">
          <Astrido mood={mode === "manha" ? "happy" : "calm"} size={76} />
          <p className="ci-speech__bubble">
            {mode === "manha"
              ? "Bom dia, Polaris! Três toques rápidos e seu dia começa registrado."
              : "Fim de expediente em órbita. Como foi o dia por dentro?"}
          </p>
        </div>

        {alreadyDone && (
          <p className="ci-already small" role="status">
            <CircleCheck size={18} aria-hidden />
            <span>Missão já concluída hoje. Um novo check-in entra como mais um registro.</span>
          </p>
        )}

        <div className="ci-fields">
          {mode === "manha" ? (
            <>
              <SleepStepper value={sleep} onChange={setSleep} />
              <ScalePicker
                code="energy_self_report"
                label="Como está sua energia?"
                value={energy}
                onChange={setEnergy}
                ends={{ low: "Sem energia", high: "Cheio de energia", lowIcon: BatteryLow, highIcon: BatteryFull }}
              />
              <ScalePicker
                code="mood_self_report"
                label="E o humor?"
                value={mood}
                onChange={setMood}
                optional
                ends={{ low: "Para baixo", high: "Ótimo", lowIcon: CloudRain, highIcon: Sun }}
              />
              <fieldset className="ci-field" aria-labelledby="ci-feeling-label">
                <div className="ci-field__head">
                  <span className="icon-tile icon-tile--mente" aria-hidden>
                    <Compass size={20} />
                  </span>
                  <span className="ci-field__legend" id="ci-feeling-label">
                    Você se sente diferente do habitual?
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
                        <b>{f.label}</b>
                        <span className="ci-option__help small">{f.help}</span>
                      </button>
                    );
                  })}
                </div>
                {feeling === "apoio" && <p className="muted small">Depois de salvar, abrimos o canal de apoio da missão para você.</p>}
              </fieldset>
            </>
          ) : (
            <>
              <ScalePicker
                code="stress_self_report"
                label="Quanto estresse hoje?"
                value={stress}
                onChange={setStress}
                optional
                ends={{ low: "Tranquilo", high: "Muito estresse", lowIcon: Leaf, highIcon: Zap }}
              />
              <ScalePicker
                code="purpose_self_report"
                label="O dia teve sentido para você?"
                value={purpose}
                onChange={setPurpose}
                optional
                ends={{ low: "Pouco sentido", high: "Muito sentido", lowIcon: CircleDashed, highIcon: Compass }}
              />
            </>
          )}
        </div>

        <footer className="ci-footer">
          <p className="muted small" aria-live="polite">
            {canReview ? "Tudo pronto. Confira antes de salvar." : `Falta: ${missingRequired.join(", ")}.`}
          </p>
          <button
            type="button"
            className="btn btn--primary"
            disabled={!canReview}
            onClick={() => {
              setReviewTime(nowTime());
              setStep("revisar");
            }}
          >
            Revisar <ArrowRight size={18} aria-hidden />
          </button>
        </footer>
      </section>
    </div>
  );
}
