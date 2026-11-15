import { useEffect, useRef, useState } from "react";
import { useStore } from "../store";
import { MISSIONS, type MissionDef } from "../domain/gamification";
import { Astrido } from "./Astrido";
import { Icon } from "./Icon";

// REQ-3.3: comemoração quando uma missão é concluída.
export function Celebration() {
  const { state, ready } = useStore();
  const prev = useRef(state.today.done);
  const armed = useRef(false);
  const [shown, setShown] = useState<MissionDef | null>(null);

  useEffect(() => {
    // Missões trazidas do IndexedDB no carregamento não geram comemoração.
    if (!ready || !armed.current) {
      prev.current = state.today.done;
      armed.current = ready;
      return;
    }
    const fresh = MISSIONS.find((m) => state.today.done[m.id] && !prev.current[m.id]);
    prev.current = state.today.done;
    if (!fresh) return;
    setShown(fresh);
    const t = setTimeout(() => setShown(null), 2600);
    return () => clearTimeout(t);
  }, [state.today.done, ready]);

  if (!shown) return null;
  return (
    <div className="toast" role="status">
      <Astrido mood="excited" size={56} />
      <div>
        <div>
          <Icon name={shown.icon} size={18} /> {shown.title} concluída
        </div>
        <b>+{shown.xp} XP</b>
      </div>
    </div>
  );
}
