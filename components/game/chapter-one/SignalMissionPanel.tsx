"use client";

import type { AIOperationState } from "@/types/ai";
import type { CrewMember, PlanetInputState, PlanetMood, SignalMissionState } from "@/types/game";

import { GenerationStatus } from "@/components/game/GenerationStatus";
import { SystemFeedback } from "@/components/game/SystemFeedback";

interface SignalMissionPanelProps {
  crew: CrewMember;
  mission: SignalMissionState;
  canAnalyzePlanet: boolean;
  canRestorePlanet: boolean;
  analyzeOperation: AIOperationState;
  repairOperation: AIOperationState;
  onAcknowledgeAlert: () => void;
  onPlanetInputChange: <Key extends keyof PlanetInputState>(field: Key, value: PlanetInputState[Key]) => void;
  onAnalyzePlanet: () => void;
  onRestorePlanet: () => void;
}

const moodOptions: PlanetMood[] = ["安静", "危险", "神秘", "遗迹活跃"];

const appearanceHints = [
  "像被环带抱住的蓝灰色海洋星球",
  "像表面有晶体裂纹的旧矿星",
  "像被雾和浅绿光斑包住的森林星球"
];

const environmentHints = [
  "地表最明显的是会发光的潮汐海和低空云雾。",
  "这里最突出的环境是断层峡谷和不稳定能量风暴。",
  "星球上散落着旧塔和半埋在地里的遗迹群。"
];

const resourceLabels = {
  water: "水源",
  mineral: "矿物",
  energy: "能源",
  ecology: "生态",
  relicData: "遗迹数据"
} as const;

function appendHint(current: string, hint: string) {
  return current.trim().length === 0 ? hint : `${current.trim()} ${hint}`;
}

