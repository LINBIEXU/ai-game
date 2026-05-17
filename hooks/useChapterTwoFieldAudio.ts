"use client";

import type { PointerEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { ChapterTwoSceneState } from "@/types/game";

export type ChapterTwoFieldAudioStage =
  | "field_silence"
  | "signal_impact"
  | "crash_site"
  | "field_wake"
  | "surface_scan"
  | "landmark_repair"
  | "fake_signal"
  | "blackbox_pressure"
  | "longfire_restore";

interface ChapterTwoAudioGraph {
  context: AudioContext;
  master: GainNode;
  ambientGain: GainNode;
  hum: OscillatorNode;
  dust: OscillatorNode;
}

interface UseChapterTwoFieldAudioOptions {
  active: boolean;
  sceneState: ChapterTwoSceneState;
  soundEnabled: boolean;
  disorderLevel: number;
  exploredCount: number;
  blackBoxUnlocked: boolean;
}

const fieldCueLabels: Record<ChapterTwoFieldAudioStage, string> = {
  field_silence: "风还没有穿过纸页",
  signal_impact: "天空把字句摔碎",
  crash_site: "金属冷却后的喘息",
  field_wake: "衡灯在废墟里醒来",
  surface_scan: "残页沿地表翻动",
  landmark_repair: "碎片正回到光路",
  fake_signal: "熟悉的声音开始失真",
  blackbox_pressure: "黑匣压低整片地表",
  longfire_restore: "长明火穿过城市遗骨"
};

function clampFrequency(frequency: number) {
  return Math.max(28, Math.min(1600, frequency));
}

function getFieldStage(sceneState: ChapterTwoSceneState, blackBoxUnlocked: boolean): ChapterTwoFieldAudioStage {
  if (sceneState === "signal_attack") return "signal_impact";
  if (sceneState === "crash_site") return "crash_site";
  if (sceneState === "hengdeng_dialogue" || sceneState === "tower_approach" || sceneState === "orbit_reveal") {
    return "field_wake";
  }
  if (sceneState === "planet_surface") return blackBoxUnlocked ? "landmark_repair" : "surface_scan";
  if (sceneState === "location_focus") return "landmark_repair";
  if (sceneState === "fake_crew_signal") return "fake_signal";
  if (sceneState === "blackbox_unlock" || sceneState === "memory_archive" || sceneState === "boss_trial") {
    return "blackbox_pressure";
  }
  if (sceneState === "chapter_reward") return "longfire_restore";

  return "field_silence";
}

export function useChapterTwoFieldAudio({
  active,
  sceneState,
  soundEnabled,
  disorderLevel,
  exploredCount,
  blackBoxUnlocked
}: UseChapterTwoFieldAudioOptions) {
  const audioRef = useRef<ChapterTwoAudioGraph | null>(null);
  const lastStageRef = useRef<ChapterTwoFieldAudioStage | null>(null);
  const lastDisorderRef = useRef(disorderLevel);
  const lastExploredCountRef = useRef(exploredCount);
  const hasPrimedAudioRef = useRef(false);
  const [audioReady, setAudioReady] = useState(false);

  const stage = useMemo(() => getFieldStage(sceneState, blackBoxUnlocked), [blackBoxUnlocked, sceneState]);

  const createGraph = useCallback(() => {
    if (audioRef.current || typeof window === "undefined") {
      return audioRef.current;
    }

    const AudioContextClass =
      window.AudioContext || (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) {
      return null;
    }

    const context = new AudioContextClass();
    const master = context.createGain();
    const ambientGain = context.createGain();
    const hum = context.createOscillator();
    const dust = context.createOscillator();

    master.gain.value = soundEnabled && active ? 0.3 : 0;
    ambientGain.gain.value = 0.05;
    hum.type = "sine";
    hum.frequency.value = 41;
    dust.type = "triangle";
    dust.frequency.value = 89;
    hum.connect(ambientGain);
    dust.connect(ambientGain);
    ambientGain.connect(master);
    master.connect(context.destination);
    hum.start();
    dust.start();

    audioRef.current = { context, master, ambientGain, hum, dust };
    setAudioReady(true);

    return audioRef.current;
  }, [active, soundEnabled]);

  const playTone = useCallback((frequency: number, duration = 0.16, volume = 0.1, type: OscillatorType = "sine", delay = 0) => {
    const graph = audioRef.current;
    if (!graph || !soundEnabled || !active) return;

    const now = graph.context.currentTime + delay;
    const oscillator = graph.context.createOscillator();
    const gain = graph.context.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(clampFrequency(frequency), now);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    oscillator.connect(gain);
    gain.connect(graph.master);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.04);
  }, [active, soundEnabled]);

  const playNoise = useCallback((duration = 0.16, volume = 0.07, delay = 0) => {
    const graph = audioRef.current;
    if (!graph || !soundEnabled || !active) return;

    const now = graph.context.currentTime + delay;
    const frameCount = Math.max(1, Math.floor(graph.context.sampleRate * duration));
    const buffer = graph.context.createBuffer(1, frameCount, graph.context.sampleRate);
    const data = buffer.getChannelData(0);

    for (let index = 0; index < frameCount; index += 1) {
      const fade = 1 - index / frameCount;
      data[index] = (Math.random() * 2 - 1) * fade * fade;
    }

    const source = graph.context.createBufferSource();
    const gain = graph.context.createGain();
    const filter = graph.context.createBiquadFilter();
    source.buffer = buffer;
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(620, now);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(graph.master);
    source.start(now);
    source.stop(now + duration + 0.02);
  }, [active, soundEnabled]);

  const updateAmbient = useCallback(
    (nextStage: ChapterTwoFieldAudioStage) => {
      const graph = audioRef.current;
      if (!graph) return;

      const now = graph.context.currentTime;
      const targetMaster = soundEnabled && active ? 0.3 : 0;
      const stageGain =
        nextStage === "blackbox_pressure"
          ? 0.075
          : nextStage === "signal_impact" || nextStage === "fake_signal"
            ? 0.064
            : nextStage === "longfire_restore"
              ? 0.052
              : 0.046;
      const humFrequency =
        nextStage === "blackbox_pressure" ? 36 : nextStage === "signal_impact" ? 52 : nextStage === "longfire_restore" ? 57 : 43;
      const dustFrequency =
        nextStage === "fake_signal" ? 118 : nextStage === "surface_scan" ? 96 : nextStage === "landmark_repair" ? 128 : 84;

      graph.master.gain.cancelScheduledValues(now);
      graph.master.gain.linearRampToValueAtTime(targetMaster, now + 0.18);
      graph.ambientGain.gain.cancelScheduledValues(now);
      graph.ambientGain.gain.linearRampToValueAtTime(soundEnabled && active ? stageGain : 0, now + 0.32);
      graph.hum.frequency.linearRampToValueAtTime(humFrequency, now + 0.45);
      graph.dust.frequency.linearRampToValueAtTime(dustFrequency, now + 0.45);
    },
    [active, soundEnabled]
  );

  const playSceneCue = useCallback(
    (nextStage: ChapterTwoFieldAudioStage) => {
      if (!active || !soundEnabled) return;

      if (nextStage === "signal_impact") {
        playNoise(0.42, 0.15);
        playTone(88, 0.32, 0.12, "sawtooth", 0.05);
        playTone(54, 0.48, 0.1, "sine", 0.24);
        return;
      }

      if (nextStage === "crash_site") {
        playTone(64, 0.28, 0.1, "sine");
        playNoise(0.2, 0.055, 0.08);
        playTone(196, 0.18, 0.07, "triangle", 0.34);
        return;
      }

      if (nextStage === "field_wake") {
        playTone(196, 0.12, 0.085, "triangle");
        playTone(294, 0.2, 0.075, "sine", 0.11);
        return;
      }

      if (nextStage === "surface_scan") {
        playTone(262, 0.08, 0.06, "triangle");
        playTone(392, 0.1, 0.055, "triangle", 0.08);
        playTone(523, 0.12, 0.045, "sine", 0.18);
        return;
      }

      if (nextStage === "landmark_repair") {
        playTone(330, 0.08, 0.07, "triangle");
        playTone(440, 0.1, 0.06, "triangle", 0.08);
        playTone(660, 0.18, 0.048, "sine", 0.18);
        return;
      }

      if (nextStage === "fake_signal") {
        playNoise(0.13, 0.09);
        playTone(128, 0.08, 0.09, "square", 0.05);
        playTone(236, 0.06, 0.075, "square", 0.14);
        return;
      }

      if (nextStage === "blackbox_pressure") {
        playTone(45, 0.5, 0.11, "sawtooth");
        playNoise(0.24, 0.08, 0.12);
        playTone(91, 0.22, 0.08, "square", 0.32);
        return;
      }

      if (nextStage === "longfire_restore") {
        playTone(220, 0.16, 0.075, "triangle");
        playTone(330, 0.22, 0.07, "sine", 0.11);
        playTone(494, 0.34, 0.06, "sine", 0.24);
      }
    },
    [active, playNoise, playTone, soundEnabled]
  );

  const primeAudio = useCallback(async () => {
    if (!active) return;

    const graph = createGraph();
    if (!graph) return;

    const shouldReplayCue = !hasPrimedAudioRef.current;

    if (graph.context.state === "suspended") {
      await graph.context.resume();
    }

    hasPrimedAudioRef.current = true;
    updateAmbient(stage);

    if (shouldReplayCue && soundEnabled) {
      playTone(294, 0.08, 0.075, "triangle");
      playTone(392, 0.12, 0.06, "sine", 0.08);
      window.setTimeout(() => playSceneCue(stage), 120);
    }
  }, [active, createGraph, playSceneCue, playTone, soundEnabled, stage, updateAmbient]);

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.closest("[data-sound-toggle='true']")) {
        return;
      }

      if (target instanceof HTMLElement && target.closest("button")) {
        void primeAudio().then(() => {
          playTone(300, 0.05, 0.055, "triangle");
        });
        return;
      }

      void primeAudio();
    },
    [playTone, primeAudio]
  );

  useEffect(() => {
    updateAmbient(stage);

    if (!active) {
      lastStageRef.current = stage;
      return;
    }

    if (lastStageRef.current !== stage) {
      playSceneCue(stage);
      lastStageRef.current = stage;
    }
  }, [active, playSceneCue, stage, updateAmbient]);

  useEffect(() => {
    if (!active || disorderLevel <= lastDisorderRef.current) {
      lastDisorderRef.current = disorderLevel;
      return;
    }

    playNoise(0.18, 0.095);
    playTone(124, 0.12, 0.085, "square", 0.05);
    lastDisorderRef.current = disorderLevel;
  }, [active, disorderLevel, playNoise, playTone]);

  useEffect(() => {
    if (!active || exploredCount <= lastExploredCountRef.current) {
      lastExploredCountRef.current = exploredCount;
      return;
    }

    playTone(392, 0.09, 0.075, "triangle");
    playTone(587, 0.16, 0.06, "sine", 0.1);
    lastExploredCountRef.current = exploredCount;
  }, [active, exploredCount, playTone]);

  useEffect(() => {
    const graph = audioRef.current;
    if (!graph) return;

    const now = graph.context.currentTime;
    graph.master.gain.cancelScheduledValues(now);
    graph.master.gain.linearRampToValueAtTime(soundEnabled && active ? 0.3 : 0, now + 0.16);
  }, [active, soundEnabled]);

  useEffect(() => {
    return () => {
      const graph = audioRef.current;
      if (graph) {
        graph.hum.stop();
        graph.dust.stop();
        void graph.context.close();
        audioRef.current = null;
      }
    };
  }, []);

  return {
    stage,
    cueLabel: fieldCueLabels[stage],
    audioReady,
    handlePointerDown,
    primeAudio
  };
}
