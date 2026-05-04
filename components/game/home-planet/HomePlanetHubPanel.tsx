"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

import {
  commissionTasks,
  dialogueCharacters,
  getAdjustedHomePlanetStructureCost,
  getAdjustedMotherworldActivationCost,
  getHomePlanetExpeditionEffects,
  getHomePlanetStructureEffect,
  getMotherworldBaseEffects,
  homePlanetFeatures,
  homePlanetStructures,
  resolveHomePlanetUnlockedFeatures,
  storyboardActLabels
} from "@/lib/home-planet-hub";
import {
  canActivateMotherworldFeature,
  motherworldHotspots,
  motherworldMapAssets,
  motherworldPreviewFeatureIds,
  motherworldRevealPatches,
  type MotherworldBuildingStatus
} from "@/lib/motherworld-map";
import type {
  ChapterTwoLocationId,
  ClassroomImageAsset,
  CrewMember,
  GameState,
  HomePlanetCommissionWork,
  HomePlanetDialogueCard,
  HomePlanetFeatureId,
  HomePlanetStoryboardAct,
  HomePlanetStoryboardProject,
  HomePlanetStructureId
} from "@/types/game";

interface HomePlanetHubPanelProps {
  state: GameState;
  activeCrew: CrewMember | null;
  onReturn: () => void;
  onActivateFeature: (featureId: HomePlanetFeatureId) => void;
  onBuildStructure: (structureId: HomePlanetStructureId) => void;
  onSaveCommission: (work: Omit<HomePlanetCommissionWork, "id" | "createdAt">) => void;
  onSaveDialogue: (card: Omit<HomePlanetDialogueCard, "id" | "createdAt">) => void;
  onSaveStoryboard: (project: Omit<HomePlanetStoryboardProject, "id" | "createdAt">) => void;
}

function formatDate(timestamp?: number) {
  if (!timestamp) return "待归档";
  return new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(timestamp);
}

const chapterTwoLocationLabels: Partial<Record<ChapterTwoLocationId, string>> = {
  "evidence-well": "证据回声井",
  "archive-tower": "档案塔",
  "letter-port": "漂浮信件港",
  "engraved-valley": "刻字山谷",
  "paper-corridor": "纸光回廊",
  "blackbox-vault": "黑匣封存台"
};

function sortByNewest<T extends { createdAt: number }>(items: T[]) {
  return [...items].sort((a, b) => b.createdAt - a.createdAt);
}

function resolveLocationLabel(locationId?: ChapterTwoLocationId, fallback = "母星档案") {
  return locationId ? chapterTwoLocationLabels[locationId] ?? fallback : fallback;
}

function FeatureLockHint({ unlocked, requirement }: { unlocked: boolean; requirement: string }) {
  if (unlocked) return null;

  return (
    <div className="rounded-[22px] border border-amber-200/18 bg-amber-200/[0.06] p-4 text-sm leading-6 text-amber-50/78">
      这个建筑仍在休眠。解锁条件：{requirement}
    </div>
  );
}

interface MotherworldInteriorAction {
  id: string;
  label: string;
  verb: string;
  summary: string;
  status: "available" | "preview" | "pending";
  position: { x: number; y: number };
  size: { width: number; height: number; radius?: string };
}

const motherworldInteriorActions: Record<HomePlanetFeatureId, MotherworldInteriorAction[]> = {
  "civilization-gallery": [
    { id: "gallery-view", label: "展柜终端", verb: "观赏以前的创作", summary: "文明展厅正在调出最近保存的委托、对话和分镜作品。", status: "available", position: { x: 27, y: 73 }, size: { width: 40, height: 23, radius: "30px" } },
    { id: "gallery-crew", label: "伙伴投影", verb: "查看船员与母星", summary: "船员记录、母星模型和第二章归档会一起投射到展厅中央。", status: "available", position: { x: 66, y: 56 }, size: { width: 16, height: 22, radius: "999px" } },
    { id: "gallery-archive", label: "黑匣光柜", verb: "回看文明碎片", summary: "黑匣记录和语言星带回来的碎片被点亮，适合做航行复盘。", status: "available", position: { x: 52, y: 43 }, size: { width: 14, height: 24, radius: "34px" } }
  ],
  "planet-workshop": [
    { id: "workshop-build", label: "建造机械臂", verb: "开始建设", summary: "选择下方结构后，资源会被投入母星基础建筑。", status: "available", position: { x: 19, y: 41 }, size: { width: 25, height: 48, radius: "42px" } },
    { id: "workshop-core", label: "资源罐阵列", verb: "查看资源", summary: "水源、矿物、能源和碎片会决定哪些建筑可以被点亮。", status: "available", position: { x: 82, y: 36 }, size: { width: 23, height: 42, radius: "32px" } },
    { id: "workshop-model", label: "母星模型台", verb: "观察母星档案", summary: "第一章创建的星球特征会在工坊里变成建造蓝图。", status: "available", position: { x: 50, y: 65 }, size: { width: 35, height: 19, radius: "999px" } }
  ],
  "commission-board": [
    { id: "commission-start", label: "委托光屏", verb: "开始创作", summary: "选择一个委托，把你的输出保存成文明展厅里的作品。", status: "available", position: { x: 50, y: 42 }, size: { width: 29, height: 28, radius: "28px" } },
    { id: "commission-desk", label: "写作桌", verb: "整理作品", summary: "这里适合把请求、限制和输出形式写清楚。", status: "available", position: { x: 61, y: 69 }, size: { width: 34, height: 24, radius: "26px" } },
    { id: "commission-review", label: "评审灯", verb: "准备展示", summary: "作品保存后会进入展厅，方便回看和展示。", status: "available", position: { x: 90, y: 61 }, size: { width: 13, height: 34, radius: "32px" } }
  ],
  "character-dialogue-room": [
    { id: "dialogue-role", label: "角色座位", verb: "选择角色", summary: "先选一个人物和主题，再带着具体问题进入对话。", status: "available", position: { x: 24, y: 59 }, size: { width: 22, height: 28, radius: "999px" } },
    { id: "dialogue-question", label: "提问台", verb: "提出问题", summary: "问题越具体，越容易把对话变成自己的理解。", status: "available", position: { x: 50, y: 47 }, size: { width: 17, height: 22, radius: "999px" } },
    { id: "dialogue-review", label: "复盘环", verb: "记录收获", summary: "对话结束后写下收获卡，不把这里做成无限陪聊。", status: "available", position: { x: 50, y: 80 }, size: { width: 32, height: 22, radius: "999px" } }
  ],
  "animation-studio": [
    { id: "studio-script", label: "故事台", verb: "开始分镜", summary: "先写故事主题，再拆成开端、转折和结尾。", status: "available", position: { x: 30, y: 66 }, size: { width: 37, height: 24, radius: "26px" } },
    { id: "studio-rail", label: "镜头轨道", verb: "安排三幕", summary: "三幕卡片会帮助你把故事顺序排清楚。", status: "available", position: { x: 66, y: 80 }, size: { width: 25, height: 23, radius: "26px" } },
    { id: "studio-import", label: "画面导入口", verb: "导入图片", summary: "每一幕都可以导入外部生成或提前准备好的图片。", status: "available", position: { x: 91, y: 47 }, size: { width: 14, height: 30, radius: "32px" } }
  ],
  "civilization-archive": [
    { id: "archive-card", label: "知识卡墙", verb: "阅读原则", summary: "这里沉淀事实、推测、未知和表达方式的判断卡。", status: "available", position: { x: 20, y: 42 }, size: { width: 31, height: 45, radius: "30px" } },
    { id: "archive-blackbox", label: "黑匣资料台", verb: "查看证据", summary: "第二章黑匣记录会帮助你理解信息为什么要验证。", status: "available", position: { x: 50, y: 64 }, size: { width: 26, height: 22, radius: "28px" } },
    { id: "archive-rule", label: "文明刻印", verb: "记录自己的规则", summary: "后续可以把自己的例子和错误复盘补进这里。", status: "pending", position: { x: 84, y: 63 }, size: { width: 16, height: 33, radius: "999px" } }
  ],
  "crew-dormitory": [
    { id: "dorm-crew", label: "船员舱位", verb: "探望船员", summary: "船员是远征伙伴，会显示羁绊和参与过的任务。", status: "available", position: { x: 20, y: 53 }, size: { width: 29, height: 46, radius: "34px" } },
    { id: "dorm-window", label: "舷窗星图", verb: "回看远征", summary: "已完成的探索会在宿舍里留下共同经历。", status: "preview", position: { x: 56, y: 32 }, size: { width: 35, height: 25, radius: "32px" } },
    { id: "dorm-locker", label: "个人储物柜", verb: "查看伙伴记录", summary: "伙伴称号、信任标签和任务记录会归到这里。", status: "preview", position: { x: 89, y: 55 }, size: { width: 19, height: 43, radius: "26px" } }
  ],
  "expedition-planning": [
    { id: "plan-map", label: "星图桌", verb: "规划远征", summary: "出发前先写目标、风险和想带回来的记录。", status: "preview", position: { x: 51, y: 69 }, size: { width: 47, height: 31, radius: "999px" } },
    { id: "plan-route", label: "路线投影", verb: "选择路线", summary: "后续章节可以把不同星球路线接入这里。", status: "pending", position: { x: 50, y: 36 }, size: { width: 24, height: 27, radius: "999px" } },
    { id: "plan-review", label: "复盘板", verb: "准备回来后的记录", summary: "远征不是只看结果，回来后的复盘也会成为母星成长材料。", status: "preview", position: { x: 83, y: 36 }, size: { width: 27, height: 34, radius: "28px" } }
  ]
};

