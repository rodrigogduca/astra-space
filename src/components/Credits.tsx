import credits from "../assets-credits.json";

// Créditos das fotos reais (RV-5). Todas da NASA, domínio público, via Wikimedia Commons.
// Nenhuma foto mostra dado do tripulante: são o mundo em volta da missão.

type Credit = { file: string; title: string; creator?: string; license?: string; page?: string; credit?: string };

export const PHOTO = {
  limb: "/img/iss-56-earth-s-limb-during-an.jpg",
  cupolaEarth: "/img/iss-43-earth-view-from-the-cupola.jpg",
  night: "/img/iss-46-northern-india-at-night.jpg",
  iss: "/img/sts-135-final-flyaround-of-iss-1.jpg",
  cupola: "/img/cupola-iss-open-shutters.jpg",
  aurora: "/img/aurora-australis-from-iss.jpg",
} as const;

export function Credits() {
  const list = (Array.isArray(credits) ? credits : Object.values(credits)) as Credit[];
  return (
    <footer className="credits">
      <details>
        <summary>Créditos das fotos</summary>
        <ul>
          {list.map((c, i) => (
            <li key={i}>
              {c.credit ?? c.title}
              {c.page && (
                <>
                  {" "}
                  <a href={c.page} target="_blank" rel="noopener noreferrer">
                    fonte
                  </a>
                </>
              )}
            </li>
          ))}
        </ul>
      </details>
      <p style={{ marginTop: 8 }}><b>Modo demo.</b> Astra é uma demonstração para o NASA Space Apps 2026. Não é dispositivo médico; os dados de saúde são simulados.</p>
    </footer>
  );
}
