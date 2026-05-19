export type ChapterTwoFieldStinger =
  | "archive_clue_record"
  | "archive_fragment_place"
  | "archive_misfile"
  | "archive_repair"
  | "letter_time_anchor"
  | "letter_route_connect"
  | "letter_wrong_track"
  | "letter_repair"
  | "valley_memory_step"
  | "valley_block_chisel"
  | "valley_trial_fail"
  | "valley_trial_stable"
  | "valley_repair"
  | "paper_route_reveal"
  | "paper_relic_claim"
  | "paper_residue_hit"
  | "paper_residue_miss"
  | "paper_shield_absorb"
  | "paper_sword_break"
  | "paper_scan_mark"
  | "paper_scan_fail"
  | "paper_repair"
  | "fake_signal_mimic"
  | "fake_route_shift"
  | "hengdeng_extinguish"
  | "blackbox_counter"
  | "blackbox_crew_return"
  | "blackbox_crew_shield"
  | "blackbox_hengdeng_override"
  | "longfire_choice"
  | "longfire_ignite";

export function emitChapterTwoFieldCue(cue: ChapterTwoFieldStinger, vibration: number | number[] = 24) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent("chapter-two-field-cue", { detail: { cue } }));
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(vibration);
  }
}
