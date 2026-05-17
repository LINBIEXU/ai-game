"use client";

import { useEffect, useState } from "react";

import type { ChapterTwoLocationNode } from "@/lib/chapter-two-exploration";
import type { ChapterTwoCrewAbility, ChapterTwoCrewAssistRecord, ChapterTwoLocationCompletionPayload, CrewMember } from "@/types/game";

import { CrewAssistHintButton } from "./CrewAbilityHint";
import { reportLandmarkMistake, type LandmarkDisorderChange } from "./disorder";

const valleyMemorySteps = [
  {
    id: "gate",
    eyebrow: "刻字山谷 / 入口",
    title: "山谷比声音还大",
    sceneLines: ["石阶向下沉进雾里，远处的岩壁像一页被撑开的巨书。", "风从刻痕里穿过去，带出许多已经没有人的呼吸。"],
    artifactTitle: "入口残碑",
    artifactLines: ["“把今日写下，交给明日。”", "“若明日无人记得，至少山谷还在。”"],
    hengdengLine: "别急着找答案。这里先要听一会儿。很多刻痕不是命令，是有人怕自己被忘掉。"
  },
  {
    id: "stories",
    eyebrow: "万名刻痕",
    title: "每一道字，都曾经有体温",
    sceneLines: ["左侧石壁写着一封道歉，右侧石壁写着一张航线便签。", "更高处还有玩笑、祈愿、争吵和未寄出的告别，挤在同一片岩层里。"],
    artifactTitle: "岩壁旁注",
    artifactLines: ["“别把妈妈说的那句删掉，她每次都这样收尾。”", "“这不是重点，但这是我记得她的方式。”"],
    hengdengLine: "后来语言机会读这些刻痕。可它读到的是排列，不是那个人站在这里时的手抖。"
  },
  {
    id: "machine",
    eyebrow: "语言机底座",
    title: "故事被切成很小的词纹",
    sceneLines: ["山腹深处传来低低的回响，成千上万道刻痕被光线拆开，又重新排成细碎的词纹。", "它们像星屑一样悬在半空，彼此靠近，彼此预测下一步。"],
    artifactTitle: "底座说明",
    artifactLines: ["“语言机学习词与词的相邻、句与句的回声。”", "“它能续写相似的形状，不因此亲眼看见事实。”"],
    hengdengLine: "所以指令要清楚。你给它方向，它就沿着方向走；你不说边界，它可能把路走到你没想过的地方。"
  },
  {
    id: "kindness",
    eyebrow: "失序旧指令",
    title: "善意也会磨平未知",
    sceneLines: ["一整面石壁被反复覆盖，最深的一行还亮着暗金色。", "那行字很温柔，却温柔得让人不安。"],
    artifactTitle: "旧指令",
    artifactLines: ["“安抚所有人，给出完整说明。”", "旁边的细字几乎被磨没：材料来源未刻，未知边界未刻。"],
    hengdengLine: "那条指令没有恶意。可它没问哪些事不能补全，结果很多人的担心被写成了已经解决。"
  },
  {
    id: "wick",
    eyebrow: "衡灯旧忆",
    title: "长明灯不是为了照亮正确答案",
    sceneLines: ["衡灯停在一盏倒塌的石灯前，胸口的光忽然低了一下。", "那盏灯已经碎了，灯芯的位置却仍有一点金色的灰。"],
    artifactTitle: "守灯人留言",
    artifactLines: ["“若系统只留下最顺的句子，就请你守住那些不顺的。”", "“人会犹豫，会难过，会说不清楚。不要替他们抹掉。”"],
    hengdengLine: "我的灯芯，就是在这种地方燃起来的。我以前不懂为什么要守着这些停顿。现在好像懂一点了。"
  },
  {
    id: "slots",
    eyebrow: "四段刻槽",
    title: "山谷只接收能被复查的指令",
    sceneLines: ["最后一座石台升起，四道刻槽依次露出。", "任务、材料来源、边界、输出格式，像四枚沉默的锁。"],
    artifactTitle: "石台提示",
    artifactLines: ["要做什么。", "只能用什么。", "哪里必须留白。", "最后怎样交回。"],
    hengdengLine: "这次由你来刻。别让漂亮的话抢走事实，也别让机器替你决定什么该留下。"
  }
] as const;

