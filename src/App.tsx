import { useCallback, useMemo, useState } from "react";
import { useStore } from "./store";
import { useLang } from "./i18n/lang";
import { ShellContext, useRoute } from "./components/Shell";
import { TopBar, BottomNav } from "./components/TopBar";
import { SupportDialog } from "./components/SupportDialog";
import { Celebration } from "./components/Celebration";
import { Starfield } from "./components/Starfield";
import { Credits } from "./components/Credits";
import { Splash } from "./components/Splash";
import { Journey } from "./screens/Journey";
import { HealthRecord } from "./screens/HealthRecord";
import { Indicator } from "./screens/Indicator";
import { CheckIn } from "./screens/CheckIn";
import { Breathe } from "./screens/Breathe";
import { Gratitude } from "./screens/Gratitude";
import { Challenges } from "./screens/Challenges";
import { Context } from "./screens/Context";
import { Queue } from "./screens/Queue";
import { Integrations } from "./screens/Integrations";
import { INDICATORS } from "./domain/indicators";
import type { IndicatorCode } from "./domain/types";

function Screen({ parts }: { parts: string[] }) {
  const [first, second] = parts;
  switch (first) {
    case "health":
      return second && INDICATORS.some((i) => i.code === second) ? <Indicator code={second as IndicatorCode} /> : <HealthRecord />;
    case "checkin":
      return <CheckIn key="morning" mode="morning" />;
    case "evening":
      return <CheckIn key="evening" mode="evening" />;
    case "breathe":
      return <Breathe />;
    case "gratitude":
      return <Gratitude />;
    case "challenges":
      return <Challenges />;
    case "context":
      return <Context />;
    case "queue":
      return <Queue />;
    case "integrations":
      return <Integrations />;
    default:
      return <Journey />;
  }
}

export function App() {
  const parts = useRoute();
  const { storageOk, ready } = useStore();
  const { lang } = useLang();
  const [support, setSupport] = useState(false);
  const active = parts[0] ?? "";
  const closeSupport = useCallback(() => setSupport(false), []);
  const shell = useMemo(() => ({ openSupport: () => setSupport(true) }), []);
  return (
    <ShellContext.Provider value={shell}>
      <div className="app">
        <Starfield />
        {!storageOk && (
          <div className="storage-warning">
            {lang === "en" ? "Local storage unavailable: your records will not be kept after closing." : "Armazenamento local indisponível: seus registros não serão guardados ao fechar."}
          </div>
        )}
        <TopBar active={active} />
        <main className="main">
          <Screen parts={parts} />
        </main>
        <Credits />
        <BottomNav active={active} />
        <Celebration />
        <Splash ready={ready} />
        {support && <SupportDialog onClose={closeSupport} />}
      </div>
    </ShellContext.Provider>
  );
}
