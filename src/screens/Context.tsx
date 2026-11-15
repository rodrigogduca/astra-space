import { useState } from "react";
import type { CSSProperties } from "react";
import { ArrowLeft, BookOpenText, Compass, ExternalLink, House, TriangleAlert, type LucideIcon } from "lucide-react";
import { KindTag } from "../components/ui";
import { Icon } from "../components/Icon";
import { PHOTO } from "../components/Credits";
import { REFERENCES, HAZARD_LABEL, CHALLENGE_URL, type Hazard } from "../domain/references";
import { useLang } from "../i18n/lang";
import { useDomainText } from "../i18n/domainText";
import "./Context.css";

// REQ-7: NASA/CSA sources as citable context. They never fill a health field nor become a threshold.

const HAZARDS = Object.keys(HAZARD_LABEL) as Hazard[];

const T = {
  pt: {
    photoAlt: "A Cúpula da Estação Espacial Internacional com as janelas abertas para a Terra",
    photo: "Foto: NASA",
    title: "Contexto NASA/CSA",
    lead: "O que as agências dizem sobre os desafios do voo espacial humano.",
    notice: "Contexto, não causalidade.",
    noticeText: "Não identificam causa, não são dataset integrado e não medem você.",
    sources: "Fontes",
    count: (n: number) => `${n} ${n === 1 ? "fonte" : "fontes"}`,
    about: (h: string) => ` sobre ${h.toLowerCase()}`,
    filter: "Filtrar por hazard",
    all: "Todos",
    hazards: "Hazards relacionados",
    openSource: "Abrir fonte",
    newTab: "(abre em nova aba)",
    limit: "Limitação e seção",
    section: (x: string) => `Seção: ${x}`,
    back: "Voltar ao prontuário",
    project: "Projeto do NASA Space Apps Challenge 2026 ·",
    challenge: "ver o desafio Health Monitoring Software",
  },
  en: {
    photoAlt: "The Cupola of the International Space Station with its windows open to Earth",
    photo: "Photo: NASA",
    title: "NASA/CSA context",
    lead: "What the agencies say about the challenges of human spaceflight.",
    notice: "Context, not causation.",
    noticeText: "These sources do not identify causes, are not an integrated dataset and do not measure you.",
    sources: "Sources",
    count: (n: number) => `${n} ${n === 1 ? "source" : "sources"}`,
    about: (h: string) => ` on ${h.toLowerCase()}`,
    filter: "Filter by hazard",
    all: "All",
    hazards: "Related hazards",
    openSource: "Open source",
    newTab: "(opens in a new tab)",
    limit: "Limitation and section",
    section: (x: string) => `Section: ${x}`,
    back: "Back to health record",
    project: "A NASA Space Apps Challenge 2026 project ·",
    challenge: "see the Health Monitoring Software challenge",
  },
};

// Identity color of each hazard (icon only).
const HAZARD_TINT: Record<Hazard, string> = {
  radiation: "#FACC15",
  isolation: "#C084FC",
  distance: "#38BDF8",
  gravity: "#FB923C",
  environment: "#34D399",
};
const hz = (h: Hazard) => ({ "--tint": HAZARD_TINT[h] }) as CSSProperties;

function HazardIcon({ h, size = 16 }: { h: Hazard; size?: number }) {
  if (h === "isolation") {
    const I: LucideIcon = House;
    return <I size={size} aria-hidden className="icon" />;
  }
  const name = ({ radiation: "radiation", distance: "earth", gravity: "orbit", environment: "thermometer" } as const)[h];
  return <Icon name={name} size={size} />;
}