const actionStatusLabels: Record<MotherworldInteriorAction["status"], string> = {
  available: "可用",
  preview: "预览",
  pending: "待接入"
};

export function HomePlanetHubPanel({
  state,
  activeCrew,
  onReturn,
  onActivateFeature,
  onBuildStructure,
  onSaveCommission,
  onSaveDialogue,
  onSaveStoryboard
}: HomePlanetHubPanelProps) {
  const unlockedFeatures = useMemo(() => resolveHomePlanetUnlockedFeatures(state), [state]);
  const activeFeatures = useMemo(() => new Set(state.homePlanetHub.activeFeatures ?? []), [state.homePlanetHub.activeFeatures]);
  const [selectedFeature, setSelectedFeature] = useState<HomePlanetFeatureId | null>(null);
  const [hoveredFeature, setHoveredFeature] = useState<HomePlanetFeatureId | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState(commissionTasks[0]?.id ?? "");
  const [commissionOutput, setCommissionOutput] = useState("");
  const [dialogueCharacterId, setDialogueCharacterId] = useState(dialogueCharacters[0]?.id ?? "");
  const [dialogueQuestion, setDialogueQuestion] = useState("");
  const [dialogueTakeaway, setDialogueTakeaway] = useState("");
  const [storyTitle, setStoryTitle] = useState("");
  const [recentBuiltStructure, setRecentBuiltStructure] = useState<HomePlanetStructureId | null>(null);
  const [recentSavedType, setRecentSavedType] = useState<"commission" | "dialogue" | "storyboard" | null>(null);
  const [recentActivatedFeature, setRecentActivatedFeature] = useState<HomePlanetFeatureId | null>(null);
  const [enteringFeature, setEnteringFeature] = useState<HomePlanetFeatureId | null>(null);
  const [enteredFeature, setEnteredFeature] = useState<HomePlanetFeatureId | null>(null);
  const [activeInteriorActionId, setActiveInteriorActionId] = useState<string | null>(null);
  const [hintedInteriorFeature, setHintedInteriorFeature] = useState<HomePlanetFeatureId | null>(null);
  const hintedInteriorFeaturesRef = useRef(new Set<HomePlanetFeatureId>());
  const [storyActs, setStoryActs] = useState<Record<HomePlanetStoryboardAct["id"], { text: string; imageAsset: ClassroomImageAsset | null }>>({
    opening: { text: "", imageAsset: null },
    turn: { text: "", imageAsset: null },
    ending: { text: "", imageAsset: null }
  });

  const motherPlanet = state.signalMission.planet.confirmedModel ?? state.planetCatalog[0] ?? null;
  const resources = state.homePlanetHub.resources;
  const baseEffects = useMemo(() => getMotherworldBaseEffects(state), [state]);
  const expeditionEffects = useMemo(() => getHomePlanetExpeditionEffects(state), [state]);
  const selectedConfig = selectedFeature ? homePlanetFeatures.find((feature) => feature.id === selectedFeature) ?? null : null;
  const selectedHotspot = selectedFeature ? motherworldHotspots.find((hotspot) => hotspot.id === selectedFeature) ?? null : null;
  const selectedActivationCost = selectedHotspot ? getAdjustedMotherworldActivationCost(state, selectedHotspot.activationCost) : null;
  const selectedTask = commissionTasks.find((task) => task.id === selectedTaskId) ?? commissionTasks[0];
  const selectedDialogueCharacter = dialogueCharacters.find((character) => character.id === dialogueCharacterId) ?? dialogueCharacters[0];
  const chapterTwoOutcome = state.chapterTwo.outcome;
  const recentLocationRewardClaims = useMemo(() => sortByNewest(state.chapterTwo.locationRewardClaims), [state.chapterTwo.locationRewardClaims]);
  const recentArchiveRecords = useMemo(() => sortByNewest(state.homePlanetHub.archiveRecords), [state.homePlanetHub.archiveRecords]);
  const recentRuleCards = useMemo(() => sortByNewest(state.homePlanetHub.ruleCards), [state.homePlanetHub.ruleCards]);

  const getFeatureStatus = (featureId: HomePlanetFeatureId): MotherworldBuildingStatus => {
    const canPreview = motherworldPreviewFeatureIds.includes(featureId);
    const unlocked = unlockedFeatures.includes(featureId) || canPreview;
    if (!unlocked) return "locked";
    return activeFeatures.has(featureId) ? "active" : "unlocked";
  };

  const selectedStatus = selectedFeature ? getFeatureStatus(selectedFeature) : null;
  const selectedUnlocked = selectedStatus === "unlocked" || selectedStatus === "active";
  const selectedActive = selectedStatus === "active";
  const selectedCanActivate =
    Boolean(selectedHotspot) &&
    Boolean(selectedActivationCost) &&
    selectedStatus === "unlocked" &&
    canActivateMotherworldFeature(resources, selectedActivationCost!);
  const previewHotspot = hoveredFeature ? motherworldHotspots.find((hotspot) => hotspot.id === hoveredFeature) ?? null : null;
  const previewStatus = previewHotspot ? getFeatureStatus(previewHotspot.id) : null;
  const enteringHotspot = enteringFeature ? motherworldHotspots.find((hotspot) => hotspot.id === enteringFeature) ?? null : null;
  const enteredHotspot = enteredFeature ? motherworldHotspots.find((hotspot) => hotspot.id === enteredFeature) ?? null : null;
  const enteredConfig = enteredFeature ? homePlanetFeatures.find((feature) => feature.id === enteredFeature) ?? null : null;
  const interiorActions = enteredFeature ? motherworldInteriorActions[enteredFeature] : [];
  const activeInteriorAction = interiorActions.find((action) => action.id === activeInteriorActionId) ?? null;

  useEffect(() => {
    if (!enteredFeature || hintedInteriorFeaturesRef.current.has(enteredFeature)) return;

    setHintedInteriorFeature(enteredFeature);
    hintedInteriorFeaturesRef.current.add(enteredFeature);

    const timer = window.setTimeout(() => {
      setHintedInteriorFeature((current) => (current === enteredFeature ? null : current));
    }, 1500);

    return () => window.clearTimeout(timer);
  }, [enteredFeature]);

  const readStoryboardImage = (actId: HomePlanetStoryboardAct["id"], file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setStoryActs((current) => ({
        ...current,
        [actId]: {
          ...current[actId],
          imageAsset: {
            imageUrl: String(reader.result),
            fileName: file.name,
            kind: "chapter",
            ownerId: `home-storyboard-${actId}`,
            updatedAt: Date.now()
          }
        }
      }));
    };
    reader.readAsDataURL(file);
  };

  const saveCommission = () => {
    if (!selectedTask || !commissionOutput.trim()) return;
    setRecentSavedType("commission");
    onSaveCommission({
      taskId: selectedTask.id,
      title: selectedTask.title,
      ability: selectedTask.ability,
      output: commissionOutput.trim()
    });
    setCommissionOutput("");
    window.setTimeout(() => setRecentSavedType(null), 1300);
  };

  const saveDialogue = () => {
    if (!selectedDialogueCharacter || !dialogueQuestion.trim() || !dialogueTakeaway.trim()) return;
    setRecentSavedType("dialogue");
    onSaveDialogue({
      character: selectedDialogueCharacter.name,
      theme: selectedDialogueCharacter.theme,
      question: dialogueQuestion.trim(),
      takeaway: dialogueTakeaway.trim()
    });
    setDialogueQuestion("");
    setDialogueTakeaway("");
    window.setTimeout(() => setRecentSavedType(null), 1300);
  };

  const saveStoryboard = () => {
    const acts = storyboardActLabels.map((act) => ({
      id: act.id,
      label: act.label,
      text: storyActs[act.id].text.trim(),
      imageAsset: storyActs[act.id].imageAsset
    }));
    if (!storyTitle.trim() || acts.every((act) => !act.text)) return;

    setRecentSavedType("storyboard");
    onSaveStoryboard({
      title: storyTitle.trim(),
      acts
    });
    setStoryTitle("");
    setStoryActs({
      opening: { text: "", imageAsset: null },
      turn: { text: "", imageAsset: null },
      ending: { text: "", imageAsset: null }
    });
    window.setTimeout(() => setRecentSavedType(null), 1300);
  };

  const buildStructure = (structureId: HomePlanetStructureId) => {
    setRecentBuiltStructure(structureId);
    onBuildStructure(structureId);
    window.setTimeout(() => setRecentBuiltStructure(null), 1300);
  };

  const activateFeature = () => {
    if (!selectedFeature || !selectedHotspot || selectedStatus !== "unlocked") return;
    setRecentActivatedFeature(selectedFeature);
    onActivateFeature(selectedFeature);
    window.setTimeout(() => setRecentActivatedFeature(null), 1500);
  };

  const openFeature = (featureId: HomePlanetFeatureId) => {
    setSelectedFeature(featureId);
    setActiveInteriorActionId(null);

    if (getFeatureStatus(featureId) !== "active") {
      return;
    }

    setEnteringFeature(featureId);
    window.setTimeout(() => {
      setEnteredFeature(featureId);
      setEnteringFeature(null);
    }, 520);
  };

  const closeInterior = () => {
    setEnteredFeature(null);
    setSelectedFeature(null);
    setActiveInteriorActionId(null);
    setHintedInteriorFeature(null);
  };

  const closeInteriorAction = () => {
    setActiveInteriorActionId(null);
  };

  const renderGalleryList = () => (
    <section className="motherworld-section home-planet-gallery-list">
      <div className="motherworld-section__title">最近作品</div>
      {state.homePlanetHub.galleryItems.length === 0 ? (
        <p className="mt-3 text-sm text-white/46">委托作品、对话收获卡和分镜册会出现在这里。</p>
      ) : (
        state.homePlanetHub.galleryItems.slice(0, 6).map((item) => (
          <div key={item.id} className="home-planet-gallery-item">
            <span>{item.type === "commission" ? "委托" : item.type === "dialogue" ? "对话" : "分镜"}</span>
            <strong>{item.title}</strong>
            <p>{item.summary}</p>
            <small>{formatDate(item.createdAt)}</small>
          </div>
        ))
      )}
    </section>
  );

  const renderGalleryCrewSummary = () => (
    <div className="motherworld-card-grid motherworld-card-grid--four">
      <div className="home-planet-info-card">
        <span>我的船员</span>
        <strong>{activeCrew?.name ?? state.crewRoster[0]?.name ?? "等待第一位伙伴"}</strong>
        <p>{activeCrew?.title ?? "船员会作为任务伙伴参与远征，而不是无限陪聊。"}</p>
      </div>
      <div className="home-planet-info-card">
        <span>我的母星</span>
        <strong>{motherPlanet?.name ?? "第一母星"}</strong>
        <p>{motherPlanet?.summary ?? "完成第一章后，这里会显示你亲手定义的星球模型。"}</p>
      </div>
      <div className="home-planet-info-card">
        <span>第二章记录</span>
        <strong>{chapterTwoOutcome?.planetName ?? "语言与信息文明星"}</strong>
        <p>{chapterTwoOutcome ? "黑匣记录、最后一封信与文明碎片已归档。" : "完成第二章后会出现复苏记录。"}</p>
      </div>
      <div className="home-planet-info-card">
        <span>AI 模块</span>
        <strong>{chapterTwoOutcome?.unlockedModule ?? "等待第一项文明技术"}</strong>
        <p>{chapterTwoOutcome?.aiUpgrade ?? "外部星球学到的能力，会回流到飞船和母星。"}</p>
      </div>
    </div>
  );

  const renderGalleryArchive = () => (
    <div className="motherworld-workbench">
      <div className="motherworld-card-grid motherworld-card-grid--four">
        <div className="home-planet-info-card">
          <span>黑匣记录</span>
          <strong>{chapterTwoOutcome?.blackBoxTitle ?? "语言黑匣待开启"}</strong>
          <p>{chapterTwoOutcome?.civilizationRecord ?? chapterTwoOutcome?.logSummary ?? "完成第二章后，黑匣证据和文明记录会在这里归档。"}</p>
        </div>
        <div className="home-planet-info-card">
          <span>文明碎片</span>
          <strong>{chapterTwoOutcome?.fragments?.length ?? resources.fragments} 枚</strong>
          <p>{chapterTwoOutcome?.fragments?.join(" / ") ?? "语言星碎片会帮助母星继续点亮建筑。"}</p>
        </div>
        <div className="home-planet-info-card">
          <span>复苏结果</span>
          <strong>{chapterTwoOutcome?.title ?? "等待远征结果"}</strong>
          <p>{chapterTwoOutcome?.worldChange ?? "第二章完成后，会记录外部星球发生了什么变化。"}</p>
        </div>
        <div className="home-planet-info-card">
          <span>最后一封信</span>
          <strong>{chapterTwoOutcome?.defeatedEcho ? "失序回声已安静" : "信件未归档"}</strong>
          <p>{chapterTwoOutcome?.finalLetter?.join(" ") ?? "你带回来的提醒会成为下一次探索前的安全灯。"}</p>
        </div>
      </div>
    </div>
  );

  const renderWorkshopBuild = () => (
    <div className="motherworld-card-grid motherworld-card-grid--structures">
      {homePlanetStructures.map((structure) => {
        const built = state.homePlanetHub.builtStructures.includes(structure.id);
        const adjustedCost = getAdjustedHomePlanetStructureCost(state, structure);
        const effect = getHomePlanetStructureEffect(structure.id);
        const affordable = resources.water >= adjustedCost.water && resources.minerals >= adjustedCost.minerals && resources.energy >= adjustedCost.energy;
        const costDiscountNotes = [
          adjustedCost.water < structure.cost.water ? "水源充足已减免" : null,
          adjustedCost.minerals < structure.cost.minerals ? "矿物充足已减免" : null
        ].filter(Boolean);
        return (
          <div
            key={structure.id}
            className={`home-planet-build-card ${built ? "home-planet-build-card--built" : ""} ${
              recentBuiltStructure === structure.id ? "home-planet-build-card--unlocking" : ""
            }`}
          >
            <div>
              <span>{built ? "已建成" : "可建设"}</span>
              <strong>{structure.name}</strong>
              <p>{structure.description}</p>
              <small>
                水源 {adjustedCost.water} / 矿物 {adjustedCost.minerals} / 能源 {adjustedCost.energy}
                {costDiscountNotes.length > 0 ? ` · ${costDiscountNotes.join(" · ")}` : ""}
              </small>
              {effect ? (
                <p className="mt-2 text-xs leading-5 text-cyan-100/68">
                  {built ? effect.activeSummary : effect.inactiveSummary}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              disabled={built || !affordable}
              onClick={() => buildStructure(structure.id)}
              className="rounded-full border border-cyan-200/20 bg-cyan-200/[0.10] px-4 py-2 text-xs font-semibold text-cyan-50 transition hover:bg-cyan-200/[0.16] disabled:cursor-not-allowed disabled:border-white/8 disabled:bg-white/[0.04] disabled:text-white/36"
            >
              {built ? "已点亮" : affordable ? "消耗资源建设" : "资源不足"}
            </button>
          </div>
        );
      })}
    </div>
  );

  const renderWorkshopCore = () => (
    <div className="motherworld-workbench">
      <div className="home-planet-resource-grid">
        {[
          ["水源", resources.water, baseEffects.waterFlow ? "激活与建设水源消耗 -1。" : "维持生态与记忆花园。"],
          ["矿物", resources.minerals, baseEffects.mineralDiscount ? "建筑矿物成本降低。" : "搭建档案馆、观测台和工坊结构。"],
          ["能源", resources.energy, baseEffects.energyBuffer ? "第二章初始失序降低。" : "让建筑内部灯光和设备保持响应。"],
          ["文明碎片", resources.fragments, "来自第二章的证据与表达碎片。"],
          ["科技点", state.technologyPoints, "主舰 AI 模块升级后的长期能力。"]
        ].map(([label, value, note]) => (
          <div key={label} className="home-planet-resource-card">
            <span>{label}</span>
            <strong>{value}</strong>
            <p className="mt-3 text-sm leading-6 text-white/52">{note}</p>
          </div>
        ))}
      </div>
      <div className="motherworld-inline-note">
        {baseEffects.notes.length > 0 ? baseEffects.notes.join(" ") : "母星资源会影响建筑成本、远征初始失序、扫描提示和共同经历成长。"}
      </div>
    </div>
  );

  const renderWorkshopModel = () => (
    <div className="motherworld-workbench">
      <section className="motherworld-section home-planet-info-card">
        <span>母星档案</span>
        <strong>{motherPlanet?.name ?? "第一母星"}</strong>
        <p>{motherPlanet?.summary ?? "完成第一章后，这里会显示你亲手定义的星球模型。"}</p>
      </section>
      <div className="motherworld-card-grid motherworld-card-grid--four">
        <div className="home-planet-info-card">
          <span>环境特征</span>
          <strong>{motherPlanet?.environmentTrait ?? "等待建模"}</strong>
          <p>这个特征会影响后续母星建筑的故事方向。</p>
        </div>
        <div className="home-planet-info-card">
          <span>标志地标</span>
          <strong>{motherPlanet?.landmarkFeature ?? "标志性建筑仍待补完"}</strong>
          <p>地标会成为创作和远征记录的主要入口。</p>
        </div>
        <div className="home-planet-info-card">
          <span>资源分布</span>
          <strong>
            水 {motherPlanet?.resourceProfile.water ?? resources.water} / 矿 {motherPlanet?.resourceProfile.mineral ?? resources.minerals} / 能{" "}
            {motherPlanet?.resourceProfile.energy ?? resources.energy}
          </strong>
          <p>
            生态 {motherPlanet?.resourceProfile.ecology ?? 0} / 遗迹数据 {motherPlanet?.resourceProfile.relicData ?? 0}
          </p>
        </div>
        <div className="home-planet-info-card">
          <span>探索线索</span>
          <strong>{motherPlanet?.dangerLabel ?? "安全等级待评估"}</strong>
          <p>{motherPlanet?.explorationHooks?.slice(0, 2).join(" / ") || "后续远征会从这里抽取目标和风险。"}</p>
        </div>
      </div>
      <section className="motherworld-section home-planet-info-card">
        <span>远征准备影响</span>
        <strong>{expeditionEffects.notes.length > 0 ? `${expeditionEffects.notes.length} 项已接入` : "等待基地结构接入"}</strong>
        <p>
          {expeditionEffects.notes.length > 0
            ? expeditionEffects.notes.join(" ")
            : "建造档案馆、观测台、能源核心、记忆花园或创作屋后，会影响证据记录、扫描、失序强度和共同经历。"}
        </p>
      </section>
    </div>
  );

  const renderCommissionTasks = () => (
    <div className="motherworld-card-grid motherworld-card-grid--tasks">
      {commissionTasks.map((task) => (
        <button
          key={task.id}
          type="button"
          onClick={() => setSelectedTaskId(task.id)}
          className={`home-planet-task-card ${selectedTaskId === task.id ? "home-planet-task-card--selected" : ""}`}
        >
          <span>{task.ability}</span>
          <strong>{task.title}</strong>
          <p>{task.goal}</p>
        </button>
      ))}
    </div>
  );

  const renderCommissionDesk = () => (
    <section className="motherworld-section home-planet-form-card">
      <label>你的输出</label>
      <textarea value={commissionOutput} onChange={(event) => setCommissionOutput(event.target.value)} placeholder={selectedTask?.placeholder} />
    </section>
  );

  const renderCommissionReview = () => (
    <div className="motherworld-workbench">
      <div className="home-planet-info-card">
        <span>当前委托</span>
        <strong>{selectedTask?.title ?? "还没有选择委托"}</strong>
        <p>{selectedTask ? `${selectedTask.ability}：${selectedTask.goal}` : "先到委托光屏选择一个任务，再来评审灯前保存。"}</p>
      </div>
      <section className="motherworld-section home-planet-form-card">
        <label>准备归档的作品</label>
        <textarea value={commissionOutput} onChange={(event) => setCommissionOutput(event.target.value)} placeholder={selectedTask?.placeholder} />
        <button type="button" disabled={!unlockedFeatures.includes("commission-board") || !commissionOutput.trim()} onClick={saveCommission}>
          {recentSavedType === "commission" ? "已保存到文明展厅" : "保存到文明展厅"}
        </button>
      </section>
    </div>
  );

  const renderDialogueRoles = () => (
    <div className="motherworld-card-grid motherworld-card-grid--tasks">
      {dialogueCharacters.map((character) => (
        <button
          key={character.id}
          type="button"
          onClick={() => setDialogueCharacterId(character.id)}
          className={`home-planet-task-card ${dialogueCharacterId === character.id ? "home-planet-task-card--selected" : ""}`}
        >
          <span>{character.theme}</span>
          <strong>{character.name}</strong>
          <p>先提出问题，再记录收获。这里不是无限陪聊。</p>
        </button>
      ))}
    </div>
  );

  const renderDialogueQuestion = () => (
    <section className="motherworld-section home-planet-form-card">
      <label>我想问的问题</label>
      <textarea value={dialogueQuestion} onChange={(event) => setDialogueQuestion(event.target.value)} placeholder="我想问：怎样才能……" />
      <div className="home-planet-info-card">
        <span>当前角色</span>
        <strong>{selectedDialogueCharacter?.name ?? "还没有选择角色"}</strong>
        <p>{selectedDialogueCharacter?.theme ?? "先选择一个角色，问题会更容易聚焦。"}</p>
      </div>
    </section>
  );

  const renderDialogueReview = () => (
    <section className="motherworld-section home-planet-form-card">
      <label>对话后的收获</label>
      <textarea value={dialogueTakeaway} onChange={(event) => setDialogueTakeaway(event.target.value)} placeholder="我听完后发现……下一次我会……" />
      <button type="button" disabled={!unlockedFeatures.includes("character-dialogue-room") || !dialogueQuestion.trim() || !dialogueTakeaway.trim()} onClick={saveDialogue}>
        {recentSavedType === "dialogue" ? "收获卡已保存" : "保存对话收获卡"}
      </button>
    </section>
  );

  const renderStoryboardScript = () => (
    <section className="motherworld-section home-planet-form-card">
      <label>故事主题</label>
      <input value={storyTitle} onChange={(event) => setStoryTitle(event.target.value)} placeholder="比如：一封没有寄出的星际信" />
      <div className="motherworld-inline-note">先把主题写成一句话，再到镜头轨道拆成开端、转折和结尾。</div>
    </section>
  );

  const renderStoryboardRail = () => (
    <div className="motherworld-card-grid motherworld-card-grid--acts">
      {storyboardActLabels.map((act) => (
        <div key={act.id} className="home-planet-act-card">
          <strong>{act.label}</strong>
          <textarea
            value={storyActs[act.id].text}
            onChange={(event) =>
              setStoryActs((current) => ({
                ...current,
                [act.id]: { ...current[act.id], text: event.target.value }
              }))
            }
            placeholder={`${act.label}发生了什么？一句话就好。`}
          />
        </div>
      ))}
    </div>
  );

  const renderStoryboardImport = () => (
    <section className="motherworld-section home-planet-form-card">
      <div className="motherworld-card-grid motherworld-card-grid--acts">
        {storyboardActLabels.map((act) => (
          <div key={act.id} className="home-planet-act-card">
            <strong>{act.label}</strong>
            <label className="home-planet-file-label">
              导入这一幕图片
              <input
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) readStoryboardImage(act.id, file);
                }}
              />
            </label>
            {storyActs[act.id].imageAsset ? <span className="text-xs text-cyan-100/68">已导入：{storyActs[act.id].imageAsset?.fileName}</span> : null}
          </div>
        ))}
      </div>
      <button type="button" disabled={!storyTitle.trim()} onClick={saveStoryboard}>
        {recentSavedType === "storyboard" ? "分镜册已保存" : "保存迷你分镜册"}
      </button>
    </section>
  );

  const renderArchiveCards = () => (
    <div className="motherworld-workbench">
      {recentLocationRewardClaims.length > 0 ? (
        <section className="motherworld-section">
          <div className="motherworld-section__title">地点回流清单</div>
          <div className="motherworld-card-grid motherworld-card-grid--four mt-3">
            {recentLocationRewardClaims.slice(0, 4).map((claim, index) => (
              <div
                key={`${claim.locationId}-${claim.createdAt}`}
                className={`home-planet-info-card ${index === 0 ? "home-planet-info-card--recent" : ""}`}
              >
                <div className="home-planet-card-kicker">
                  <span>{formatDate(claim.createdAt)}</span>
                  {index === 0 ? <em className="motherworld-new-badge">新回流</em> : null}
                </div>
                <strong>{claim.locationName}</strong>
                <p>{claim.rewards.map((reward) => reward.label).join(" / ")}</p>
                <small>{index === 0 ? `新回流来自：${claim.locationName}` : `来自：${claim.locationName}`}</small>
                <small>{claim.rewards[0]?.detail ?? "回流记录已写入母星。"}</small>
              </div>
            ))}
          </div>
        </section>
      ) : null}
      {recentArchiveRecords.length > 0 ? (
        <section className="motherworld-section">
          <div className="motherworld-section__title">证据回流记录</div>
          <div className="motherworld-card-grid motherworld-card-grid--four mt-3">
            {recentArchiveRecords.slice(0, 4).map((record, index) => {
              const sourceLabel = resolveLocationLabel(record.locationId, record.tag);
              return (
                <div key={record.id} className={`home-planet-info-card ${index === 0 ? "home-planet-info-card--recent" : ""}`}>
                  <div className="home-planet-card-kicker">
                    <span>{record.tag}</span>
                    {index === 0 ? <em className="motherworld-new-badge">新回流</em> : null}
                  </div>
                  <strong>{record.title}</strong>
                  <p>{record.summary}</p>
                  <small>{index === 0 ? `新回流来自：${sourceLabel}` : `来自：${sourceLabel}`}</small>
                  <small>
                    失序 {record.disorderLevel ?? state.chapterTwo.disorderLevel}/6 · 误触 {record.mistakeCount ?? 0}
                  </small>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}
      <div className="motherworld-card-grid motherworld-card-grid--four">
        {(chapterTwoOutcome?.blackBoxKnowledge?.length ? chapterTwoOutcome.blackBoxKnowledge : ["区分事实、推测和未知", "指令要说清楚", "流畅不等于真实", "用自己的话表达理解"]).map((card) => (
          <div key={card} className="home-planet-info-card">
            <span>第二章知识卡</span>
            <strong>{card}</strong>
            <p>这张卡会随着后续星球探索继续补充自己的例子和错误复盘。</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderArchiveBlackBox = () => (
    <div className="motherworld-card-grid motherworld-card-grid--four">
      <div className="home-planet-info-card">
        <span>黑匣名称</span>
        <strong>{chapterTwoOutcome?.blackBoxTitle ?? "科技黑匣未开启"}</strong>
        <p>{chapterTwoOutcome?.summary ?? "完成第二章后，这里会显示黑匣证据摘要。"}</p>
      </div>
      <div className="home-planet-info-card">
        <span>证据记录</span>
        <strong>{chapterTwoOutcome?.scannedZone ?? "等待扫描区域"}</strong>
        <p>{chapterTwoOutcome?.logSummary ?? "主舰会把你的判断过程保留下来。"}</p>
      </div>
      <div className="home-planet-info-card">
        <span>文明变化</span>
        <strong>{chapterTwoOutcome?.planetName ?? "语言与信息文明星"}</strong>
        <p>{chapterTwoOutcome?.worldChange ?? "还没有新的复苏记录。"}</p>
      </div>
      <div className="home-planet-info-card">
        <span>飞船升级</span>
        <strong>{chapterTwoOutcome?.unlockedModule ?? "语言理解模块待校准"}</strong>
        <p>{chapterTwoOutcome?.aiUpgrade ?? "黑匣会提醒你：AI 可以帮忙，但不能替自己思考。"}</p>
      </div>
    </div>
  );

  const renderArchiveRule = () => (
    <section className="motherworld-section home-planet-form-card">
      <label>表达规则卡</label>
      {recentRuleCards.length > 0 ? (
        <div className="motherworld-card-grid motherworld-card-grid--four">
          {recentRuleCards.slice(0, 4).map((card, index) => (
            <div key={card.id} className={`home-planet-info-card ${index === 0 ? "home-planet-info-card--recent" : ""}`}>
              <div className="home-planet-card-kicker">
                <span>{card.source}</span>
                {index === 0 ? <em className="motherworld-new-badge">新回流</em> : null}
              </div>
              <strong>{card.title}</strong>
              <p>{card.body}</p>
              <small>{index === 0 ? `新回流来自：${card.source}` : `来自：${card.source}`}</small>
            </div>
          ))}
        </div>
      ) : (
        <div className="motherworld-inline-note">创作屋接入后，证据井回流会把表达经验整理成规则卡。</div>
      )}
    </section>
  );

  const renderDormCrew = () => (
    <div className="motherworld-card-grid motherworld-card-grid--crew">
      {state.crewRoster.length === 0 ? (
        <div className="home-planet-info-card">
          <span>船员宿舍</span>
          <strong>等待第一位伙伴入住</strong>
          <p>船员是任务伙伴，会记录参与过的远征和羁绊成长。</p>
        </div>
      ) : (
        state.crewRoster.map((crew) => (
          <div key={crew.id} className="home-planet-info-card">
            <span>{crew.trustLabel}</span>
            <strong>{crew.name}</strong>
            <p>
              {crew.title} / 参与记录：{state.chapterTwoComplete ? "语言星远征" : "主舰同步"}
            </p>
            {baseEffects.ecologyBond ? <small>生态充足：共同经历成长更快。</small> : null}
          </div>
        ))
      )}
    </div>
  );

  const renderDormWindow = () => (
    <div className="motherworld-card-grid motherworld-card-grid--four">
      <div className="home-planet-info-card">
        <span>远征参与记录</span>
        <strong>{state.chapterTwoComplete ? "语言星远征已完成" : "等待下一次共同出发"}</strong>
        <p>{chapterTwoOutcome?.leadDossierNote ?? "主舰同步记录会在完成远征后写入宿舍舷窗。"}</p>
      </div>
      <div className="home-planet-info-card">
        <span>支援记录</span>
        <strong>{state.chapterTwoComplete ? "伙伴协作已归档" : "支援席待命"}</strong>
        <p>{chapterTwoOutcome?.supportDossierNote ?? "第二位伙伴的支援方式会在这里显示。"}</p>
      </div>
    </div>
  );

  const renderDormLocker = () => (
    <div className="motherworld-card-grid motherworld-card-grid--four">
      <div className="home-planet-info-card">
        <span>伙伴称号</span>
        <strong>{chapterTwoOutcome?.titleEarned ?? "第一枚称号待获得"}</strong>
        <p>称号会来自关键远征，不靠重复聊天刷出来。</p>
      </div>
      <div className="home-planet-info-card">
        <span>信任标签</span>
        <strong>{activeCrew?.trustLabel ?? state.crewRoster[0]?.trustLabel ?? "等待羁绊建立"}</strong>
        <p>{activeCrew?.name ?? state.crewRoster[0]?.name ?? "第一位伙伴"} 的信任记录会随任务推进。</p>
      </div>
      <div className="home-planet-info-card">
        <span>个人记录</span>
        <strong>{activeCrew?.title ?? state.crewRoster[0]?.title ?? "还没有个人档案"}</strong>
        <p>这里保存伙伴在主舰任务中的位置，而不是开放式闲聊历史。</p>
      </div>
    </div>
  );

  const renderPlanningCard = (label: string, title: string, body: string) => (
    <div className="home-planet-info-card">
      <span>{label}</span>
      <strong>{title}</strong>
      <p>{body}</p>
    </div>
  );

  const renderInteriorAction = (action: MotherworldInteriorAction) => {
    if (action.id === "gallery-view") return renderGalleryList();
    if (action.id === "gallery-crew") return renderGalleryCrewSummary();
    if (action.id === "gallery-archive") return renderGalleryArchive();

    if (action.id === "workshop-build") return renderWorkshopBuild();
    if (action.id === "workshop-core") return renderWorkshopCore();
    if (action.id === "workshop-model") return renderWorkshopModel();

    if (action.id === "commission-start") {
      return (
        <div className="motherworld-workbench">
          <FeatureLockHint unlocked={unlockedFeatures.includes("commission-board")} requirement={homePlanetFeatures.find((feature) => feature.id === "commission-board")?.unlockText ?? "完成第二章"} />
          {renderCommissionTasks()}
        </div>
      );
    }
    if (action.id === "commission-desk") return renderCommissionDesk();
    if (action.id === "commission-review") return renderCommissionReview();

    if (action.id === "dialogue-role") {
      return (
        <div className="motherworld-workbench">
          <FeatureLockHint unlocked={unlockedFeatures.includes("character-dialogue-room")} requirement={homePlanetFeatures.find((feature) => feature.id === "character-dialogue-room")?.unlockText ?? "完成第二章"} />
          {renderDialogueRoles()}
        </div>
      );
    }
    if (action.id === "dialogue-question") return renderDialogueQuestion();
    if (action.id === "dialogue-review") return renderDialogueReview();

    if (action.id === "studio-script") return renderStoryboardScript();
    if (action.id === "studio-rail") return renderStoryboardRail();
    if (action.id === "studio-import") return renderStoryboardImport();

    if (action.id === "archive-card") return renderArchiveCards();
    if (action.id === "archive-blackbox") return renderArchiveBlackBox();
    if (action.id === "archive-rule") return renderArchiveRule();

    if (action.id === "dorm-crew") return renderDormCrew();
    if (action.id === "dorm-window") return renderDormWindow();
    if (action.id === "dorm-locker") return renderDormLocker();

    if (action.id === "plan-map") return renderPlanningCard("远征目标", "写下下一次想验证的问题", "计划室先保留为预览入口。后续远征前，你会先说明目标、证据和想带回的记录。");
    if (action.id === "plan-route") return renderPlanningCard("路线选择", "选择适合当前能力的星球路线", "路线系统开放后，不同星球会需要不同船员、资源和准备方式。");
    if (action.id === "plan-review") return renderPlanningCard("复盘计划", "回来后记录学到什么", "远征不是只看结果，复盘会把错误、证据和新规则变成母星成长材料。");

    return null;
  };

  const renderSelectedFeature = () => {
    if (!selectedFeature || !selectedConfig) {
      return (
        <div className="motherworld-panel-empty">
          <span>基地总览</span>
          <strong>点选一座建筑查看功能</strong>
          <p>默认只显示地图。建筑被解锁或激活后，会单独点亮，不再整张亮图切换。</p>
        </div>
      );
    }

    if (selectedFeature === "civilization-gallery") {
      return (
        <div className="motherworld-workbench">
          <FeatureLockHint unlocked={selectedUnlocked} requirement={selectedConfig.unlockText} />
          {renderGalleryCrewSummary()}
          {renderGalleryList()}
        </div>
      );
    }

    if (selectedFeature === "planet-workshop") {
      return (
        <div className="motherworld-workbench">
          {renderWorkshopModel()}
          {renderWorkshopBuild()}
        </div>
      );
    }

    if (selectedFeature === "commission-board") {
      return (
        <div className="motherworld-workbench">
          <FeatureLockHint unlocked={unlockedFeatures.includes("commission-board")} requirement={selectedConfig.unlockText} />
          {renderCommissionTasks()}
          {renderCommissionReview()}
        </div>
      );
    }

    if (selectedFeature === "character-dialogue-room") {
      return (
        <div className="motherworld-workbench">
          <FeatureLockHint unlocked={unlockedFeatures.includes("character-dialogue-room")} requirement={selectedConfig.unlockText} />
          {renderDialogueRoles()}
          {renderDialogueQuestion()}
          {renderDialogueReview()}
        </div>
      );
    }

    if (selectedFeature === "animation-studio") {
      return (
        <div className="motherworld-workbench">
          <div className="motherworld-inline-note">
            当前是预览模式：先做三幕分镜册。完整视频能力等待后续图像/声音科技解锁。
          </div>
          {renderStoryboardScript()}
          {renderStoryboardRail()}
          {renderStoryboardImport()}
        </div>
      );
    }

    if (selectedFeature === "civilization-archive") {
      return renderArchiveCards();
    }

    if (selectedFeature === "crew-dormitory") {
      return renderDormCrew();
    }

    return renderPlanningCard("预告", "探险计划室仍在建设", "后续每次远征前，你会先写目标、风险和回来后的记录计划。现在先保留入口，不扩第三章。");
  };

  return (
    <section className="home-planet-hub home-planet-hub--map scene-reveal relative min-h-screen overflow-hidden text-white">
      <div className="motherworld-map-stage">
        <img src={motherworldMapAssets.baseDark} alt="" className="motherworld-map-image" />
        <div className="motherworld-map-vignette" aria-hidden="true" />

        {motherworldRevealPatches
          .filter((patch) => patch.requiredFeatureIds.every((featureId) => activeFeatures.has(featureId)))
          .map((patch) => (
            <img
              key={patch.id}
              src={motherworldMapAssets.baseBrightReference}
              alt=""
              className="motherworld-building-overlay motherworld-building-overlay--patch"
              style={
                {
                  clipPath: patch.clipPath,
                  "--overlay-opacity": patch.opacity
                } as CSSProperties
              }
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          ))}

        {motherworldHotspots.map((hotspot) => {
          const status = getFeatureStatus(hotspot.id);
          const active = status === "active";
          const selected = selectedFeature === hotspot.id;
          const style = {
            "--hotspot-x": `${hotspot.position.x}%`,
            "--hotspot-y": `${hotspot.position.y}%`,
            "--hotspot-w": `${hotspot.size.width}%`,
            "--hotspot-h": `${hotspot.size.height}%`
          } as CSSProperties;
          const overlayClipPaths = [hotspot.overlayClipPath, ...(hotspot.overlayFeatherClipPaths ?? [])];

          return (
            <div key={`${hotspot.id}-layers`}>
              {active
                ? overlayClipPaths.map((clipPath, index) => (
                <img
                  key={`${hotspot.id}-overlay-${index}`}
                  src={motherworldMapAssets.baseBrightReference}
                  alt=""
                  className={`motherworld-building-overlay ${index > 0 ? "motherworld-building-overlay--feather" : ""}`}
                  style={
                    {
                      clipPath,
                      "--overlay-opacity": index > 0 ? 0.34 : 0.86
                    } as CSSProperties
                  }
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
                  ))
                : null}
              {active ? <div className="motherworld-building-glow" style={style} aria-hidden="true" /> : null}
              {active ? <div className="motherworld-building-energy" style={style} aria-hidden="true" /> : null}
              <button
                type="button"
                className={`motherworld-building-hotspot motherworld-building-hotspot--${status} ${selected ? "motherworld-building-hotspot--selected" : ""}`}
                style={style}
                onMouseEnter={() => setHoveredFeature(hotspot.id)}
                onMouseLeave={() => setHoveredFeature((current) => (current === hotspot.id ? null : current))}
                onFocus={() => setHoveredFeature(hotspot.id)}
                onBlur={() => setHoveredFeature((current) => (current === hotspot.id ? null : current))}
                onClick={() => openFeature(hotspot.id)}
                aria-label={`${hotspot.name}，${status === "locked" ? hotspot.lockedHint : hotspot.mapNote}`}
              >
                <span className="motherworld-building-hotspot__core">{hotspot.shortName}</span>
              </button>
            </div>
          );
        })}

        {previewHotspot ? (
          <div className="motherworld-building-preview" aria-live="polite">
            <span>{previewStatus === "locked" ? "未开放建筑" : previewStatus === "active" ? "已点亮建筑" : "可响应建筑"}</span>
            <strong>{previewHotspot.name}</strong>
            <p>{previewStatus === "locked" ? previewHotspot.lockedHint : previewStatus === "active" ? previewHotspot.activeHint : previewHotspot.mapNote}</p>
          </div>
        ) : null}

        {recentActivatedFeature ? (
          <div
            className="motherworld-resource-flight"
            style={
              {
                "--flight-x": `${motherworldHotspots.find((item) => item.id === recentActivatedFeature)?.position.x ?? 50}%`,
                "--flight-y": `${motherworldHotspots.find((item) => item.id === recentActivatedFeature)?.position.y ?? 50}%`
              } as CSSProperties
            }
            aria-hidden="true"
          >
            <span />
            <span />
            <span />
          </div>
        ) : null}

        <div className="motherworld-map-ui">
          <div>
            <div className="soft-label text-[10px] text-cyan-100/62">母星基地 / AI 创造基地</div>
            <h2>{motherPlanet?.name ?? "第一母星"}</h2>
            <p>点亮建筑，把外部星球学到的能力变成作品和基地成长。</p>
          </div>
          <button type="button" onClick={onReturn}>
            返回主舰
          </button>
        </div>

        <div className={`motherworld-resource-strip ${recentActivatedFeature || recentBuiltStructure ? "motherworld-resource-strip--spending" : ""}`}>
          {[
            ["水源", resources.water],
            ["矿物", resources.minerals],
            ["能源", resources.energy],
            ["科技点", state.technologyPoints],
            ["碎片", resources.fragments]
          ].map(([label, value]) => (
            <div key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>

        <div className="motherworld-map-hint">
          <span>{state.homePlanetHub.activeFeatures.length} 座建筑已点亮</span>
          <strong>{recentActivatedFeature ? `${motherworldHotspots.find((item) => item.id === recentActivatedFeature)?.name ?? "建筑"} 已响应` : "选择建筑查看功能"}</strong>
        </div>

        {enteringHotspot ? (
          <div
            className="motherworld-entry-transition"
            style={{ "--interior-image": `url(${enteringHotspot.interiorImageUrl})` } as CSSProperties}
            aria-hidden="true"
          >
            <div className="motherworld-entry-transition__gate" />
            <span>{enteringHotspot.name}</span>
          </div>
        ) : null}

        {enteredHotspot && enteredConfig ? (
          <section
            className={`motherworld-interior ${activeInteriorAction ? "motherworld-interior--action-open" : ""}`}
            style={{ "--interior-image": `url(${enteredHotspot.interiorImageUrl})` } as CSSProperties}
            aria-label={`${enteredHotspot.name}内部`}
          >
            <div className="motherworld-interior__backdrop" aria-hidden="true" />
            <button type="button" className="motherworld-room-back" onClick={closeInterior} aria-label="返回地图">
              <span aria-hidden="true" />
            </button>
            <div className="motherworld-interior__room" aria-label={`${enteredHotspot.name}可互动房间`}>
              <div className="motherworld-interior__room-shade" aria-hidden="true" />
              {interiorActions.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  className={`motherworld-object-hotspot ${activeInteriorAction?.id === action.id ? "motherworld-object-hotspot--active" : ""} ${
                    hintedInteriorFeature === enteredFeature ? "motherworld-object-hotspot--hint" : ""
                  }`}
                  style={
                      {
                        "--object-x": `${action.position.x}%`,
                        "--object-y": `${action.position.y}%`,
                        "--object-w": `${action.size.width}%`,
                        "--object-h": `${action.size.height}%`,
                        "--object-radius": action.size.radius ?? "28px"
                      } as CSSProperties
                    }
                  onClick={() => setActiveInteriorActionId(action.id)}
                  aria-label={`${action.label}，${action.verb}`}
                >
                  <span aria-hidden="true" />
                </button>
              ))}
            </div>
            {activeInteriorAction ? (
              <aside className="motherworld-action-panel" aria-label={activeInteriorAction.verb}>
                <button type="button" className="motherworld-action-panel__close" onClick={closeInteriorAction} aria-label="关闭互动面板">
                  <span aria-hidden="true" />
                </button>
                <div className="sr-only">
                  {activeInteriorAction.label}：{activeInteriorAction.summary}
                </div>
                <div className="motherworld-action-panel__meta">
                  <span className={`motherworld-action-status motherworld-action-status--${activeInteriorAction.status}`}>
                    {actionStatusLabels[activeInteriorAction.status]}
                  </span>
                  <span>{activeInteriorAction.label}</span>
                </div>
                {renderInteriorAction(activeInteriorAction)}
              </aside>
            ) : null}
          </section>
        ) : null}

        {!enteredFeature && !enteringFeature ? (
          <aside className={`motherworld-detail-panel ${selectedFeature ? "motherworld-detail-panel--open" : ""}`}>
            {selectedFeature && selectedConfig ? (
              <>
                <div className="motherworld-detail-panel__header">
                  <div>
                    <span>{selectedConfig.value}</span>
                    <h3>{selectedConfig.name}</h3>
                    <p>{selectedConfig.description}</p>
                  </div>
                  <button type="button" onClick={() => setSelectedFeature(null)} aria-label="关闭建筑面板">
                    收起
                  </button>
                </div>

                <div className="motherworld-feature-state">
                  <span>{selectedStatus === "active" ? "建筑已点亮" : selectedStatus === "unlocked" ? "可激活" : "未开放"}</span>
                  <strong>{selectedHotspot?.activeHint ?? selectedConfig.name}</strong>
                  {selectedHotspot && selectedActivationCost ? (
                    <small>
                      消耗 水源 {selectedActivationCost.water} / 矿物 {selectedActivationCost.minerals} / 能源 {selectedActivationCost.energy} / 碎片{" "}
                      {selectedActivationCost.fragments}
                      {[
                        selectedActivationCost.water < selectedHotspot.activationCost.water ? "水源充足已减免" : null,
                        selectedActivationCost.minerals < selectedHotspot.activationCost.minerals ? "矿物充足已减免" : null
                      ]
                        .filter(Boolean)
                        .map((note) => ` · ${note}`)}
                    </small>
                  ) : null}
                  {!selectedActive ? (
                    <button type="button" disabled={!selectedCanActivate} onClick={activateFeature}>
                      {selectedStatus === "locked" ? selectedConfig.unlockText : selectedCanActivate ? "点亮这座建筑" : "资源不足"}
                    </button>
                  ) : null}
                </div>

                <div className="motherworld-detail-panel__body">{renderSelectedFeature()}</div>
              </>
            ) : (
              renderSelectedFeature()
            )}
          </aside>
        ) : null}
      </div>
    </section>
  );
}
