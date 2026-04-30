"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { AIOperationState } from "@/types/ai";
import type { GameState } from "@/types/game";

export type ChapterOnePresentationStage =
  | "boot_dark"
  | "core_restore"
  | "crew_recruit"
  | "vault_warning"
  | "planet_building"
  | "planet_complete"
  | "fault_dive"
  | "fault_running"
  | "fault_result"
  | "session_summary";

interface UseChapterOnePresentationOptions {
  state: GameState;
  operations: Record<string, AIOperationState | undefined>;
}

interface ChapterOneAudioGraph {
  context: AudioContext;
  master: GainNode;
  ambientGain: GainNode;
  hum: OscillatorNode;
  drift: OscillatorNode;
}

const BACKGROUND_MUSIC_SRC = "/audio/e5d210871dd2a69c123ce0682be73704_HQ.mp3";

const stageCueMap: Record<ChapterOnePresentationStage, string> = {
  boot_dark: "全舰故障广播断续中",
  core_restore: "主舱核心正在稳定",
  crew_recruit: "第一位船员信号已聚焦",
  vault_warning: "信息库异常警报插入",
  planet_building: "系统正在理解并回写星球模型",
  planet_complete: "导航坐标锁定，第一颗星球可调用",
  fault_dive: "故障时间线正在下潜",
  fault_running: "故障链正在重新拼合",
  fault_result: "旧资料正在写入本次演算",
  session_summary: "试听成果已归档"
};

function clampFrequency(frequency: number) {
  return Math.max(32, Math.min(1400, frequency));
}

