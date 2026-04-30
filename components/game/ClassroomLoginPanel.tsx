"use client";

import { useState } from "react";

interface ClassroomLoginPanelProps {
  status: string;
  message: string;
  onLogin: (name: string) => void | Promise<void>;
}

export function ClassroomLoginPanel({ status, message, onLogin }: ClassroomLoginPanelProps) {
  const [name, setName] = useState("");

  return (
    <main className="starfield relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-10">
      <section className="panel-surface hologram-sweep max-w-xl rounded-[34px] p-7 md:p-9">
        <div className="soft-label text-[11px] text-cyan-100/55">课堂本地档案</div>
        <h1 className="mt-4 text-3xl font-semibold text-white">输入学员姓名，接入今天的主舰记录。</h1>
        <p className="mt-4 text-sm leading-7 text-white/62">
          这是无 API 的课堂模式。孩子先完成设定，老师稍后导入外部生成好的图片；系统会按姓名把作品保存到本地文件夹。
        </p>
        <div className="mt-6 rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
          <label className="text-xs tracking-[0.16em] text-white/40">学员姓名</label>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && name.trim()) {
                void onLogin(name);
              }
            }}
            placeholder="例如：林小航"
            className="mt-3 w-full rounded-[18px] border border-white/10 bg-slate-950/55 px-4 py-3 text-white outline-none placeholder:text-white/28 focus:border-cyan-200/35"
          />
          <button
            type="button"
            disabled={!name.trim() || status === "loading"}
            onClick={() => void onLogin(name)}
            className="mt-4 rounded-full bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === "loading" ? "正在接入" : "进入课堂主舰"}
          </button>
        </div>
        <div className="mt-4 text-sm leading-6 text-cyan-50/64">{message}</div>
      </section>
    </main>
  );
}