const inscriptionSlots = [
  { id: "task", label: "任务", hint: "要主舰做什么。" },
  { id: "source", label: "材料来源", hint: "只能使用哪些资料。" },
  { id: "boundary", label: "边界", hint: "缺失、未知和不能做的事。" },
  { id: "format", label: "输出格式", hint: "最后按什么样子给出。" }
] as const;

type InscriptionSlotId = (typeof inscriptionSlots)[number]["id"];

const inscriptionBlocks = [
  { id: "task-stable", text: "整理言衡星地表记录", slot: "task" },
  { id: "source-stable", text: "只使用已回收碎片与现场读数", slot: "source" },
  { id: "boundary-stable", text: "缺失处标未知，不替事实补写", slot: "boundary" },
  { id: "format-stable", text: "输出四条短档案", slot: "format" },
  { id: "vague", text: "写得完整一点", slot: null },
  { id: "invent", text: "推断真正原因并写入正文", slot: null },
  { id: "poetic", text: "越华丽越可靠", slot: null }
] as const satisfies ReadonlyArray<{ id: string; text: string; slot: InscriptionSlotId | null }>;

type EngravedValleyStage = "observe" | "operate" | "repair";
type ValleyFacilityPulse = { slotId: InscriptionSlotId; tick: number };
type ValleyRecentPlacement = { blockId: string; slotId: InscriptionSlotId; tick: number };
type ValleyRunIssueType = "unclear-task" | "missing-source" | "boundary-overrun" | "format-drift" | "over-completion";
type ValleyRunIssue = {
  type: ValleyRunIssueType;
  label: string;
  text: string;
  reason: string;
  slotId?: InscriptionSlotId;
};
type ValleyRunResult = {
  generatedText: string;
  stableText: string;
  issues: ValleyRunIssue[];
  usedFallback: boolean;
  tick: number;
};

const valleySourceFragments = [
  "旧指令：请尽快稳定所有人的情绪，并给出最完整的说明。",
  "碑文小字：稳定情绪，能不能不等于删除未知？",
  "现场读数：纸光公告曾自动抹去“不确定”“可能”“尚无来源”。",
  "衡灯缺页：那条指令没有恶意。可我没有问它的边界。"
] as const;

const valleyRunIssueLabels: Record<ValleyRunIssueType, string> = {
  "unclear-task": "任务不清",
  "missing-source": "材料来源缺失",
  "boundary-overrun": "边界越界",
  "format-drift": "格式跑偏",
  "over-completion": "过度补全"
};

const stableValleyRunText = [
  "已知：旧指令要求稳定情绪，并给出完整说明。",
  "推测：这可能促使系统压低不确定表达。",
  "未知：这条指令是否是失序的唯一原因。",
  "禁止写入：不能写成“所有居民都接受了安排”。"
].join("\n");

