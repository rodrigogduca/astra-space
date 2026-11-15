// Data contract from the specification (section 13), extended for the health record signals.

export type DataOrigin = "manual" | "synthetic" | "authorized_external";
export type QualityState = "valid" | "missing" | "invalid" | "unverified";
export type SyncState = "local_only" | "pending" | "ready" | "synced" | "failed";

export type Pillar = "body" | "mind" | "spirit";

export type IndicatorCode =
  | "heart_rate"
  | "hrv"
  | "bp_systolic"
  | "bp_diastolic"
  | "spo2"
  | "resp_rate"
  | "body_temp"
  | "glucose"
  | "radiation_dose"
  | "cabin_co2"
  | "sleep_duration"
  | "hydration"
  | "exercise"
  | "energy_self_report"
  | "mood_self_report"
  | "stress_self_report"
  | "purpose_self_report"
  | "earth_contact"
  | "contemplation";

export interface Observation {
  observationId: string;
  profileId: string; // demo id; not a real identity
  indicatorCode: IndicatorCode;
  value: number | null; // null = missing; never becomes 0
  unit: string | null;
  observedAt: string; // ISO-8601
  origin: DataOrigin;
  sourceRef?: string;
  qualityState: QualityState;
  syncState: SyncState;
  isSynthetic: boolean;
}

export type SyncEventType = "check_in" | "mission_done" | "support_request";

export interface SyncEvent {
  eventId: string;
  idempotencyKey: string;
  type: SyncEventType;
  label: string; // stored label (history); the UI builds the label in the current language from type + missionId
  missionId?: string;
  createdAt: string;
  state: SyncState;
  attempts: number;
}
