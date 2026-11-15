import { useCallback, useMemo, useState } from "react";
import { useStore } from "./store";
import { ShellContext, useRoute } from "./components/Shell";
import { TopBar, BottomNav } from "./components/TopBar";
import { SupportDialog } from "./components/SupportDialog";
import { Celebration } from "./components/Celebration";
import { Starfield } from "./components/Starfield";
import { Credits } from "./components/Credits";
import { Jornada } from "./screens/Jornada";
import { Prontuario } from "./screens/Prontuario";
import { Indicador } from "./screens/Indicador";
import { CheckIn } from "./screens/CheckIn";
import { Respirar } from "./screens/Respirar";
import { Gratidao } from "./screens/Gratidao";
import { Desafios } from "./screens/Desafios";
import { Contexto } from "./screens/Contexto";
import { LinhaDoTempo } from "./screens/LinhaDoTempo";
import { Integracoes } from "./screens/Integracoes";
import { INDICATORS } from "./domain/indicators";
import type { IndicatorCode } from "./domain/types";

function Screen({ parts }: { parts: string[] }) {
  const [first, second] = parts;
  switch (first) {
    case "prontuario":
      return second && INDICATORS.some((i) => i.code === second) ? <Indicador code={second as IndicatorCode} /> : <Prontuario />;
    case "checkin":
      return <CheckIn key="manha" mode="manha" />;
    case "noturno":
      return <CheckIn key="noite" mode="noite" />;
    case "respirar":
      return <Respirar />;
    case "gratidao":
      return <Gratidao />;
    case "desafios":
      return <Desafios />;
    case "contexto":
      return <Contexto />;
    case "linha-do-tempo":
      return <LinhaDoTempo />;
    case "integracoes":
      return <Integracoes />;
    default:
      return <Jornada />;
  }
}

export function App() {
  const parts = useRoute();
  const { storageOk } = useStore();
  const [support, setSupport] = useState(false);
  const active = parts[0] ?? "";
  const closeSupport = useCallback(() => setSupport(false), []);
  const shell = useMemo(() => ({ openSupport: () => setSupport(true) }), []);
  return (
    <ShellContext.Provider value={shell}>
      <div className="app">
        <Starfield />
        {!storageOk && <div className="storage-warning">Armazenamento local indisponível: seus registros não serão guardados ao fechar.</div>}
        <TopBar active={active} />
        <main className="main">
          <Screen parts={parts} />
        </main>
        <Credits />
        <BottomNav active={active} />
        <Celebration />
        {support && <SupportDialog onClose={closeSupport} />}
      </div>
    </ShellContext.Provider>
  );
}
