"use client";

import type { CloudSaveStatus } from "@/types/cloud-save";
import type { ChapterTwoOutcome, CrewMember, FaultRunState, PlanetModel, ShipLogEntry } from "@/types/game";

interface ParentSummaryPanelProps {
  crew: CrewMember | null;
  planet: PlanetModel | null;
  faultRun: FaultRunState;
  chapterTwoOutcome: ChapterTwoOutcome | null;
  technologyPoints: number;
  aiCapabilityLevel: number;
  aiCapabilityUnlocks: string[];
  shipLogs: ShipLogEntry[];
  saveStatus: CloudSaveStatus;
  lastSavedAt: number | null;
  onBackToResult: () => void;
  onReturnToHub: () => void;
}

function formatSaveTime(timestamp: number | null) {
  if (!timestamp) return "等待写入";

  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(timestamp);
}

function saveLabel(status: CloudSaveStatus) {
  if (status === "saved") return "成果已保存";
  if (status === "saving") return "主舰正在写入本地档案";
  if (status === "error") return "本地保存异常，主舰记忆仍保留";
  if (status === "disabled") return "本地记忆已保留";
  return "存档准备中";
}

export function ParentSummaryPanel({
  crew,
  planet,
  chapterTwoOutcome,
  technologyPoints,
  aiCapabilityLevel,
  aiCapabilityUnlocks,
  shipLogs,
  saveStatus,
  lastSavedAt,
  onBackToResult,
  onReturnToHub
}: ParentSummaryPanelProps) {
  const latestLogs = shipLogs.slice(0, 4);
  const latestUnlocks = aiCapabilityUnlocks.slice(-3);

  return (
    <section className="scene-reveal grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <div className="panel-surface rounded-[32px] p-6 md:p-8">
        <div className="soft-label text-[11px] text-white/45">体验说明页</div>
        <h2 className="mt-4 text-4xl font-semibold text-white">这次试听留下了什么？</h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-white/66">
          这里统一展示本次航行留下的解释内容。主流程里只保留主舰、星球、船员和任务反馈，不再插入出戏说明。
        </p>

        <div className="mt-7 grid gap-4 md:grid-cols-2">
          <div className="rounded-[26px] border border-cyan-200/14 bg-cyan-200/[0.055] p-5">
            <div className="soft-label text-[10px] text-cyan-100/55">这次完成了什么</div>
            <div className="mt-3 text-lg font-semibold text-white">表达 → 建模 → 学习 → 应用</div>
            <p className="mt-3 text-sm leading-6 text-white/62">
              你先用描述创造船员和母星，再登陆语言与信息文明星，通过转述和应用挑战理解文字模型为什么需要清晰表达与边界验证。
            </p>
          </div>

          <div className="rounded-[26px] border border-white/8 bg-white/[0.03] p-5">
            <div className="soft-label text-[10px] text-white/42">本次留下的成果</div>
            <div className="mt-3 space-y-2 text-sm leading-6 text-white/62">
              <div>船员档案：{crew?.name ?? "尚未完成"}</div>
              <div>星球档案：{planet?.name ?? "尚未完成"}</div>
              <div>科技黑匣：{chapterTwoOutcome?.blackBoxTitle ?? chapterTwoOutcome?.title ?? "尚未完成"}</div>
              <div>科技点：{technologyPoints} · AI 等级 {aiCapabilityLevel}</div>
              <div>{saveLabel(saveStatus)} · 最近保存 {formatSaveTime(lastSavedAt)}</div>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-[26px] border border-white/8 bg-white/[0.03] p-5">
          <div className="soft-label text-[10px] text-white/42">能力对应</div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-[18px] border border-white/8 bg-slate-950/35 p-4">
              <div className="text-sm font-semibold text-white">表达与创造</div>
              <div className="mt-2 text-xs leading-5 text-white/52">用自己的语言定义伙伴、星球环境和标志景观。</div>
            </div>
            <div className="rounded-[18px] border border-white/8 bg-slate-950/35 p-4">
              <div className="text-sm font-semibold text-white">AI 表达与验证</div>
              <div className="mt-2 text-xs leading-5 text-white/52">用自己的话转述知识，再用更清楚的指令完成黑匣挑战。</div>
            </div>
            <div className="rounded-[18px] border border-white/8 bg-slate-950/35 p-4">
              <div className="text-sm font-semibold text-white">持续沉淀</div>
              <div className="mt-2 text-xs leading-5 text-white/52">
                船员、母星、日志、黑匣知识和科技点会进入主舰档案，后续继续调用。
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-[26px] border border-amber-200/14 bg-amber-200/[0.045] p-5">
          <div className="soft-label text-[10px] text-amber-100/55">航行复盘流程卡</div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            {[
              ["招募", "描述决定结果"],
              ["星球", "输入改变资源结构"],
              ["黑匣", "AI 需要证据和边界"],
              ["母星", "把作品和规则留下来"]
            ].map(([title, body], index) => (
              <div key={title} className="rounded-[18px] border border-white/8 bg-slate-950/35 p-4">
                <div className="text-[11px] font-semibold text-amber-100/62">{String(index + 1).padStart(2, "0")}</div>
                <div className="mt-2 text-sm font-semibold text-white">{title}</div>
                <div className="mt-2 text-xs leading-5 text-white/56">{body}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-[26px] border border-cyan-200/14 bg-cyan-200/[0.045] p-5">
          <div className="soft-label text-[10px] text-cyan-100/55">第二章学习结果</div>
          {chapterTwoOutcome ? (
            <div className="mt-3 space-y-2 text-sm leading-6 text-white/62">
              <div>文明记录：{chapterTwoOutcome.civilizationRecord ?? chapterTwoOutcome.logSummary}</div>
              <div>主舰变化：{chapterTwoOutcome.aiUpgrade ?? (latestUnlocks.join(" / ") || "语言理解模块已增强")}</div>
              <div>这次不是只看知识，而是完成了“转述理解 + 应用挑战 + 黑匣开启”的完整闭环。</div>
            </div>
          ) : (
            <div className="mt-3 text-sm leading-6 text-white/56">第二章黑匣挑战尚未完成，完成后这里会展示学习结果和 AI 升级记录。</div>
          )}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onBackToResult}
            className="rounded-full bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] hover:bg-cyan-200"
          >
            返回成果页
          </button>
          <button
            type="button"
            onClick={onReturnToHub}
            className="rounded-full border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white/72 transition hover:border-white/24 hover:bg-white/[0.08]"
          >
            回到主舰
          </button>
        </div>
      </div>

      <div className="panel-surface rounded-[32px] p-6 md:p-8">
        <div className="soft-label text-[11px] text-white/45">最近日志 / 档案</div>
        <div className="mt-4 space-y-3">
          {latestLogs.map((log) => (
            <div key={log.id} className="rounded-[18px] border border-white/8 bg-white/[0.03] p-4">
              <div className="text-sm font-semibold text-white">{log.title}</div>
              <div className="mt-2 text-xs leading-5 text-white/54">{log.body}</div>
            </div>
          ))}
          {latestLogs.length === 0 && <div className="text-sm leading-6 text-white/52">主舰还在等待第一条记录。</div>}
        </div>
      </div>
    </section>
  );
}
