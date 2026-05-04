import type { HomePlanetFeatureId, HomePlanetResources } from "@/types/game";

export type MotherworldBuildingStatus = "locked" | "unlocked" | "active";

export interface MotherworldHotspotConfig {
  id: HomePlanetFeatureId;
  name: string;
  shortName: string;
  mapNote: string;
  activeHint: string;
  lockedHint: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  overlayClipPath: string;
  overlayFeatherClipPaths?: string[];
  activationCost: Pick<HomePlanetResources, "water" | "minerals" | "energy" | "fragments">;
  interiorImageUrl: string;
  interiorMood: string;
}

export interface MotherworldRevealPatchConfig {
  id: string;
  requiredFeatureIds: HomePlanetFeatureId[];
  clipPath: string;
  opacity: number;
}

export const motherworldMapAssets = {
  baseDark: "/images/home-planet/base-dark.png",
  baseBrightReference: "/images/home-planet/base-bright.png"
};

export const motherworldHotspots: MotherworldHotspotConfig[] = [
  {
    id: "civilization-gallery",
    name: "文明展厅",
    shortName: "文明展厅",
    mapNote: "作品、黑匣记录与航行成果会在这里归档。",
    activeHint: "文明展厅已点亮",
    lockedHint: "第一章完成后可用",
    position: { x: 25, y: 28 },
    size: { width: 22, height: 22 },
    overlayClipPath: "polygon(4% 0, 40% 0, 40% 39%, 33% 47%, 9% 45%, 3% 27%)",
    overlayFeatherClipPaths: ["polygon(4% 0, 44% 0, 44% 50%, 16% 56%, 4% 38%)"],
    activationCost: { water: 7, minerals: 8, energy: 7, fragments: 0 },
    interiorImageUrl: "/images/home-planet/interiors-v2/civilization-gallery.png",
    interiorMood: "记忆展柜与文明晶体正在同步航行成果。"
  },
  {
    id: "planet-workshop",
    name: "星球工坊",
    shortName: "星球工坊",
    mapNote: "用基础资源让母星开始建设。",
    activeHint: "星球工坊开始运转",
    lockedHint: "第一章完成后可用",
    position: { x: 21, y: 66 },
    size: { width: 22, height: 18 },
    overlayClipPath: "polygon(3% 50%, 34% 49%, 36% 83%, 8% 89%, 0 72%)",
    overlayFeatherClipPaths: ["polygon(1% 54%, 36% 52%, 38% 90%, 5% 94%, 0 74%)"],
    activationCost: { water: 8, minerals: 9, energy: 8, fragments: 0 },
    interiorImageUrl: "/images/home-planet/interiors-v2/planet-workshop.png",
    interiorMood: "星球模型台、资源罐和建造机械臂已经待命。"
  },
  {
    id: "commission-board",
    name: "作品委托所",
    shortName: "作品委托",
    mapNote: "把学到的能力变成具体作品。",
    activeHint: "作品委托所开始运转",
    lockedHint: "完成第二章并开启语言黑匣",
    position: { x: 48, y: 47 },
    size: { width: 15, height: 14 },
    overlayClipPath: "polygon(40% 35%, 62% 33%, 63% 59%, 39% 61%)",
    overlayFeatherClipPaths: ["polygon(38% 31%, 66% 30%, 66% 66%, 38% 70%)"],
    activationCost: { water: 6, minerals: 6, energy: 5, fragments: 1 },
    interiorImageUrl: "/images/home-planet/interiors-v2/commission-board.png",
    interiorMood: "任务墙、写作桌和项目灯正在等待新的作品委托。"
  },
  {
    id: "character-dialogue-room",
    name: "角色对话室",
    shortName: "角色对话",
    mapNote: "每次对话都要带着问题和复盘。",
    activeHint: "角色对话室已响应",
    lockedHint: "完成第二章并开启语言黑匣",
    position: { x: 49, y: 74 },
    size: { width: 13, height: 18 },
    overlayClipPath: "polygon(42% 58%, 58% 57%, 59% 96%, 42% 97%)",
    overlayFeatherClipPaths: ["polygon(39% 52%, 62% 52%, 62% 100%, 39% 100%)"],
    activationCost: { water: 6, minerals: 4, energy: 6, fragments: 1 },
    interiorImageUrl: "/images/home-planet/interiors-v2/character-dialogue-room.png",
    interiorMood: "环形对话台把问题、回应和复盘分成清楚的回路。"
  },
  {
    id: "animation-studio",
    name: "动画片工作室",
    shortName: "分镜工坊",
    mapNote: "用三幕分镜把故事变成可回看的作品。",
    activeHint: "动画片工作室进入预览态",
    lockedHint: "预览可用，完整能力等待图像科技",
    position: { x: 54, y: 24 },
    size: { width: 17, height: 16 },
    overlayClipPath: "polygon(41% 0, 67% 0, 67% 38%, 41% 39%)",
    overlayFeatherClipPaths: ["polygon(38% 0, 70% 0, 70% 45%, 38% 47%)"],
    activationCost: { water: 7, minerals: 7, energy: 6, fragments: 2 },
    interiorImageUrl: "/images/home-planet/interiors-v2/animation-studio.png",
    interiorMood: "分镜光带、镜头轨道和三幕故事台缓慢亮起。"
  },
  {
    id: "civilization-archive",
    name: "文明档案馆",
    shortName: "档案馆",
    mapNote: "把 AI 使用原则沉淀成自己的文明卡。",
    activeHint: "文明档案馆已点亮",
    lockedHint: "第二章后补充知识卡",
    position: { x: 72, y: 58 },
    size: { width: 18, height: 14 },
    overlayClipPath: "polygon(62% 42%, 88% 41%, 90% 69%, 62% 70%)",
    overlayFeatherClipPaths: ["polygon(59% 37%, 93% 38%, 93% 76%, 59% 78%)"],
    activationCost: { water: 6, minerals: 10, energy: 7, fragments: 0 },
    interiorImageUrl: "/images/home-planet/interiors-v2/civilization-archive.png",
    interiorMood: "黑匣资料、语言光流和文明知识卡被安静归档。"
  },
  {
    id: "crew-dormitory",
    name: "船员宿舍",
    shortName: "船员宿舍",
    mapNote: "船员是远征伙伴，不是无限陪聊对象。",
    activeHint: "船员宿舍已点亮",
    lockedHint: "招募船员后可用",
    position: { x: 78, y: 75 },
    size: { width: 20, height: 16 },
    overlayClipPath: "polygon(63% 62%, 98% 60%, 99% 92%, 62% 93%)",
    overlayFeatherClipPaths: ["polygon(60% 55%, 100% 55%, 100% 97%, 60% 98%)"],
    activationCost: { water: 8, minerals: 5, energy: 8, fragments: 0 },
    interiorImageUrl: "/images/home-planet/interiors-v2/crew-dormitory.png",
    interiorMood: "船员舱室、个人储物柜和舷窗星光保持低亮度值守。"
  },
  {
    id: "expedition-planning",
    name: "探险计划室",
    shortName: "计划室",
    mapNote: "出发前写目标，回来后做复盘。",
    activeHint: "探险计划室进入待命态",
    lockedHint: "后续远征系统开放",
    position: { x: 82, y: 28 },
    size: { width: 17, height: 24 },
    overlayClipPath: "polygon(70% 0, 100% 0, 100% 43%, 68% 43%)",
    overlayFeatherClipPaths: ["polygon(67% 0, 100% 0, 100% 48%, 67% 50%)"],
    activationCost: { water: 8, minerals: 6, energy: 7, fragments: 2 },
    interiorImageUrl: "/images/home-planet/interiors-v2/expedition-planning.png",
    interiorMood: "星图桌和路线投影正在为下一次远征预留轨道。"
  }
];