export function Context() {
  const [filter, setFilter] = useState<Hazard | "all">("all");
  const t = useLang().pick(T);
  const dt = useDomainText();
  const list = filter === "all" ? REFERENCES : REFERENCES.filter((r) => r.hazards.includes(filter));

  return (
    <div className="page ctx">
      <section className="photo-band ctx-band" aria-labelledby="ctx-title">
        <img src={PHOTO.cupola} alt={t.photoAlt} />
        <span className="photo-band__credit">{t.photo}</span>
        <div className="photo-band__body ctx-band__body">
          <h1 id="ctx-title">{t.title}</h1>
          <p className="ctx-band__lead">{t.lead}</p>
          <p className="ctx-notice" role="note">
            <Compass size={20} aria-hidden />
            <span>
              <b>{t.notice}</b> {t.noticeText}
            </span>
          </p>
        </div>
      </section>

      <section className="panel ctx-panel" aria-labelledby="ctx-sources">
        <div className="panel__head">
          <div>
            <h2 id="ctx-sources" className="ctx-h2">
              <span className="ctx-h2__icon" aria-hidden>
                <BookOpenText size={18} strokeWidth={2.5} />
              </span>
              {t.sources}
            </h2>
            <p aria-live="polite">
              {t.count(list.length)}
              {filter !== "all" && t.about(dt.hazard(filter))}
            </p>
          </div>
        </div>

        <div className="ctx-filters" role="group" aria-label={t.filter}>
          <button type="button" className={`chip ${filter === "all" ? "chip--on" : ""}`} aria-pressed={filter === "all"} onClick={() => setFilter("all")}>
            {t.all}
          </button>
          {HAZARDS.map((h) => (
            <button key={h} type="button" className={`chip ctx-chip ${filter === h ? "chip--on" : ""}`} style={hz(h)} aria-pressed={filter === h} onClick={() => setFilter(h)}>
              <span className="ctx-hz" aria-hidden>
                <HazardIcon h={h} size={14} />
              </span>{" "}
              {dt.hazard(h)}
            </button>
          ))}
        </div>

        <ol className="ctx-list">
          {list.map((r0, i) => {
            const r = dt.reference(r0.id);
            return (
            <li key={`${filter}-${r.id}`} className="stagger-in" style={{ "--i": i } as CSSProperties}>
              <article className="ctx-item" aria-labelledby={`ref-${r.id}`}>
                <div className="ctx-item__meta">
                  <span className={`ctx-inst ctx-inst--${r.institution.toLowerCase()}`}>{r.institution}</span>
                  <span className="ctx-meta-line small">
                    {r.pageDate} · {r.kind}
                  </span>
                  <KindTag kind="fact" />
                </div>

                <div className="ctx-item__body">
                  <h3 id={`ref-${r.id}`} className="ctx-item__title">
                    {r.title}
                  </h3>
                  <p className="ctx-claim">{r.claim}</p>
                  <ul className="ctx-hazards" aria-label={t.hazards}>
                    {r.hazards.map((h) => (
                      <li key={h} className={filter === h ? "is-on" : ""} style={hz(h)}>
                        <span className="ctx-hz" aria-hidden>
                          <HazardIcon h={h} size={13} />
                        </span>{" "}
                        {dt.hazard(h)}
                      </li>
                    ))}
                  </ul>
                  <div className="ctx-item__foot">
                    <a className="btn btn--sm ctx-open" href={r.url} target="_blank" rel="noopener noreferrer">
                      {t.openSource} <ExternalLink size={16} aria-hidden />
                      <span className="visually-hidden">{t.newTab}</span>
                    </a>
                    <details className="ctx-limit small">
                      <summary>
                        <TriangleAlert size={16} aria-hidden /> {t.limit}
                      </summary>
                      <p>{r.limitation}</p>
                      <p className="muted">{t.section(r.section)}</p>
                    </details>
                  </div>
                </div>
              </article>
            </li>
            );
          })}
        </ol>
      </section>

      <footer className="ctx-footer small">
        <a className="btn btn--sm btn--ghost" href="#/health">
          <ArrowLeft size={16} aria-hidden /> {t.back}
        </a>
        <span className="muted">
          {t.project}{" "}
          <a href={CHALLENGE_URL} target="_blank" rel="noopener noreferrer">
            {t.challenge}
          </a>
        </span>
      </footer>
    </div>
  );
}