export function useChapterOnePresentation({ state, operations }: UseChapterOnePresentationOptions) {
  const audioRef = useRef<ChapterOneAudioGraph | null>(null);
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const lastStageRef = useRef<ChapterOnePresentationStage | null>(null);
  const hasPrimedAudioRef = useRef(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [audioReady, setAudioReady] = useState(false);

  const stage = useMemo<ChapterOnePresentationStage>(() => {
    if (state.currentScene === "signal-review") {
      return state.signalMission.faultRun.result ? "fault_result" : "fault_running";
    }

    if (state.currentScene === "trial-bridge") {
      return "fault_dive";
    }

    if (state.currentScene === "experience-result" || state.currentScene === "trial-result" || state.currentScene === "parent-summary" || state.firstStarLit) {
      return state.currentScene === "experience-result" || state.currentScene === "trial-result" || state.currentScene === "parent-summary" ? "session_summary" : "planet_complete";
    }

    if (state.currentScene === "signal-mission") {
      if (operations["signal-analyze"]?.status === "loading" || operations["signal-repair"]?.status === "loading") {
        return "planet_building";
      }

      if (state.signalMission.planet.status === "analyzed" || state.signalMission.planet.status === "restored") {
        return "planet_complete";
      }

      if (state.signalMission.currentStage === "alert") {
        return "vault_warning";
      }

      return "planet_building";
    }

    if (state.currentScene === "crew-result") {
      return "crew_recruit";
    }

    if (state.currentScene === "awakening") {
      return "boot_dark";
    }

    if (state.systemsRestored && state.crewOnboard) {
      return "vault_warning";
    }

    if (state.systemsRestored) {
      return "core_restore";
    }

    return "boot_dark";
  }, [
    operations,
    state.crewOnboard,
    state.currentScene,
    state.firstStarLit,
    state.signalMission.currentStage,
    state.signalMission.planet.status,
    state.systemsRestored
  ]);

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
    const drift = context.createOscillator();

    master.gain.value = soundEnabled ? 0.38 : 0;
    ambientGain.gain.value = 0.085;
    hum.type = "sine";
    hum.frequency.value = 44;
    drift.type = "triangle";
    drift.frequency.value = 67;
    hum.connect(ambientGain);
    drift.connect(ambientGain);
    ambientGain.connect(master);
    master.connect(context.destination);
    hum.start();
    drift.start();

    audioRef.current = {
      context,
      master,
      ambientGain,
      hum,
      drift
    };
    setAudioReady(true);

    return audioRef.current;
  }, [soundEnabled]);

  const createBgm = useCallback(() => {
    if (bgmRef.current || typeof window === "undefined") {
      return bgmRef.current;
    }

    const bgm = new Audio(BACKGROUND_MUSIC_SRC);
    bgm.loop = true;
    bgm.preload = "auto";
    bgm.volume = soundEnabled ? 0.24 : 0;
    bgmRef.current = bgm;

    return bgm;
  }, [soundEnabled]);

  const playTone = useCallback((frequency: number, duration = 0.16, volume = 0.12, type: OscillatorType = "sine", delay = 0) => {
    const graph = audioRef.current;
    if (!graph || !soundEnabled) return;

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
    oscillator.stop(now + duration + 0.03);
  }, [soundEnabled]);

  const playNoise = useCallback((duration = 0.16, volume = 0.08, delay = 0) => {
    const graph = audioRef.current;
    if (!graph || !soundEnabled) return;

    const now = graph.context.currentTime + delay;
    const frameCount = Math.max(1, Math.floor(graph.context.sampleRate * duration));
    const buffer = graph.context.createBuffer(1, frameCount, graph.context.sampleRate);
    const data = buffer.getChannelData(0);

    for (let index = 0; index < frameCount; index += 1) {
      data[index] = (Math.random() * 2 - 1) * (1 - index / frameCount);
    }

    const source = graph.context.createBufferSource();
    const gain = graph.context.createGain();
    source.buffer = buffer;
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    source.connect(gain);
    gain.connect(graph.master);
    source.start(now);
    source.stop(now + duration + 0.02);
  }, [soundEnabled]);

  const playStageCue = useCallback(
    (nextStage: ChapterOnePresentationStage) => {
      if (!audioRef.current || !soundEnabled) return;

      if (nextStage === "boot_dark") {
        playTone(74, 0.28, 0.13, "sawtooth");
        playTone(49, 0.42, 0.085, "sine", 0.24);
        return;
      }

      if (nextStage === "core_restore") {
        playTone(196, 0.14, 0.13);
        playTone(294, 0.18, 0.12, "sine", 0.1);
        return;
      }

      if (nextStage === "crew_recruit") {
        playNoise(0.12, 0.07);
        playTone(330, 0.13, 0.135, "triangle", 0.04);
        playTone(440, 0.16, 0.115, "triangle", 0.15);
        return;
      }

      if (nextStage === "vault_warning" || nextStage === "fault_dive") {
        playNoise(0.2, 0.12);
        playTone(118, 0.22, 0.13, "square", 0.08);
        return;
      }

      if (nextStage === "planet_building") {
        playTone(262, 0.12, 0.095, "sine");
        playTone(392, 0.18, 0.095, "sine", 0.08);
        playTone(220, 0.08, 0.075, "triangle");
        playTone(275, 0.08, 0.075, "triangle", 0.08);
        playTone(330, 0.1, 0.07, "triangle", 0.16);
        return;
      }

      if (nextStage === "planet_complete") {
        playTone(330, 0.12, 0.12);
        playTone(494, 0.2, 0.11, "sine", 0.08);
        return;
      }

      if (nextStage === "fault_running" || nextStage === "fault_result") {
        playNoise(0.11, 0.08);
        playTone(156, 0.09, 0.1, "square", 0.04);
        playTone(234, 0.12, 0.085, "triangle", 0.14);
        return;
      }

      playTone(262, 0.18, 0.135);
      playTone(392, 0.22, 0.12, "sine", 0.11);
      playTone(587, 0.35, 0.105, "sine", 0.24);
    },
    [playNoise, playTone, soundEnabled]
  );

  const updateAmbient = useCallback(
    (nextStage: ChapterOnePresentationStage) => {
      const graph = audioRef.current;
      if (!graph) return;

      const now = graph.context.currentTime;
      const targetGain = soundEnabled ? (nextStage === "session_summary" || nextStage === "planet_complete" ? 0.065 : nextStage === "boot_dark" ? 0.1 : 0.082) : 0;
      const humFrequency = nextStage === "session_summary" || nextStage === "planet_complete" ? 58 : nextStage === "vault_warning" || nextStage === "fault_dive" ? 52 : nextStage === "fault_running" ? 62 : 44;
      const driftFrequency = nextStage === "session_summary" || nextStage === "planet_complete" ? 96 : nextStage === "planet_building" ? 82 : 67;

      graph.master.gain.cancelScheduledValues(now);
      graph.master.gain.linearRampToValueAtTime(soundEnabled ? 0.38 : 0, now + 0.18);
      graph.ambientGain.gain.cancelScheduledValues(now);
      graph.ambientGain.gain.linearRampToValueAtTime(targetGain, now + 0.28);
      graph.hum.frequency.linearRampToValueAtTime(humFrequency, now + 0.45);
      graph.drift.frequency.linearRampToValueAtTime(driftFrequency, now + 0.45);
    },
    [soundEnabled]
  );

  const primeAudio = useCallback(async () => {
    const graph = createGraph();
    if (!graph) return;

    const shouldReplayCue = !hasPrimedAudioRef.current;

    if (graph.context.state === "suspended") {
      await graph.context.resume();
    }

    hasPrimedAudioRef.current = true;
    updateAmbient(stage);

    if (shouldReplayCue && soundEnabled) {
      playTone(523, 0.08, 0.13, "triangle");
      playTone(784, 0.12, 0.1, "sine", 0.08);
      window.setTimeout(() => playStageCue(stage), 110);
    }

    const bgm = createBgm();
    if (bgm && soundEnabled) {
      bgm.volume = 0.24;
      try {
        await bgm.play();
      } catch {
        // Browser autoplay rules can still block until the next user gesture.
      }
    }
  }, [createBgm, createGraph, playStageCue, playTone, soundEnabled, stage, updateAmbient]);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.closest("button")) {
        void primeAudio().then(() => {
          playTone(360, 0.06, 0.09, "triangle");
        });
        return;
      }

      void primeAudio();
    },
    [playTone, primeAudio]
  );

  const toggleSound = useCallback(() => {
    setSoundEnabled((current) => !current);
  }, []);

  useEffect(() => {
    const bgm = bgmRef.current;
    const graph = audioRef.current;

    if (graph) {
      const now = graph.context.currentTime;
      graph.master.gain.cancelScheduledValues(now);
      graph.master.gain.linearRampToValueAtTime(soundEnabled ? 0.38 : 0, now + 0.16);
    }

    if (!bgm) return;

    if (!soundEnabled) {
      bgm.pause();
      return;
    }

    bgm.volume = 0.24;
    if (hasPrimedAudioRef.current) {
      void bgm.play().catch(() => undefined);
    }
  }, [soundEnabled]);

  useEffect(() => {
    updateAmbient(stage);

    if (lastStageRef.current !== stage) {
      playStageCue(stage);
      lastStageRef.current = stage;
    }
  }, [playStageCue, stage, updateAmbient]);

  useEffect(() => {
    return () => {
      const graph = audioRef.current;
      if (graph) {
        graph.hum.stop();
        graph.drift.stop();
        void graph.context.close();
        audioRef.current = null;
      }

      const bgm = bgmRef.current;
      if (bgm) {
        bgm.pause();
        bgm.src = "";
        bgmRef.current = null;
      }
    };
  }, []);

  return {
    stage,
    cueLabel: stageCueMap[stage],
    soundEnabled,
    audioReady,
    handlePointerDown,
    primeAudio,
    toggleSound
  };
}