export const motherworldPreviewFeatureIds: HomePlanetFeatureId[] = ["animation-studio", "expedition-planning"];

export const motherworldRevealPatches: MotherworldRevealPatchConfig[] = [
  {
    id: "left-terrain-rim",
    requiredFeatureIds: ["civilization-gallery", "planet-workshop"],
    clipPath: "polygon(0 0, 18% 0, 17% 100%, 0 100%)",
    opacity: 0.26
  },
  {
    id: "upper-ridge",
    requiredFeatureIds: ["civilization-gallery", "animation-studio", "expedition-planning"],
    clipPath: "polygon(0 0, 100% 0, 100% 17%, 70% 18%, 48% 14%, 25% 18%, 0 16%)",
    opacity: 0.28
  },
  {
    id: "west-causeway",
    requiredFeatureIds: ["civilization-gallery", "planet-workshop"],
    clipPath: "polygon(7% 38%, 38% 39%, 39% 63%, 6% 65%)",
    opacity: 0.34
  },
  {
    id: "central-causeway",
    requiredFeatureIds: ["civilization-gallery", "planet-workshop", "commission-board", "character-dialogue-room"],
    clipPath: "polygon(29% 28%, 65% 29%, 64% 78%, 31% 80%)",
    opacity: 0.38
  },
  {
    id: "north-causeway",
    requiredFeatureIds: ["civilization-gallery", "animation-studio", "expedition-planning"],
    clipPath: "polygon(27% 11%, 99% 10%, 99% 43%, 29% 47%)",
    opacity: 0.32
  },
  {
    id: "east-causeway",
    requiredFeatureIds: ["commission-board", "civilization-archive", "crew-dormitory"],
    clipPath: "polygon(55% 39%, 100% 39%, 100% 86%, 55% 86%)",
    opacity: 0.34
  },
  {
    id: "lower-basin",
    requiredFeatureIds: ["planet-workshop", "character-dialogue-room", "crew-dormitory"],
    clipPath: "polygon(2% 61%, 99% 60%, 99% 98%, 2% 98%)",
    opacity: 0.3
  }
];

export function canActivateMotherworldFeature(
  resources: Pick<HomePlanetResources, "water" | "minerals" | "energy" | "fragments">,
  cost: Pick<HomePlanetResources, "water" | "minerals" | "energy" | "fragments">
) {
  return resources.water >= cost.water && resources.minerals >= cost.minerals && resources.energy >= cost.energy && resources.fragments >= cost.fragments;
}
