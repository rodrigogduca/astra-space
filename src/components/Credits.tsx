import { Camera, ExternalLink, FlaskConical, HardDrive, ShieldCheck } from "lucide-react";
import credits from "../assets/photo-credits.json";
import { AstraSymbol, AstraWordmark } from "./Logo";
import { NAV } from "./TopBar";
import { Icon } from "./Icon";
import { useLang } from "../i18n/lang";

const T = {
  pt: {
    tagline: "Prontuário gamificado para a saúde do tripulante. NASA Space Apps 2026.",
    shortcuts: "Atalhos",
    demo: "Modo demo.",
    demoText: "Dados de saúde simulados.",
    notDevice: "Não é dispositivo médico nem faz diagnóstico.",
    local: "Tudo fica salvo neste aparelho primeiro.",
    credits: "Créditos das fotos e da marca",
    source: "fonte",
    brand: "Identidade visual, logotipo e mascote Catro: IDVS por Carlos, equipe Astra.",
  },
  en: {
    tagline: "A gamified health record for crew wellbeing. NASA Space Apps 2026.",
    shortcuts: "Shortcuts",
    demo: "Demo mode.",
    demoText: "Health data is simulated.",
    notDevice: "Not a medical device and makes no diagnosis.",
    local: "Everything is saved on this device first.",
    credits: "Photo and brand credits",
    source: "source",
    brand: "Visual identity, logo and Catro mascot: IDVS by Carlos, Astra team.",
  },
};

// Brand footer: logo, icon shortcuts, the demo notices and the photo credits (RV-5).
// All photos are from NASA, public domain, via Wikimedia Commons: the world around the mission.

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
  const { lang, pick } = useLang();
  const t = pick(T);
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__brand">
          <div className="row">
            <AstraSymbol size={34} />
            <AstraWordmark height={40} />
          </div>
          <p className="muted">{t.tagline}</p>
        </div>

        <nav className="footer__nav" aria-label={t.shortcuts}>
          {NAV.map((n) => (
            <a key={n.key} href={n.to}>
              <Icon name={n.icon} size={18} />
              {n[lang].label}
            </a>
          ))}
        </nav>

        <ul className="footer__facts">
          <li>
            <FlaskConical size={18} aria-hidden />
            <span>
              <b>{t.demo}</b> {t.demoText}
            </span>
          </li>
          <li>
            <ShieldCheck size={18} aria-hidden />
            <span>{t.notDevice}</span>
          </li>
          <li>
            <HardDrive size={18} aria-hidden />
            <span>{t.local}</span>
          </li>
        </ul>
      </div>

      <details className="footer__credits">
        <summary>
          <Camera size={16} aria-hidden /> {t.credits}
        </summary>
        <ul>
          {list.map((c, i) => (
            <li key={i}>
              {c.credit ?? c.title}
              {c.page && (
                <>
                  {" "}
                  <a href={c.page} target="_blank" rel="noopener noreferrer">
                    {t.source} <ExternalLink size={12} aria-hidden />
                  </a>
                </>
              )}
            </li>
          ))}
          <li>{t.brand}</li>
        </ul>
      </details>
    </footer>
  );
}
