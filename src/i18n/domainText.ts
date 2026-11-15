import { useMemo } from "react";
import { useLang } from "./lang";
import type { IndicatorCode, Pillar } from "../domain/types";
import { GROUP_LABEL, PILLAR_LABEL, indicator, type Group } from "../domain/indicators";
import { HAZARD_LABEL, refById, type Hazard } from "../domain/references";
import { connector, KIND_LABEL, type ConnectorKind, type ConnectorStatus } from "../domain/integrations";
import { GRATITUDE_OPTIONS, mission, type MissionId } from "../domain/gamification";
import { MISSION } from "../domain/simulator";
import * as PT from "../domain/pt";

// Domain texts in the current language. In English it returns the catalog itself; in Portuguese, domain/pt.ts.

const STATUS_EN: Record<ConnectorStatus, string> = {
  self_report: "Self-report",
  simulated: "Simulated",
  roadmap: "Roadmap",
  needs_authorization: "Needs authorization",
};

export function useDomainText() {
  const { lang } = useLang();
  return useMemo(() => {
    const pt = lang === "pt";
    return {
      lang,
      indicator(code: IndicatorCode) {
        const d = indicator(code);
        const p = PT.INDICATOR_PT[code];
        return pt
          ? { name: p.name, short: p.short, sensor: p.sensor, scaleNote: p.scaleNote, rangeLabel: p.rangeLabel ?? d.range?.label, rangeSource: p.rangeSource ?? d.range?.source }
          : { name: d.name, short: d.short, sensor: d.sensor, scaleNote: d.scaleNote, rangeLabel: d.range?.label, rangeSource: d.range?.source };
      },
      group: (g: Group) => (pt ? PT.GROUP_PT[g] : GROUP_LABEL[g]),
      pillar: (p: Pillar) => (pt ? PT.PILLAR_PT[p] : PILLAR_LABEL[p]),
      mission(id: MissionId) {
        const m = mission(id);
        return pt ? PT.MISSION_PT[id] : { title: m.title, subtitle: m.subtitle };
      },
      missionName: pt ? PT.MISSION_NAME_PT : MISSION.name,
      level: (name: string) => (pt ? PT.LEVEL_PT[name] ?? name : name),
      badge: (id: string, base: { title: string; description: string }) => (pt ? PT.BADGE_PT[id] ?? base : base),
      challenge: (id: string, base: { title: string; unit: string }) => (pt ? PT.CHALLENGE_PT[id] ?? base : base),
      gratitude: (text: string) => (pt ? PT.GRATITUDE_PT[GRATITUDE_OPTIONS.indexOf(text)] ?? text : text),
      reference(id: string) {
        const r = refById(id)!;
        const p = PT.REFERENCE_PT[id];
        return pt && p
          ? { ...r, section: p.section, claim: p.claim, limitation: p.limitation, pageDate: p.pageDate, kind: PT.REFERENCE_KIND_PT[r.kind] ?? r.kind }
          : { ...r, kind: r.kind as string };
      },
      hazard: (h: Hazard) => (pt ? PT.HAZARD_PT[h] : HAZARD_LABEL[h]),
      connector(id: string) {
        const c = connector(id);
        if (!c) return undefined;
        const p = PT.CONNECTOR_PT[id];
        return pt && p ? { ...c, ...p } : c;
      },
      status: (s: ConnectorStatus) => (pt ? PT.STATUS_PT[s] : STATUS_EN[s]),
      kind: (k: ConnectorKind) => (pt ? PT.KIND_PT[k] : KIND_LABEL[k]),
    };
  }, [lang]);
}
