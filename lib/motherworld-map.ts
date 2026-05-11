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

export interface MotherworldConnectionPatchConfig {
  id: string;
  from: HomePlanetFeatureId;
  to: HomePlanetFeatureId;
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
    overlayClipPath: "polygon(8% 7%, 35% 5%, 40% 18%, 39% 37%, 34% 49%, 12% 47%, 5% 33%)",
    overlayFeatherClipPaths: ["polygon(6% 5%, 38% 3%, 41% 17%, 41% 40%, 35% 52%, 10% 51%, 3% 34%)"],
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
    overlayClipPath: "polygon(7% 49%, 35% 48%, 39% 66%, 34% 86%, 8% 90%, 1% 74%)",
    overlayFeatherClipPaths: ["polygon(5% 47%, 37% 47%, 41% 66%, 36% 90%, 6% 93%, 0 75%)"],
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
    overlayClipPath: "polygon(41% 36%, 61% 35%, 62% 58%, 40% 60%, 38% 47%)",
    overlayFeatherClipPaths: ["polygon(39% 34%, 63% 34%, 64% 60%, 39% 63%, 37% 48%)"],
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
    overlayClipPath: "polygon(43% 61%, 58% 60%, 60% 95%, 43% 97%, 40% 78%)",
    overlayFeatherClipPaths: ["polygon(41% 59%, 60% 58%, 62% 98%, 41% 100%, 38% 79%)"],
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
    overlayClipPath: "polygon(48% 6%, 66% 4%, 68% 32%, 54% 36%, 44% 29%)",
    overlayFeatherClipPaths: ["polygon(46% 4%, 68% 3%, 70% 34%, 54% 38%, 42% 30%)"],
    activationCost: { water: 7, minerals: 7, energy: 6, fragments: 2 },
    interiorImageUrl: "/images/home-planet/interiors-v2/animation-studio.png",
    interiorMood: "分镜光带、镜头轨道和三幕故事台缓慢亮起。"
  },
  {
    id: "civilization-archive",
    name: "文明档案馆",
    shortName: "档案馆",
    mapNote: "把黑匣规则沉淀成自己的文明卡。",
    activeHint: "文明档案馆已点亮",
    lockedHint: "第二章后补充知识卡",
    position: { x: 72, y: 58 },
    size: { width: 18, height: 14 },
    overlayClipPath: "polygon(66% 40%, 88% 39%, 91% 67%, 66% 70%, 64% 55%)",
    overlayFeatherClipPaths: ["polygon(64% 38%, 91% 37%, 93% 70%, 65% 73%, 62% 56%)"],
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
    overlayClipPath: "polygon(68% 62%, 97% 60%, 99% 88%, 87% 96%, 68% 93%, 63% 77%)",
    overlayFeatherClipPaths: ["polygon(66% 59%, 99% 58%, 100% 90%, 88% 98%, 66% 96%, 61% 78%)"],
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
    overlayClipPath: "polygon(78% 0, 95% 0, 98% 39%, 82% 44%, 72% 31%)",
    overlayFeatherClipPaths: ["polygon(76% 0, 97% 0, 100% 41%, 82% 47%, 70% 32%)"],
    activationCost: { water: 8, minerals: 6, energy: 7, fragments: 2 },
    interiorImageUrl: "/images/home-planet/interiors-v2/expedition-planning.png",
    interiorMood: "星图桌和路线投影正在为下一次远征预留轨道。"
  }
];

export const motherworldPreviewFeatureIds: HomePlanetFeatureId[] = ["animation-studio", "expedition-planning"];

export const motherworldConnectionPatches: MotherworldConnectionPatchConfig[] = [
  {
    id: "gallery-workshop-causeway",
    from: "civilization-gallery",
    to: "planet-workshop",
    clipPath: "polygon(23% 42%, 39% 44%, 40% 57%, 29% 66%, 13% 68%, 12% 59%, 27% 53%)",
    opacity: 0.24
  },
  {
    id: "gallery-animation-bridge",
    from: "civilization-gallery",
    to: "animation-studio",
    clipPath: "polygon(35% 14%, 54% 13%, 56% 26%, 42% 29%, 34% 23%)",
    opacity: 0.2
  },
  {
    id: "animation-planning-bridge",
    from: "animation-studio",
    to: "expedition-planning",
    clipPath: "polygon(62% 12%, 84% 11%, 86% 26%, 69% 28%, 61% 22%)",
    opacity: 0.2
  },
  {
    id: "gallery-commission-bridge",
    from: "civilization-gallery",
    to: "commission-board",
    clipPath: "polygon(33% 38%, 44% 40%, 44% 53%, 36% 58%, 32% 50%)",
    opacity: 0.22
  },
  {
    id: "workshop-commission-bridge",
    from: "planet-workshop",
    to: "commission-board",
    clipPath: "polygon(33% 58%, 45% 57%, 45% 70%, 33% 72%, 29% 66%)",
    opacity: 0.22
  },
  {
    id: "commission-dialogue-bridge",
    from: "commission-board",
    to: "character-dialogue-room",
    clipPath: "polygon(43% 57%, 59% 57%, 61% 72%, 45% 74%, 42% 63%)",
    opacity: 0.24
  },
  {
    id: "commission-archive-bridge",
    from: "commission-board",
    to: "civilization-archive",
    clipPath: "polygon(58% 49%, 72% 48%, 75% 60%, 62% 64%, 58% 58%)",
    opacity: 0.22
  },
  {
    id: "archive-dormitory-bridge",
    from: "civilization-archive",
    to: "crew-dormitory",
    clipPath: "polygon(72% 66%, 88% 65%, 91% 78%, 78% 83%, 69% 76%)",
    opacity: 0.22
  },
  {
    id: "dialogue-dormitory-bridge",
    from: "character-dialogue-room",
    to: "crew-dormitory",
    clipPath: "polygon(58% 76%, 78% 75%, 81% 88%, 60% 91%, 55% 84%)",
    opacity: 0.22
  },
  {
    id: "planning-archive-bridge",
    from: "expedition-planning",
    to: "civilization-archive",
    clipPath: "polygon(82% 39%, 92% 39%, 93% 55%, 84% 61%, 78% 49%)",
    opacity: 0.2
  }
];

export function canActivateMotherworldFeature(
  resources: Pick<HomePlanetResources, "water" | "minerals" | "energy" | "fragments">,
  cost: Pick<HomePlanetResources, "water" | "minerals" | "energy" | "fragments">
) {
  return resources.water >= cost.water && resources.minerals >= cost.minerals && resources.energy >= cost.energy && resources.fragments >= cost.fragments;
}