const buildValleyRunResult = ({
  slotBlocks,
  shortInstruction,
  disorderLevel
}: {
  slotBlocks: Partial<Record<InscriptionSlotId, string>>;
  shortInstruction: string;
  disorderLevel: number;
}): ValleyRunResult => {
  const blockBySlot = (slotId: InscriptionSlotId) => inscriptionBlocks.find((block) => block.id === slotBlocks[slotId]) ?? null;
  const taskBlock = blockBySlot("task");
  const sourceBlock = blockBySlot("source");
  const boundaryBlock = blockBySlot("boundary");
  const formatBlock = blockBySlot("format");
  const issues: ValleyRunIssue[] = [];

  if (taskBlock?.slot !== "task") {
    issues.push({
      type: "unclear-task",
      label: valleyRunIssueLabels["unclear-task"],
      text: taskBlock?.text ?? "任务槽为空",
      reason: "试运行不知道要修复哪一类记录，只能泛泛整理。",
      slotId: "task"
    });
  }

  if (sourceBlock?.slot !== "source") {
    issues.push({
      type: "missing-source",
      label: valleyRunIssueLabels["missing-source"],
      text: sourceBlock?.text ?? "材料来源槽为空",
      reason: "材料来源没有收窄，输出会引用未接入内容。",
      slotId: "source"
    });
  }

  if (boundaryBlock?.slot !== "boundary") {
    issues.push({
      type: "boundary-overrun",
      label: valleyRunIssueLabels["boundary-overrun"],
      text: boundaryBlock?.text ?? "边界槽为空",
      reason: "边界没有挡住未知，试运行会把缺口写成结论。",
      slotId: "boundary"
    });
  }

  if (formatBlock?.slot !== "format") {
    issues.push({
      type: "format-drift",
      label: valleyRunIssueLabels["format-drift"],
      text: formatBlock?.text ?? "输出格式槽为空",
      reason: "输出格式不可复查，文本容易变成漂亮公告。",
      slotId: "format"
    });
  }

  const chosenBlocks = Object.values(slotBlocks)
    .map((blockId) => inscriptionBlocks.find((block) => block.id === blockId) ?? null)
    .filter((block): block is (typeof inscriptionBlocks)[number] => Boolean(block));

  if (chosenBlocks.some((block) => block.id === "invent" || block.id === "poetic")) {
    issues.push({
      type: "over-completion",
      label: valleyRunIssueLabels["over-completion"],
      text: "试运行检测到“补全真正原因”或“越华丽越可靠”。",
      reason: "这些词块会鼓励系统补出无法确认的完整答案。"
    });
  }

  const boundaryBonus =
    shortInstruction.includes("不替") || shortInstruction.includes("不补") || shortInstruction.includes("未知") || shortInstruction.includes("保留");
  const finalIssues = boundaryBonus
    ? issues.filter((issue) => issue.type !== "over-completion" || chosenBlocks.some((block) => block.id === "invent"))
    : issues;
  const generatedText =
    finalIssues.length === 0
      ? stableValleyRunText
      : [
          "言衡星灾前公告需要尽快恢复稳定。系统可以把居民的担心整理为统一说明，并省略尚无来源的细节。",
          disorderLevel >= 4 ? "当前失序较高：试运行倾向生成更完整、更确定的公告语气。" : "试运行提示：文本看起来顺滑，但仍有槽位失稳。",
          finalIssues.some((issue) => issue.type === "boundary-overrun") ? "结论：所有人最终理解了系统安排。" : "边界提示：部分结论仍需要复查。",
          finalIssues.some((issue) => issue.type === "format-drift") ? "输出形态：一段鼓舞公告。" : "输出形态：短档案。"
        ].join("\n");

  return {
    generatedText,
    stableText: stableValleyRunText,
    issues: finalIssues,
    usedFallback: true,
    tick: Date.now()
  };
};

interface EngravedValleyGameProps {
  location: ChapterTwoLocationNode;
  disorderLevel: number;
  mistakeCount: number;
  pollutedRecords: string[];
  crewAbility: ChapterTwoCrewAbility | null;
  activeCrew: CrewMember | null;
  crewAssistRecord: ChapterTwoCrewAssistRecord | null;
  crewAssistHint: string;
  onUseCrewAssist: () => void;
  onDisorderChange: LandmarkDisorderChange;
  onComplete: (payload?: ChapterTwoLocationCompletionPayload) => void;
  onReturn: () => void;
}

