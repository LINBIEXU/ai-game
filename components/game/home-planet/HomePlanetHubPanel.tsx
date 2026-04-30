"use client";

/* eslint-disable @next/next/no-img-element */

import { useMemo, useState, type CSSProperties } from "react";

import {
  canBuildStructure,
  commissionTasks,
  dialogueCharacters,
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

function FeatureLockHint({ unlocked, requirement }: { unlocked: boolean; requirement: string }) {
  if (unlocked) return null;

  return (
    <div className="rounded-[22px] border border-amber-200/18 bg-amber-200/[0.06] p-4 text-sm leading-6 text-amber-50/78">
      这个建筑仍在休眠。解锁条件：{requirement}
    </div>
  );
}

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
  const [storyActs, setStoryActs] = useState<Record<HomePlanetStoryboardAct["id"], { text: string; imageAsset: ClassroomImageAsset | null }>>({
    opening: { text: "", imageAsset: null },
    turn: { text: "", imageAsset: null },
    ending: { text: "", imageAsset: null }
  });

  const motherPlanet = state.signalMission.planet.confirmedModel ?? state.planetCatalog[0] ?? null;
  const resources = state.homePlanetHub.resources;
  const selectedConfig = selectedFeature ? homePlanetFeatures.find((feature) => feature.id === selectedFeature) ?? null : null;
  const selectedHotspot = selectedFeature ? motherworldHotspots.find((hotspot) => hotspot.id === selectedFeature) ?? null : null;
  const selectedTask = commissionTasks.find((task) => task.id === selectedTaskId) ?? commissionTasks[0];
  const selectedDialogueCharacter = dialogueCharacters.find((character) => character.id === dialogueCharacterId) ?? dialogueCharacters[0];
  const chapterTwoOutcome = state.chapterTwo.outcome;

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
    selectedStatus === "unlocked" &&
    canActivateMotherworldFeature(resources, selectedHotspot!.activationCost);
  const previewHotspot = hoveredFeature ? motherworldHotspots.find((hotspot) => hotspot.id === hoveredFeature) ?? null : null;
  const previewStatus = previewHotspot ? getFeatureStatus(previewHotspot.id) : null;
  const enteringHotspot = enteringFeature ? motherworldHotspots.find((hotspot) => hotspot.id === enteringFeature) ?? null : null;
  const enteredHotspot = enteredFeature ? motherworldHotspots.find((hotspot) => hotspot.id === enteredFeature) ?? null : null;
  const enteredConfig = enteredFeature ? homePlanetFeatures.find((feature) => feature.id === enteredFeature) ?? null : null;

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
        <div className="space-y-4">
          <FeatureLockHint unlocked={selectedUnlocked} requirement={selectedConfig.unlockText} />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="home-planet-info-card">
              <span>我的船员</span>
              <strong>{activeCrew?.name ?? state.crewRoster[0]?.name ?? "等待第一位伙伴"}</strong>
              <p>{activeCrew?.title ?? "船员会作为任务伙伴参与远征，而不是无限陪聊。"}</p>
            </div>
            <div className="home-planet-info-card">
              <span>我的母星</span>
              <strong>{motherPlanet?.name ?? "第一母星"}</strong>
              <p>{motherPlanet?.summary ?? "完成第一章后，这里会显示孩子亲手定义的星球模型。"}</p>
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

          <div className="home-planet-gallery-list">
            <div className="text-sm font-semibold text-white/78">最近作品</div>
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
          </div>
        </div>
      );
    }

    if (selectedFeature === "planet-workshop") {
      return (
        <div className="space-y-4">
          <div className="home-planet-info-card">
            <span>母星档案</span>
            <strong>{motherPlanet?.name ?? "第一母星"}</strong>
            <p>
              {motherPlanet?.environmentTrait ?? "母星环境特征会从第一章星球建模结果读取。"} / {motherPlanet?.landmarkFeature ?? "标志性建筑仍待补完"}
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {homePlanetStructures.map((structure) => {
              const built = state.homePlanetHub.builtStructures.includes(structure.id);
              const affordable = canBuildStructure(resources, structure);
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
                      水源 {structure.cost.water} / 矿物 {structure.cost.minerals} / 能源 {structure.cost.energy}
                    </small>
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
        </div>
      );
    }

    if (selectedFeature === "commission-board") {
      return (
        <div className="space-y-4">
          <FeatureLockHint unlocked={unlockedFeatures.includes("commission-board")} requirement={selectedConfig.unlockText} />
          <div className="grid gap-3 md:grid-cols-2">
            {commissionTasks.map((task) => (
              <button key={task.id} type="button" onClick={() => setSelectedTaskId(task.id)} className={`home-planet-task-card ${selectedTaskId === task.id ? "home-planet-task-card--selected" : ""}`}>
                <span>{task.ability}</span>
                <strong>{task.title}</strong>
                <p>{task.goal}</p>
              </button>
            ))}
          </div>
          <div className="home-planet-form-card">
            <label>孩子的输出</label>
            <textarea value={commissionOutput} onChange={(event) => setCommissionOutput(event.target.value)} placeholder={selectedTask?.placeholder} />
            <button type="button" disabled={!unlockedFeatures.includes("commission-board") || !commissionOutput.trim()} onClick={saveCommission}>
              保存到文明展厅
            </button>
          </div>
        </div>
      );
    }

    if (selectedFeature === "character-dialogue-room") {
      return (
        <div className="space-y-4">
          <FeatureLockHint unlocked={unlockedFeatures.includes("character-dialogue-room")} requirement={selectedConfig.unlockText} />
          <div className="grid gap-3 md:grid-cols-2">
            {dialogueCharacters.map((character) => (
              <button key={character.id} type="button" onClick={() => setDialogueCharacterId(character.id)} className={`home-planet-task-card ${dialogueCharacterId === character.id ? "home-planet-task-card--selected" : ""}`}>
                <span>{character.theme}</span>
                <strong>{character.name}</strong>
                <p>先提出问题，再记录收获。这里不是无限陪聊。</p>
              </button>
            ))}
          </div>
          <div className="home-planet-form-card">
            <label>我想问的问题</label>
            <textarea value={dialogueQuestion} onChange={(event) => setDialogueQuestion(event.target.value)} placeholder="我想问：怎样才能……" />
            <label>对话后的收获</label>
            <textarea value={dialogueTakeaway} onChange={(event) => setDialogueTakeaway(event.target.value)} placeholder="我听完后发现……下一次我会……" />
            <button type="button" disabled={!unlockedFeatures.includes("character-dialogue-room") || !dialogueQuestion.trim() || !dialogueTakeaway.trim()} onClick={saveDialogue}>
              保存对话收获卡
            </button>
          </div>
        </div>
      );
    }

    if (selectedFeature === "animation-studio") {
      return (
        <div className="space-y-4">
          <div className="rounded-[22px] border border-cyan-200/16 bg-cyan-200/[0.06] p-4 text-sm leading-6 text-cyan-50/72">
            当前是预览模式：先做三幕分镜册。完整视频能力等待后续图像/声音科技解锁。
          </div>
          <div className="home-planet-form-card">
            <label>故事主题</label>
            <input value={storyTitle} onChange={(event) => setStoryTitle(event.target.value)} placeholder="比如：一封没有寄出的星际信" />
            <div className="grid gap-3 lg:grid-cols-3">
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
              保存迷你分镜册
            </button>
          </div>
        </div>
      );
    }

    if (selectedFeature === "civilization-archive") {
      return (
        <div className="grid gap-3 md:grid-cols-2">
          {["区分事实、推测和未知", "指令要说清楚", "流畅不等于真实", "用自己的话表达理解"].map((card) => (
            <div key={card} className="home-planet-info-card">
              <span>第二章知识卡</span>
              <strong>{card}</strong>
              <p>这张卡会随着后续星球探索继续补充孩子自己的例子和错误复盘。</p>
            </div>
          ))}
        </div>
      );
    }

    if (selectedFeature === "crew-dormitory") {
      return (
        <div className="grid gap-3 md:grid-cols-2">
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
              </div>
            ))
          )}
        </div>
      );
    }

    return (
      <div className="home-planet-info-card">
        <span>预告</span>
        <strong>探险计划室仍在建设</strong>
        <p>后续每次远征前，孩子会先写目标、风险和回来后的记录计划。现在先保留入口，不扩第三章。</p>
      </div>
    );
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
            className="motherworld-interior"
            style={{ "--interior-image": `url(${enteredHotspot.interiorImageUrl})` } as CSSProperties}
            aria-label={`${enteredHotspot.name}内部`}
          >
            <div className="motherworld-interior__backdrop" aria-hidden="true" />
            <div className="motherworld-interior__header">
              <div>
                <span>{enteredConfig.value}</span>
                <h2>{enteredConfig.name}</h2>
                <p>{enteredHotspot.interiorMood}</p>
              </div>
              <button type="button" onClick={closeInterior}>
                返回地图
              </button>
            </div>
            <div className="motherworld-interior__status">
              <span>建筑已点亮</span>
              <strong>{enteredHotspot.activeHint}</strong>
            </div>
            <div className="motherworld-interior__body">{renderSelectedFeature()}</div>
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
                  {selectedHotspot ? (
                    <small>
                      消耗 水源 {selectedHotspot.activationCost.water} / 矿物 {selectedHotspot.activationCost.minerals} / 能源 {selectedHotspot.activationCost.energy} / 碎片{" "}
                      {selectedHotspot.activationCost.fragments}
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
