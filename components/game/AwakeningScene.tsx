"use client";

interface AwakeningSceneProps {
  onAwaken: () => void;
}

export function AwakeningScene({ onAwaken }: AwakeningSceneProps) {
  return (
    <section className="panel-surface relative overflow-hidden rounded-[32px] px-8 py-16 text-center shadow-glow">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent" />
      <div className="mx-auto max-w-xl">
        <div className="soft-label text-[11px] text-cyan-200/60">主舱唤醒</div>
        <h1 className="mt-6 text-4xl font-semibold tracking-[0.08em] text-white md:text-5xl">检测到新指挥员</h1>
        <p className="mt-5 text-lg text-white/70">主舱正在恢复</p>
        <button
          type="button"
          onClick={onAwaken}
          className="mt-12 rounded-full bg-cyan-300 px-8 py-4 text-base font-semibold text-slate-950 transition hover:scale-[1.02] hover:bg-cyan-200"
        >
          醒来
        </button>
      </div>
    </section>
  );
}
