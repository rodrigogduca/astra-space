import { useEffect, useRef, useState } from "react";
import { useStore } from "../store";
import { useLang } from "../i18n/lang";
import { MISSION_PT } from "../domain/pt";
import { MISSIONS, type MissionDef } from "../domain/gamification";
import { Catro } from "./Catro";
import { Icon } from "./Icon";

// REQ-3.3: celebration when a mission is completed.
export function Celebration() {
  const { state, ready } = useStore();
  const { lang } = useLang();
  const prev = useRef(state.today.done);
  const armed = useRef(false);
  const [shown, setShown] = useState<MissionDef | null>(null);

  useEffect(() => {
    // Missions restored from IndexedDB on load do not trigger a celebration.
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
  const en = lang === "en";
  return (
    <div className="toast" role="status">
      <Catro mood="excited" size={56} />
      <div>
        <div>
          <Icon name={shown.icon} size={18} /> {en ? `${shown.title} done` : `${MISSION_PT[shown.id].title} concluída`}
        </div>
        <b>+{shown.xp} XP</b>
      </div>
    </div>
  );
}