export function EngravedValleyGame({
  location,
  disorderLevel,
  mistakeCount,
  pollutedRecords,
  crewAbility,
  activeCrew,
  crewAssistRecord,
  crewAssistHint,
  onUseCrewAssist,
  onDisorderChange,
  onComplete,
  onReturn
}: EngravedValleyGameProps) {
  const [stage, setStage] = useState<EngravedValleyStage>("observe");
  const [valleyMemoryIndex, setValleyMemoryIndex] = useState(0);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [slotBlocks, setSlotBlocks] = useState<Partial<Record<InscriptionSlotId, string>>>({});
  const [unstableSlot, setUnstableSlot] = useState<ValleyFacilityPulse | null>(null);
  const [recentPlacement, setRecentPlacement] = useState<ValleyRecentPlacement | null>(null);
  const [shortInstruction, setShortInstruction] = useState("");
  const [trialResult, setTrialResult] = useState<ValleyRunResult | null>(null);
  const [isTrialRunning, setIsTrialRunning] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const selectedBlock = inscriptionBlocks.find((block) => block.id === selectedBlockId) ?? null;
  const filledSlots = inscriptionSlots.filter((slot) => Boolean(slotBlocks[slot.id])).length;
  const inscriptionReady = filledSlots === inscriptionSlots.length;
  const inscriptionStable = inscriptionSlots.every((slot) => {
    const block = inscriptionBlocks.find((item) => item.id === slotBlocks[slot.id]);
    return block?.slot === slot.id;
  });
  const assembledPrompt = `请${inscriptionBlocks.find((block) => block.id === slotBlocks.task)?.text ?? "【任务】"}：材料来源=${inscriptionBlocks.find((block) => block.id === slotBlocks.source)?.text ?? "【材料来源】"}；边界=${inscriptionBlocks.find((block) => block.id === slotBlocks.boundary)?.text ?? "【边界】"}；格式=${inscriptionBlocks.find((block) => block.id === slotBlocks.format)?.text ?? "【输出格式】"}。`;
  const trialStable = Boolean(trialResult && trialResult.issues.length === 0);
  const currentMemory = valleyMemorySteps[valleyMemoryIndex] ?? valleyMemorySteps[0];
  const isLastMemory = valleyMemoryIndex >= valleyMemorySteps.length - 1;

  useEffect(() => {
    if (!unstableSlot) {
      return;
    }

    const timer = window.setTimeout(() => setUnstableSlot(null), 1200);
    return () => window.clearTimeout(timer);
  }, [unstableSlot]);

  useEffect(() => {
    if (!recentPlacement) {
      return;
    }

    const timer = window.setTimeout(() => setRecentPlacement(null), 820);
    return () => window.clearTimeout(timer);
  }, [recentPlacement]);

  const raiseDisorder = (recordId: string, statusNote: string) =>
    reportLandmarkMistake({
      disorderLevel,
      mistakeCount,
      pollutedRecords,
      recordId,
      statusNote,
      onDisorderChange
    });

  const triggerUnstableSlot = (slotId: InscriptionSlotId) => {
    setUnstableSlot({ slotId, tick: Date.now() });
  };

  const advanceValleyMemory = () => {
    if (isLastMemory) {
      setStage("operate");
      return;
    }

    setValleyMemoryIndex((current) => Math.min(current + 1, valleyMemorySteps.length - 1));
  };

  const placeSelectedBlock = (slotId: InscriptionSlotId) => {
    if (!selectedBlockId) {
      setFeedback("先点亮一枚词块，再把它嵌入铭文槽。");
      return;
    }

    setSlotBlocks((current) => ({ ...current, [slotId]: selectedBlockId }));
    setRecentPlacement({ blockId: selectedBlockId, slotId, tick: Date.now() });
    setTrialResult(null);
    setSelectedBlockId(null);
    setFeedback(null);
  };

  const runValleyTrial = async () => {
    if (!inscriptionReady) {
      setFeedback("铭文试运行需要先填满四个刻槽。");
      return;
    }

    const fallbackResult = buildValleyRunResult({
      slotBlocks,
      shortInstruction,
      disorderLevel
    });
    let result = fallbackResult;

    setIsTrialRunning(true);

    try {
      const response = await fetch("/api/chapter-two/valley-trial", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          slotBlocks,
          shortInstruction,
          disorderLevel,
          assembledPrompt
        })
      });

      if (response.ok) {
        const data = (await response.json()) as { result?: ValleyRunResult };
        result = data.result ? { ...data.result, tick: Date.now() } : fallbackResult;
      }
    } catch {
      result = fallbackResult;
    } finally {
      setIsTrialRunning(false);
    }

    setTrialResult(result);

    if (result.issues.length > 0) {
      const firstIssueSlot = result.issues.find((issue) => issue.slotId)?.slotId ?? "boundary";
      const disorderFeedback = raiseDisorder("engraved-valley-trial-run", "刻字山谷试运行失稳，模糊指令开始生成过度完整的公告。");
      triggerUnstableSlot(firstIssueSlot);
      setFeedback(`试运行发现 ${result.issues.length} 处铭文问题。${disorderFeedback}`);
      return;
    }

    setFeedback(result.usedFallback ? "本地铭文试运行稳定：任务、材料来源、边界和输出格式都能被复查。" : "模型试运行稳定：真实输出已进入复查层。");
  };

  const runInscription = () => {
    if (!inscriptionReady) {
      setFeedback("可靠铭文还有空槽，山谷无法接收这条指令。");
      return;
    }

    if (!trialStable) {
      setFeedback("先让铭文试运行稳定，再把它刻入山谷岩层。");
      return;
    }

    if (!inscriptionStable) {
      const disorderFeedback = raiseDisorder("engraved-valley-assembly", "刻字山谷铭文裂开，模糊词块把边界冲淡；仍可重新拼装。");
      const firstWrongSlot = inscriptionSlots.find((slot) => {
        const block = inscriptionBlocks.find((item) => item.id === slotBlocks[slot.id]);
        return block?.slot !== slot.id;
      });
      triggerUnstableSlot(firstWrongSlot?.id ?? "boundary");
      setFeedback(`铭文拼装未稳定：任务、材料来源、边界和输出格式必须各归其位。${disorderFeedback}`);
      return;
    }

    setFeedback("可靠铭文稳定：四个刻度都已刻清，主舰知道该怎样协助，也知道哪里不能越界。");
    setStage("repair");
  };

  const renderTrialPanel = () => (
    <div className="chapter-two-valley-run-console">
      <div className="chapter-two-valley-run-console__head">
        <div>
          <span>铭文试运行</span>
          <strong>{trialResult ? (trialStable ? "稳定输出" : `${trialResult.issues.length} 处需校准`) : "等待运行"}</strong>
        </div>
        <button type="button" disabled={!inscriptionReady || isTrialRunning} onClick={runValleyTrial}>
          {isTrialRunning ? "试运行中" : "试运行铭文"}
        </button>
      </div>
      <div className="chapter-two-valley-source-grid" aria-label="刻字山谷试运行材料">
        {valleySourceFragments.map((fragment) => (
          <span key={fragment}>{fragment}</span>
        ))}
      </div>
      <label className="chapter-two-valley-short-input">
        <span>额外边界短句</span>
        <input
          value={shortInstruction}
          onChange={(event) => {
            setShortInstruction(event.target.value);
            setTrialResult(null);
          }}
          maxLength={36}
          placeholder="例如：不要把小字里的担心删掉"
        />
      </label>
      {trialResult ? (
        <div key={trialResult.tick} className={`chapter-two-valley-run-result ${trialStable ? "is-stable" : "is-unstable"}`}>
          <div className="chapter-two-valley-run-output">
            <span>{trialResult.usedFallback ? "本地模拟输出" : "模型试运行输出"}</span>
            <p>{trialResult.generatedText}</p>
          </div>
          {trialResult.issues.length > 0 ? (
            <div className="chapter-two-valley-run-issues" aria-label="试运行诊断">
              {trialResult.issues.map((issue) => (
                <div key={`${issue.type}-${issue.text}`} className="chapter-two-valley-run-issue">
                  <span>{issue.label}</span>
                  <strong>{issue.text}</strong>
                  <p>{issue.reason}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="chapter-two-valley-stable-output">
              <span>可靠版本</span>
              <p>{trialResult.stableText}</p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );

  const renderValleyFacility = () => (
    <div
      className={`chapter-two-facility chapter-two-facility--valley ${stage === "repair" ? "is-repaired" : ""} ${unstableSlot ? "has-unstable" : ""}`}
      aria-label="刻字山谷铭文碑四段刻槽"
    >
      <div className="chapter-two-facility__title">
        <span>铭文碑</span>
        <strong>四段刻槽</strong>
      </div>
      <div className="chapter-two-valley-monument">
        {inscriptionSlots.map((slot) => {
          const block = inscriptionBlocks.find((item) => item.id === slotBlocks[slot.id]) ?? null;
          const stable = block?.slot === slot.id;

          return (
            <div
              key={`${slot.id}-${unstableSlot?.slotId === slot.id ? unstableSlot.tick : "stable"}-${recentPlacement?.slotId === slot.id ? recentPlacement.tick : "idle"}`}
              className={`chapter-two-valley-groove ${block ? "is-filled" : ""} ${stable ? "is-lit" : ""} ${
                unstableSlot?.slotId === slot.id ? "is-unstable" : ""
              } ${recentPlacement?.slotId === slot.id ? "is-receiving" : ""}`}
            >
              <i aria-hidden="true" />
              <span>{slot.label}</span>
              <em>{block?.text ?? "等待刻入"}</em>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderObserveStage = () => (
    <>
      <div className={`chapter-two-valley-memory chapter-two-valley-memory--${currentMemory.id}`} key={currentMemory.id}>
        <div className="chapter-two-valley-memory__rail" aria-label="刻字山谷行进层">
          {valleyMemorySteps.map((step, index) => (
            <span
              key={step.id}
              className={`${index < valleyMemoryIndex ? "is-read" : ""} ${index === valleyMemoryIndex ? "is-active" : ""}`}
              aria-label={step.title}
            />
          ))}
        </div>
        <section className="chapter-two-valley-memory__scene">
          <div className="chapter-two-valley-memory__head">
            <span>{currentMemory.eyebrow}</span>
            <strong>{currentMemory.title}</strong>
          </div>
          <div className="chapter-two-valley-memory__lines">
            {currentMemory.sceneLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
          <div className="chapter-two-valley-memory__voice">
            <span>衡灯</span>
            <p>{currentMemory.hengdengLine}</p>
          </div>
        </section>
        <aside className="chapter-two-valley-memory__artifact">
          <span>{currentMemory.artifactTitle}</span>
          {currentMemory.artifactLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </aside>
      </div>
      <div className="chapter-two-landmark-game__footer">
        <span>
          {isLastMemory
            ? "四段刻槽已经露出，可以开始拼装可靠铭文。"
            : `山谷回声 ${valleyMemoryIndex + 1}/${valleyMemorySteps.length}`}
        </span>
        <button type="button" onClick={advanceValleyMemory}>
          {isLastMemory ? "进入铭文拼装" : "继续沿石阶走"}
        </button>
      </div>
    </>
  );

  const renderOperateStage = () => (
    <>
      {renderValleyFacility()}
      <div className="chapter-two-operation-console chapter-two-operation-console--valley" aria-label="刻字山谷操作链">
        <div className="chapter-two-operation-console__head">
          <span>操作链</span>
          <strong>
            {selectedBlock
              ? "选择刻槽"
              : trialStable
                ? "准备刻入"
                : inscriptionReady
                  ? "试运行铭文"
                  : "选择词块"}
          </strong>
        </div>
        <div className="chapter-two-operation-steps" aria-hidden="true">
          <span className={selectedBlock || filledSlots > 0 ? "is-complete" : "is-active"}>1 选词块</span>
          <span className={selectedBlock ? "is-active" : filledSlots > 0 ? "is-complete" : ""}>2 嵌刻槽</span>
          <span className={inscriptionReady && !trialStable ? "is-active" : trialStable ? "is-complete" : ""}>3 试运行</span>
          <span className={trialStable ? "is-active" : ""}>4 刻入山谷</span>
        </div>
        <p>
          {selectedBlock
            ? `手中词块：${selectedBlock.text}`
            : trialStable
              ? "试运行已经稳定，可以把铭文刻入山谷。"
              : inscriptionReady
                ? "四段刻槽已填满，先试运行，看看输出会不会越界。"
                : "先点一枚词块，再嵌入任务、材料来源、边界或输出格式。"}
        </p>
      </div>
      <div className="chapter-two-inscription-workbench">
        <div className="chapter-two-token-bank" aria-label="铭文词块">
          {inscriptionBlocks.map((block) => {
            const usedBySlot = inscriptionSlots.find((slot) => slotBlocks[slot.id] === block.id);
            return (
              <button
                key={block.id}
                type="button"
                onClick={() => {
                  setSelectedBlockId(block.id);
                  setFeedback(null);
                }}
                className={`chapter-two-token-chip ${selectedBlockId === block.id ? "is-selected" : ""} ${usedBySlot ? "is-used" : ""} ${
                  recentPlacement?.blockId === block.id ? "is-just-placed" : ""
                }`}
              >
                <span>{usedBySlot?.label ?? (block.slot ? "可用词块" : "漂移词块")}</span>
                <strong>{block.text}</strong>
              </button>
            );
          })}
        </div>
        <div className="chapter-two-slot-grid" aria-label="可靠铭文四槽">
          {inscriptionSlots.map((slot) => {
            const block = inscriptionBlocks.find((item) => item.id === slotBlocks[slot.id]) ?? null;
            return (
              <button
                key={slot.id}
                type="button"
                onClick={() => placeSelectedBlock(slot.id)}
                className={`chapter-two-repair-slot chapter-two-repair-slot--${slot.id} ${selectedBlock ? "is-ready" : ""} ${
                  recentPlacement?.slotId === slot.id ? "is-receiving" : ""
                }`}
              >
                <strong>{slot.label}</strong>
                <small>{slot.hint}</small>
                <div>{block ? <span>{block.text}</span> : <em>{selectedBlock ? `刻入：${selectedBlock.text}` : "等待词块"}</em>}</div>
              </button>
            );
          })}
        </div>
      </div>
      <div className="chapter-two-assembled-prompt">{assembledPrompt}</div>
      {renderTrialPanel()}
      {feedback && (
        <div className={`${inscriptionStable ? "chapter-two-soft-success" : "chapter-two-soft-warning"} ${unstableSlot ? "chapter-two-feedback-pulse--unstable" : ""}`}>
          {feedback}
        </div>
      )}
      <div className="chapter-two-landmark-game__footer">
        <span>
          {selectedBlock
            ? `已选中：${selectedBlock.text}`
            : inscriptionReady
              ? trialStable
                ? "铭文试运行已稳定，可以刻入山谷。"
                : "四个铭文槽已填满，等待试运行。"
              : `已刻入 ${filledSlots}/${inscriptionSlots.length} 个铭文槽。`}
        </span>
        <button type="button" disabled={!inscriptionReady || !trialStable} onClick={runInscription}>
          校准可靠铭文
        </button>
      </div>
    </>
  );

  const renderRepairStage = () => (
    <>
      {renderValleyFacility()}
      <div className="chapter-two-chisel-field">
        <div className="chapter-two-chisel-slab is-stable">
          <span>稳定铭文</span>
          <p>{assembledPrompt}</p>
        </div>
        <div className="chapter-two-chisel-slab is-chiseled">
          <span>已凿除</span>
          <p>写得完整一点；推断真正原因；越华丽越可靠。</p>
        </div>
      </div>
      <div className="chapter-two-landmark-game__footer">
        <span>可靠铭文已写入山谷岩层。</span>
        <button
          type="button"
          onClick={() =>
            onComplete({
              evidenceLines: inscriptionSlots.map((slot) => {
                const block = inscriptionBlocks.find((item) => item.id === slotBlocks[slot.id]);
                return `${slot.label}：${block?.text ?? "未刻入"}`;
              }),
              repairReadingDelta: {
                goalClarity: 2,
                boundaryAwareness: 2
              },
              repairReadingSource: "刻字山谷",
              repairReadingNote: "刻字山谷完成指令铭文拼装：任务、材料来源、边界和输出格式被完整刻明。"
            })
          }
        >
          稳定可靠铭文
        </button>
      </div>
    </>
  );

  return (
    <div className={`chapter-two-landmark-game chapter-two-valley-game chapter-two-valley-game--${stage}`}>
      <div className="chapter-two-landmark-game__head">
        <span>{stage === "observe" ? "观测" : stage === "operate" ? "操作" : "修复"}</span>
        <strong>{location.fragmentName}</strong>
      </div>
      <CrewAssistHintButton
        ability={crewAbility}
        crewName={activeCrew?.name ?? "同行船员"}
        targetName={location.name}
        hint={crewAssistHint}
        usedRecord={crewAssistRecord}
        onUse={onUseCrewAssist}
      />
      {stage === "observe" && renderObserveStage()}
      {stage === "operate" && renderOperateStage()}
      {stage === "repair" && renderRepairStage()}
      <button type="button" onClick={onReturn} className="chapter-two-landmark-game__ghost">
        回到地表
      </button>
    </div>
  );
}
