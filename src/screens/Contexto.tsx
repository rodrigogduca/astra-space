import { useState } from "react";
import { ArrowLeft, Compass, ExternalLink, House, TriangleAlert, type LucideIcon } from "lucide-react";
import { KindTag } from "../components/ui";
import { Icon } from "../components/Icon";
import { PHOTO } from "../components/Credits";
import { REFERENCES, HAZARD_LABEL, CHALLENGE_URL, type Hazard } from "../domain/references";
import "./Contexto.css";

// REQ-7: fontes NASA/CSA como contexto citável. Nunca preenchem campo de saúde nem viram limiar.

const HAZARDS = Object.keys(HAZARD_LABEL) as Hazard[];

function HazardIcon({ h, size = 16 }: { h: Hazard; size?: number }) {
  if (h === "isolamento") {
    const I: LucideIcon = House;
    return <I size={size} aria-hidden className="icon" />;
  }
  const name = ({ radiacao: "radiation", distancia: "earth", gravidade: "orbit", ambiente: "thermometer" } as const)[h];
  return <Icon name={name} size={size} />;
}

export function Contexto() {
  const [filter, setFilter] = useState<Hazard | "todos">("todos");
  const list = filter === "todos" ? REFERENCES : REFERENCES.filter((r) => r.hazards.includes(filter));

  return (
    <div className="page ctx">
      <section className="photo-band ctx-band" aria-labelledby="ctx-title">
        <img src={PHOTO.cupola} alt="A Cúpula da Estação Espacial Internacional com as janelas abertas para a Terra" />
        <span className="photo-band__credit">Foto: NASA</span>
        <div className="photo-band__body ctx-band__body">
          <h1 id="ctx-title">Contexto NASA/CSA</h1>
          <p className="ctx-band__lead">O que as agências dizem sobre os desafios do voo espacial humano.</p>
          <p className="ctx-notice" role="note">
            <Compass size={20} aria-hidden />
            <span>
              <b>Contexto, não causalidade.</b> Não identificam causa, não são dataset integrado e não medem você.
            </span>
          </p>
        </div>
      </section>

      <section className="panel ctx-panel" aria-labelledby="ctx-sources">
        <div className="panel__head">
          <div>
            <h2 id="ctx-sources">Fontes</h2>
            <p aria-live="polite">
              {list.length} {list.length === 1 ? "fonte" : "fontes"}
              {filter !== "todos" && ` sobre ${HAZARD_LABEL[filter].toLowerCase()}`}
            </p>
          </div>
        </div>

        <div className="ctx-filters" role="group" aria-label="Filtrar por hazard">
          <button type="button" className={`chip ${filter === "todos" ? "chip--on" : ""}`} aria-pressed={filter === "todos"} onClick={() => setFilter("todos")}>
            Todos
          </button>
          {HAZARDS.map((h) => (
            <button key={h} type="button" className={`chip ${filter === h ? "chip--on" : ""}`} aria-pressed={filter === h} onClick={() => setFilter(h)}>
              <HazardIcon h={h} /> {HAZARD_LABEL[h]}
            </button>
          ))}
        </div>

        <ol className="ctx-list">
          {list.map((r) => (
            <li key={r.id}>
              <article className="ctx-item" aria-labelledby={`ref-${r.id}`}>
                <div className="ctx-item__meta">
                  <span className={`ctx-inst ctx-inst--${r.institution.toLowerCase()}`}>{r.institution}</span>
                  <span className="ctx-meta-line small">
                    {r.pageDate} · {r.kind}
                  </span>
                  <KindTag kind="fato" />
                </div>

                <div className="ctx-item__body">
                  <h3 id={`ref-${r.id}`} className="ctx-item__title">
                    {r.title}
                  </h3>
                  <p className="ctx-claim">{r.claim}</p>
                  <ul className="ctx-hazards" aria-label="Hazards relacionados">
                    {r.hazards.map((h) => (
                      <li key={h} className={filter === h ? "is-on" : ""}>
                        <HazardIcon h={h} size={14} /> {HAZARD_LABEL[h]}
                      </li>
                    ))}
                  </ul>
                  <div className="ctx-item__foot">
                    <a className="btn btn--sm ctx-open" href={r.url} target="_blank" rel="noopener noreferrer">
                      Abrir fonte <ExternalLink size={16} aria-hidden />
                      <span className="visually-hidden">(abre em nova aba)</span>
                    </a>
                    <details className="ctx-limit small">
                      <summary>
                        <TriangleAlert size={16} aria-hidden /> Limitação e seção
                      </summary>
                      <p>{r.limitation}</p>
                      <p className="muted">Seção: {r.section}</p>
                    </details>
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ol>
      </section>

      <footer className="ctx-footer small">
        <a className="btn btn--sm btn--ghost" href="#/prontuario">
          <ArrowLeft size={16} aria-hidden /> Voltar ao prontuário
        </a>
        <span className="muted">
          Projeto do NASA Space Apps Challenge 2026 ·{" "}
          <a href={CHALLENGE_URL} target="_blank" rel="noopener noreferrer">
            ver o desafio Health Monitoring Software
          </a>
        </span>
      </footer>
    </div>
  );
}
