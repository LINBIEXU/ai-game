"use client";

import { useEffect, useState } from "react";

import type { CrewFormType, CrewRole } from "@/types/game";

const accentMap: Record<CrewFormType, string> = {
  mechanical: "from-sky-300/70 via-cyan-300/30 to-transparent",
  biological: "from-emerald-300/70 via-lime-300/25 to-transparent",
  energy: "from-violet-300/70 via-sky-300/30 to-transparent",
  hybrid: "from-amber-300/70 via-rose-300/30 to-transparent"
};

const roleRingMap: Record<CrewRole, string> = {
  scout: "border-sky-300/60",
  repair: "border-emerald-300/60",
  record: "border-amber-200/60",
  pilot: "border-violet-300/60"
};

interface CrewPortraitProps {
  formType: CrewFormType;
  role: CrewRole;
  seed?: number;
  size?: "sm" | "lg";
  imageUrl?: string | null;
  alt?: string;
}

export function CrewPortrait({ formType, role, seed = 0, size = "lg", imageUrl = null, alt = "船员形象" }: CrewPortraitProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const isLarge = size === "lg";
  const orbitalClass = accentMap[formType];
  const ringClass = roleRingMap[role];
  const tilt = seed % 8;
  const pulseDelay = `${(seed % 5) * 180}ms`;
  const glowClass = isLarge ? "inset-6 blur-2xl opacity-100" : "inset-4 blur-lg opacity-55";

  useEffect(() => {
    setImageFailed(false);
  }, [imageUrl]);

  return (
    <div
      className={`relative flex items-center justify-center rounded-[28px] border border-white/10 bg-slate-950/60 ${
        isLarge ? "aspect-[4/5] min-h-[29rem] w-full overflow-hidden" : "h-16 w-16 overflow-hidden rounded-[22px]"
      } overflow-hidden`}
    >
      <div className={`pointer-events-none absolute ${glowClass} rounded-full bg-gradient-to-br ${orbitalClass}`} />
      {isLarge && <div className="absolute inset-3 rounded-[24px] border border-white/8 bg-white/[0.02]" />}
      {imageUrl && !imageFailed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={alt}
          className={`absolute rounded-[24px] object-contain object-center ${
            isLarge ? "inset-4 h-[calc(100%-32px)] w-[calc(100%-32px)]" : "inset-1.5 h-[calc(100%-12px)] w-[calc(100%-12px)]"
          }`}
          onError={() => setImageFailed(true)}
        />
      )}
      <div
        className={`pointer-events-none absolute ${isLarge ? "h-48 w-48" : "h-12 w-12"} rounded-full border ${ringClass} opacity-70`}
        style={{ transform: `rotate(${tilt * 6}deg) scale(${isLarge ? 1 : 0.92})`, animationDelay: pulseDelay }}
      />

      {(!imageUrl || imageFailed) && (
        <>
          {formType === "mechanical" && (
            <>
              <div className={`relative rounded-[22px] border border-sky-100/25 bg-slate-800/80 ${isLarge ? "h-44 w-36" : "h-12 w-10"}`} />
              <div className={`absolute rounded-full border border-sky-200/40 bg-cyan-200/20 ${isLarge ? "h-10 w-10 -translate-y-10" : "h-4 w-4 -translate-y-2"}`} />
              <div className={`absolute rounded-full bg-cyan-100/70 ${isLarge ? "h-3 w-20 translate-y-16" : "h-1 w-6 translate-y-4"}`} />
            </>
          )}

          {formType === "biological" && (
            <>
              <div
                className={`relative rounded-[40%] border border-emerald-100/25 bg-gradient-to-b from-emerald-100/20 to-teal-200/10 ${
                  isLarge ? "h-48 w-40" : "h-12 w-11"
                }`}
                style={{ borderRadius: `${48 + (seed % 10)}% 52% 44% 56% / 46% 42% 58% 54%` }}
              />
              <div className={`absolute rounded-full bg-emerald-200/75 ${isLarge ? "h-3 w-20 translate-y-20" : "h-1.5 w-6 translate-y-4"}`} />
            </>
          )}

          {formType === "energy" && (
            <>
              <div className={`animate-pulse-glow relative rounded-full bg-sky-200/60 ${isLarge ? "h-32 w-32" : "h-10 w-10"}`} />
              <div className={`absolute rounded-full border border-violet-200/50 ${isLarge ? "h-56 w-36" : "h-14 w-8"}`} />
            </>
          )}

          {formType === "hybrid" && (
            <>
              <div
                className={`relative border border-amber-100/30 bg-gradient-to-b from-amber-100/20 to-rose-200/10 ${
                  isLarge ? "h-44 w-36 rounded-[32px]" : "h-11 w-10 rounded-[16px]"
                }`}
              />
              <div className={`absolute rounded-full bg-rose-200/70 blur-sm ${isLarge ? "h-14 w-14 -translate-y-12" : "h-5 w-5 -translate-y-3"}`} />
              <div className={`absolute rounded-full border border-amber-100/35 ${isLarge ? "h-52 w-24 rotate-12" : "h-14 w-8 rotate-12"}`} />
            </>
          )}
        </>
      )}
    </div>
  );
}
