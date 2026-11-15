import type { IndicatorCode } from "../domain/types";

// Identity color of each signal (only for the ICON, never for the value): helps recognize
// the signal at a glance, like the familiar icons from before. It is not a risk traffic light.
export const INDICATOR_TINT: Record<IndicatorCode, string> = {
  heart_rate: "#FF4D7E",
  hrv: "#FF7AB0",
  bp_systolic: "#FF6B5C",
  bp_diastolic: "#FF6B5C",
  spo2: "#38BDF8",
  resp_rate: "#22D3EE",
  body_temp: "#FB923C",
  glucose: "#F472B6",
  radiation_dose: "#FACC15",
  cabin_co2: "#34D399",
  sleep_duration: "#818CF8",
  hydration: "#38BDF8",
  exercise: "#FB923C",
  energy_self_report: "#FACC15",
  mood_self_report: "#F472B6",
  stress_self_report: "#A78BFA",
  purpose_self_report: "#C084FC",
  earth_contact: "#34D399",
  contemplation: "#2DD4BF",
};