export function SignalMissionPanel({
  crew,
  mission,
  canAnalyzePlanet,
  canRestorePlanet,
  analyzeOperation,
  repairOperation,
  onAcknowledgeAlert,
  onPlanetInputChange,
  onAnalyzePlanet,
  onRestorePlanet
}: SignalMissionPanelProps) {
  return (
    <section className="scene-reveal space-y-5">
      <div className="fleet-broadcast panel-surface rounded-full px-4 py-2">
        <div className="fleet-broadcast-track">
          {[
            "第一页：星球建模与导航修复",
            "你的描述会直接决定资源结构与危险等级",
            `${crew.name} 正在参与第一颗星球建模`,
            mission.planet.status === "restored" ? "完成后会自动进入第二页故障回溯" : "完成后会自动进入第二页故障回溯"
          ].map((item, index) => (
            <span key={`${item}-${index}`} className="fleet-broadcast-item">
              {item}
            </span>
          ))}
        </div>
      </div>

      {mission.currentStage === "alert" && (
        <div className="panel-surface rounded-[32px] p-6 md:p-8">
          <div className="soft-label text-[11px] text-amber-100/55">信息库 · 第一页</div>
          <h2 className="mt-3 text-3xl font-semibold text-white">先定义第一颗星球，帮智脑恢复第一份可用世界模型。</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <SystemFeedback
              eyebrow="这一页会做什么"
              title="星球建模与导航修复"
              body="你不是在写设定文，而是在帮主舰建立一颗真正能调用的星球对象。资源、危险和标签都会被保存下来。"
              tone="success"
            />
            <SystemFeedback
              eyebrow="完成后立刻生效"
              title="修好就能马上用"
              body="第一颗星球会写入星图，资源开始产出，导航盘恢复，第一个探索坐标也会立刻点亮。"
              tone="warm"
            />
          </div>
          <button
            type="button"
            onClick={onAcknowledgeAlert}
            className="mt-8 rounded-full bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] hover:bg-cyan-200"
          >
            进入第一页
          </button>
        </div>
      )}

      {mission.currentStage !== "alert" && (
        <div className="panel-surface rounded-[32px] p-6 md:p-8">
          <div className="soft-label text-[11px] text-white/42">第一页 · 星球建模</div>
          <h2 className="mt-3 text-3xl font-semibold text-white">把这颗残缺天体，变成第一颗能被主舰调用的星球。</h2>

          <div className="mt-5 rounded-[26px] border border-cyan-200/14 bg-cyan-200/[0.06] p-5">
            <div className="text-base font-semibold text-white">{mission.planet.seed.title}</div>
            <div className="mt-2 text-sm leading-6 text-white/68">{mission.planet.seed.silhouette}</div>
            <div className="mt-2 text-xs text-cyan-100/68">{mission.planet.seed.teaser}</div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div>
              <div className="mb-2 text-sm font-semibold text-white/82">这颗星球看起来像什么</div>
              <div className="mb-3 flex flex-wrap gap-2">
                {appearanceHints.map((hint) => (
                  <button
                    key={hint}
                    type="button"
                    onClick={() => onPlanetInputChange("appearance", appendHint(mission.planet.input.appearance, hint))}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/72 transition hover:border-white/22 hover:bg-white/[0.08]"
                  >
                    借一句开始
                  </button>
                ))}
              </div>
              <textarea
                value={mission.planet.input.appearance}
                onChange={(event) => onPlanetInputChange("appearance", event.target.value)}
                placeholder={mission.planet.seed.promptLook}
                rows={4}
                className="w-full rounded-[22px] border border-white/10 bg-slate-950/60 px-4 py-4 text-sm leading-7 text-white outline-none transition placeholder:text-white/28 focus:border-cyan-300/28"
              />
            </div>

            <div>
              <div className="mb-2 text-sm font-semibold text-white/82">最突出的环境特征</div>
              <div className="mb-3 flex flex-wrap gap-2">
                {environmentHints.map((hint) => (
                  <button
                    key={hint}
                    type="button"
                    onClick={() => onPlanetInputChange("environment", appendHint(mission.planet.input.environment, hint))}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/72 transition hover:border-white/22 hover:bg-white/[0.08]"
                  >
                    借一句开始
                  </button>
                ))}
              </div>
              <textarea
                value={mission.planet.input.environment}
                onChange={(event) => onPlanetInputChange("environment", event.target.value)}
                placeholder={mission.planet.seed.promptEnvironment}
                rows={4}
                className="w-full rounded-[22px] border border-white/10 bg-slate-950/60 px-4 py-4 text-sm leading-7 text-white outline-none transition placeholder:text-white/28 focus:border-cyan-300/28"
              />
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-3 text-sm font-semibold text-white/82">它整体更偏哪一种气质</div>
            <div className="flex flex-wrap gap-3">
              {moodOptions.map((mood) => (
                <button
                  key={mood}
                  type="button"
                  onClick={() => onPlanetInputChange("mood", mood)}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    mission.planet.input.mood === mood
                      ? "border-cyan-300/35 bg-cyan-300/10 text-white"
                      : "border-white/10 bg-white/[0.03] text-white/68 hover:border-white/22"
                  }`}
                >
                  {mood}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-[0.8fr_1.2fr]">
            <div>
              <div className="mb-2 text-sm font-semibold text-white/82">星球名称</div>
              <input
                value={mission.planet.input.name}
                onChange={(event) => onPlanetInputChange("name", event.target.value)}
                placeholder="可以自己命名，也可以让系统给建议"
                className="w-full rounded-[18px] border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/28 focus:border-cyan-300/28"
              />
            </div>
            <div>
              <div className="mb-2 text-sm font-semibold text-white/82">额外补充</div>
              <input
                value={mission.planet.input.notes}
                onChange={(event) => onPlanetInputChange("notes", event.target.value)}
                placeholder={mission.planet.seed.promptTone}
                className="w-full rounded-[18px] border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/28 focus:border-cyan-300/28"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onAnalyzePlanet}
              disabled={!canAnalyzePlanet}
              className="rounded-full border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white/78 transition hover:border-white/24 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:bg-white/[0.02] disabled:text-white/34"
            >
              让系统理解这颗星球
            </button>
            <button
              type="button"
              onClick={onRestorePlanet}
              disabled={!canRestorePlanet}
              className="rounded-full bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-white/12 disabled:text-white/40"
            >
              写入星图并进入第二页
            </button>
          </div>

          <div className="mt-5 space-y-3">
            <GenerationStatus title="星球建模解析" operation={analyzeOperation} />
            <GenerationStatus title="导航系统回写" operation={repairOperation} />
          </div>

          {mission.planet.analysis && (
            <div className="mt-6 grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
              <SystemFeedback
                eyebrow="系统理解"
                title={mission.planet.analysis.suggestedName}
                body={`${mission.planet.analysis.summary} 危险等级：${mission.planet.analysis.dangerLabel}。`}
                tone="success"
              />
              <div className="rounded-[26px] border border-white/8 bg-white/[0.03] p-5">
                <div className="text-sm font-semibold text-white">资源总量固定为 100</div>
                <div className="mt-4 space-y-3">
                  {(Object.keys(resourceLabels) as Array<keyof typeof resourceLabels>).map((key) => (
                    <div key={key}>
                      <div className="mb-2 flex items-center justify-between gap-3 text-xs text-white/58">
                        <span>{resourceLabels[key]}</span>
                        <span>{mission.planet.analysis!.resourceProfile[key]}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/8">
                        <div className="h-full rounded-full bg-cyan-300" style={{ width: `${mission.planet.analysis!.resourceProfile[key]}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-xs leading-6 text-white/48">
                  这份资源结构不是随机的，而是根据你的描述、气质判断和系统提取标签共同生成的。
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
