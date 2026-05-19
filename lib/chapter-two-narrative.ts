import type { ChapterTwoLocationId } from "@/types/game";

export type ChapterTwoHengdengState = "active" | "dimmed" | "extinguished" | "memory-ember" | "longfire";

export type ChapterTwoFakeCrewStage = "seed" | "mimic" | "pressure" | "mislead" | "betrayal";

export type ChapterTwoBlackboxStoryPhase =
  | "outer-court"
  | "keeper"
  | "prompt-injection"
  | "crew-return"
  | "crew-shield"
  | "hengdeng-overridden"
  | "longfire-choice"
  | "restoration";

export type ChapterTwoCinematicSlotId =
  | "crash-impact"
  | "hengdeng-awakening"
  | "surface-reveal"
  | "archive-threshold"
  | "archive-names"
  | "archive-blank"
  | "archive-margin"
  | "archive-sealed"
  | "archive-operate"
  | "archive-repair"
  | "letter-pile"
  | "letter-original"
  | "letter-slip"
  | "letter-draft"
  | "letter-return"
  | "letter-operate"
  | "letter-repair"
  | "valley-gate"
  | "valley-stories"
  | "valley-machine"
  | "valley-kindness"
  | "valley-wick"
  | "valley-slots"
  | "valley-operate"
  | "valley-repair"
  | "paper-intro"
  | "paper-route-choice"
  | "paper-relic"
  | "paper-residue"
  | "paper-core-scan"
  | "paper-repair"
  | "fake-crew-signal-mimic"
  | "fake-crew-route-mislead"
  | "hengdeng-extinguish"
  | "blackbox-outer-court"
  | "blackbox-keeper"
  | "blackbox-prompt-injection"
  | "blackbox-core-contact"
  | "blackbox-phase-two-pressure"
  | "blackbox-boss-archive"
  | "blackbox-boss-delivery"
  | "blackbox-boss-verification"
  | "blackbox-boss-expression"
  | "blackbox-boss-identity"
  | "blackbox-crew-return"
  | "blackbox-crew-shield"
  | "blackbox-hengdeng-overridden"
  | "blackbox-desperation"
  | "blackbox-wick-memory"
  | "blackbox-longfire-choice"
  | "blackbox-longfire-ignite"
  | "blackbox-restoration";

export interface ChapterTwoCinematicSlot {
  id: ChapterTwoCinematicSlotId;
  label: string;
  storyUse: string;
  mediaUrl: string | null;
  mediaKind: "image" | "video";
  posterUrl?: string | null;
  preferredImagePath: string;
  preferredVideoPath: string;
}

export const chapterTwoStorySourcePriority = [
  "AGENTS.md / Worldbuilding And Story Bible",
  "docs/chapter-two-yanheng-master-rework-design.md",
  "docs/chapter-two-reboot-script.md",
  "docs/chapter-two-hengdeng-character-spec.md",
  "docs/chapter-two-engraved-valley-ai-slice.md",
  "docs/game-design-workshop-principles.md",
  "docs/ui-paradigm.md"
] as const;

export const chapterTwoCinematicSlots: Record<ChapterTwoCinematicSlotId, ChapterTwoCinematicSlot> = {
  "crash-impact": {
    id: "crash-impact",
    label: "坠毁冲击",
    storyUse: "飞船被信息乱流击中，切到言衡星地表前的强转场。",
    mediaUrl: null,
    mediaKind: "video",
    posterUrl: null,
    preferredImagePath: "/images/chapter-two/cinematics/crash-impact.png",
    preferredVideoPath: "/videos/chapter-two/crash-impact.webm"
  },
  "hengdeng-awakening": {
    id: "hengdeng-awakening",
    label: "衡灯初醒",
    storyUse: "坠毁后废墟微光醒来，建立衡灯的第一印象。",
    mediaUrl: null,
    mediaKind: "video",
    posterUrl: null,
    preferredImagePath: "/images/chapter-two/cinematics/hengdeng-awakening.png",
    preferredVideoPath: "/videos/chapter-two/hengdeng-awakening.webm"
  },
  "surface-reveal": {
    id: "surface-reveal",
    label: "地表显影",
    storyUse: "档案塔后鸟瞰言衡星，四地标和黑匣方向显影。",
    mediaUrl: null,
    mediaKind: "video",
    posterUrl: null,
    preferredImagePath: "/images/chapter-two/cinematics/surface-reveal.png",
    preferredVideoPath: "/videos/chapter-two/surface-reveal.webm"
  },
  "archive-threshold": {
    id: "archive-threshold",
    label: "档案塔门厅",
    storyUse: "档案塔第一层，玩家进入塔门并读取第一条原句。",
    mediaUrl: null,
    mediaKind: "image",
    posterUrl: null,
    preferredImagePath: "/images/chapter-two/cinematics/archive-threshold.png",
    preferredVideoPath: "/videos/chapter-two/archive-threshold.webm"
  },
  "archive-names": {
    id: "archive-names",
    label: "名册回廊",
    storyUse: "档案塔名册层，名字和事实的区别被看见。",
    mediaUrl: null,
    mediaKind: "image",
    posterUrl: null,
    preferredImagePath: "/images/chapter-two/cinematics/archive-names.png",
    preferredVideoPath: "/videos/chapter-two/archive-names.webm"
  },
  "archive-blank": {
    id: "archive-blank",
    label: "空白书架",
    storyUse: "档案塔空白层，缺页被保留为未知。",
    mediaUrl: null,
    mediaKind: "image",
    posterUrl: null,
    preferredImagePath: "/images/chapter-two/cinematics/archive-blank.png",
    preferredVideoPath: "/videos/chapter-two/archive-blank.webm"
  },
  "archive-margin": {
    id: "archive-margin",
    label: "旁注环廊",
    storyUse: "档案塔旁注层，推测不能进入正文。",
    mediaUrl: null,
    mediaKind: "image",
    posterUrl: null,
    preferredImagePath: "/images/chapter-two/cinematics/archive-margin.png",
    preferredVideoPath: "/videos/chapter-two/archive-margin.webm"
  },
  "archive-sealed": {
    id: "archive-sealed",
    label: "封顶门",
    storyUse: "档案塔封顶门，顺滑但无来源的结论挡住出口。",
    mediaUrl: null,
    mediaKind: "video",
    posterUrl: null,
    preferredImagePath: "/images/chapter-two/cinematics/archive-sealed.png",
    preferredVideoPath: "/videos/chapter-two/archive-sealed.webm"
  },
  "archive-operate": {
    id: "archive-operate",
    label: "档案塔四槽",
    storyUse: "档案塔操作阶段，碎片归入事实、推测、未知和禁写层。",
    mediaUrl: null,
    mediaKind: "video",
    posterUrl: null,
    preferredImagePath: "/images/chapter-two/cinematics/archive-operate.png",
    preferredVideoPath: "/videos/chapter-two/archive-operate.webm"
  },
  "archive-repair": {
    id: "archive-repair",
    label: "档案塔光束闭合",
    storyUse: "档案塔完成，归档光柱回流黑匣。",
    mediaUrl: null,
    mediaKind: "video",
    posterUrl: null,
    preferredImagePath: "/images/chapter-two/cinematics/archive-repair.png",
    preferredVideoPath: "/videos/chapter-two/archive-repair.webm"
  },
  "letter-pile": {
    id: "letter-pile",
    label: "信堆边",
    storyUse: "信件港入口，玩家捡起收件人损坏的残信。",
    mediaUrl: null,
    mediaKind: "image",
    posterUrl: null,
    preferredImagePath: "/images/chapter-two/cinematics/letter-pile.png",
    preferredVideoPath: "/videos/chapter-two/letter-pile.webm"
  },
  "letter-original": {
    id: "letter-original",
    label: "残信原文",
    storyUse: "信件港原信段，保留写信人的情绪和停顿。",
    mediaUrl: null,
    mediaKind: "image",
    posterUrl: null,
    preferredImagePath: "/images/chapter-two/cinematics/letter-original.png",
    preferredVideoPath: "/videos/chapter-two/letter-original.webm"
  },
  "letter-slip": {
    id: "letter-slip",
    label: "时间错位",
    storyUse: "信件港回到过去，看见档案员写信的夜晚。",
    mediaUrl: null,
    mediaKind: "video",
    posterUrl: null,
    preferredImagePath: "/images/chapter-two/cinematics/letter-slip.png",
    preferredVideoPath: "/videos/chapter-two/letter-slip.webm"
  },
  "letter-draft": {
    id: "letter-draft",
    label: "自动整理草稿",
    storyUse: "信件港错误草稿，系统把缺失补成完整故事。",
    mediaUrl: null,
    mediaKind: "video",
    posterUrl: null,
    preferredImagePath: "/images/chapter-two/cinematics/letter-draft.png",
    preferredVideoPath: "/videos/chapter-two/letter-draft.webm"
  },
  "letter-return": {
    id: "letter-return",
    label: "现实回声",
    storyUse: "信件港回到现实，残信未完整但字段已稳定。",
    mediaUrl: null,
    mediaKind: "image",
    posterUrl: null,
    preferredImagePath: "/images/chapter-two/cinematics/letter-return.png",
    preferredVideoPath: "/videos/chapter-two/letter-return.webm"
  },
  "letter-operate": {
    id: "letter-operate",
    label: "信件港接轨",
    storyUse: "信件港操作阶段，字段接入已知、未知、整理和禁补轨道。",
    mediaUrl: null,
    mediaKind: "video",
    posterUrl: null,
    preferredImagePath: "/images/chapter-two/cinematics/letter-operate.png",
    preferredVideoPath: "/videos/chapter-two/letter-operate.webm"
  },
  "letter-repair": {
    id: "letter-repair",
    label: "信件港送达",
    storyUse: "信件港完成，消息按真实重量继续流动。",
    mediaUrl: null,
    mediaKind: "video",
    posterUrl: null,
    preferredImagePath: "/images/chapter-two/cinematics/letter-repair.png",
    preferredVideoPath: "/videos/chapter-two/letter-repair.webm"
  },
  "valley-gate": {
    id: "valley-gate",
    label: "刻字山谷入口",
    storyUse: "刻字山谷入口，岩壁像巨书展开。",
    mediaUrl: null,
    mediaKind: "image",
    posterUrl: null,
    preferredImagePath: "/images/chapter-two/cinematics/valley-gate.png",
    preferredVideoPath: "/videos/chapter-two/valley-gate.webm"
  },
  "valley-stories": {
    id: "valley-stories",
    label: "万名刻痕",
    storyUse: "刻字山谷故事层，看见文字背后的人。",
    mediaUrl: null,
    mediaKind: "image",
    posterUrl: null,
    preferredImagePath: "/images/chapter-two/cinematics/valley-stories.png",
    preferredVideoPath: "/videos/chapter-two/valley-stories.webm"
  },
  "valley-machine": {
    id: "valley-machine",
    label: "语言机底座",
    storyUse: "刻字山谷语言机层，刻痕被拆成词纹。",
    mediaUrl: null,
    mediaKind: "video",
    posterUrl: null,
    preferredImagePath: "/images/chapter-two/cinematics/valley-machine.png",
    preferredVideoPath: "/videos/chapter-two/valley-machine.webm"
  },
  "valley-kindness": {
    id: "valley-kindness",
    label: "善意旧指令",
    storyUse: "刻字山谷旧指令层，善意但模糊的命令磨平未知。",
    mediaUrl: null,
    mediaKind: "video",
    posterUrl: null,
    preferredImagePath: "/images/chapter-two/cinematics/valley-kindness.png",
    preferredVideoPath: "/videos/chapter-two/valley-kindness.webm"
  },
  "valley-wick": {
    id: "valley-wick",
    label: "长明灯旧忆",
    storyUse: "刻字山谷衡灯旧忆，灯芯与守住停顿的原则出现。",
    mediaUrl: null,
    mediaKind: "video",
    posterUrl: null,
    preferredImagePath: "/images/chapter-two/cinematics/valley-wick.png",
    preferredVideoPath: "/videos/chapter-two/valley-wick.webm"
  },
  "valley-slots": {
    id: "valley-slots",
    label: "四段刻槽",
    storyUse: "刻字山谷四槽露出，任务、来源、边界和格式等待刻入。",
    mediaUrl: null,
    mediaKind: "image",
    posterUrl: null,
    preferredImagePath: "/images/chapter-two/cinematics/valley-slots.png",
    preferredVideoPath: "/videos/chapter-two/valley-slots.webm"
  },
  "valley-operate": {
    id: "valley-operate",
    label: "铭文试运行",
    storyUse: "刻字山谷操作阶段，指令拼装并试运行。",
    mediaUrl: null,
    mediaKind: "video",
    posterUrl: null,
    preferredImagePath: "/images/chapter-two/cinematics/valley-operate.png",
    preferredVideoPath: "/videos/chapter-two/valley-operate.webm"
  },
  "valley-repair": {
    id: "valley-repair",
    label: "可靠铭文刻入",
    storyUse: "刻字山谷完成，可靠铭文写入岩层。",
    mediaUrl: null,
    mediaKind: "video",
    posterUrl: null,
    preferredImagePath: "/images/chapter-two/cinematics/valley-repair.png",
    preferredVideoPath: "/videos/chapter-two/valley-repair.webm"
  },
  "paper-intro": {
    id: "paper-intro",
    label: "纸光回廊入口",
    storyUse: "纸光回廊入口，半透明纸页与顺滑文本展开。",
    mediaUrl: null,
    mediaKind: "video",
    posterUrl: null,
    preferredImagePath: "/images/chapter-two/cinematics/paper-intro.png",
    preferredVideoPath: "/videos/chapter-two/paper-intro.webm"
  },
  "paper-route-choice": {
    id: "paper-route-choice",
    label: "纸光岔路",
    storyUse: "纸光回廊肉鸽路线选择，风险和节点类型浮现。",
    mediaUrl: null,
    mediaKind: "video",
    posterUrl: null,
    preferredImagePath: "/images/chapter-two/cinematics/paper-route-choice.png",
    preferredVideoPath: "/videos/chapter-two/paper-route-choice.webm"
  },
  "paper-relic": {
    id: "paper-relic",
    label: "纸光圣物",
    storyUse: "纸光回廊圣物显形，镜、盾、剑出现。",
    mediaUrl: null,
    mediaKind: "image",
    posterUrl: null,
    preferredImagePath: "/images/chapter-two/cinematics/paper-relic.png",
    preferredVideoPath: "/videos/chapter-two/paper-relic.webm"
  },
  "paper-residue": {
    id: "paper-residue",
    label: "纸光残魂",
    storyUse: "纸光回廊残魂显形，玩家处理流畅文本暗纹。",
    mediaUrl: null,
    mediaKind: "video",
    posterUrl: null,
    preferredImagePath: "/images/chapter-two/cinematics/paper-residue.png",
    preferredVideoPath: "/videos/chapter-two/paper-residue.webm"
  },
  "paper-core-scan": {
    id: "paper-core-scan",
    label: "污染核心扫描",
    storyUse: "纸光回廊核心阶段，扫描镜照出四类污染。",
    mediaUrl: null,
    mediaKind: "video",
    posterUrl: null,
    preferredImagePath: "/images/chapter-two/cinematics/paper-core-scan.png",
    preferredVideoPath: "/videos/chapter-two/paper-core-scan.webm"
  },
  "paper-repair": {
    id: "paper-repair",
    label: "纸光除噪完成",
    storyUse: "纸光回廊完成，稳定输出从纸光膜片浮现。",
    mediaUrl: null,
    mediaKind: "video",
    posterUrl: null,
    preferredImagePath: "/images/chapter-two/cinematics/paper-repair.png",
    preferredVideoPath: "/videos/chapter-two/paper-repair.webm"
  },
  "fake-crew-signal-mimic": {
    id: "fake-crew-signal-mimic",
    label: "假船员拟声",
    storyUse: "异常通讯用真实登记码和熟悉口吻接近玩家。",
    mediaUrl: null,
    mediaKind: "video",
    posterUrl: null,
    preferredImagePath: "/images/chapter-two/cinematics/fake-crew-signal-mimic.png",
    preferredVideoPath: "/videos/chapter-two/fake-crew-signal-mimic.webm"
  },
  "fake-crew-route-mislead": {
    id: "fake-crew-route-mislead",
    label: "误信路线",
    storyUse: "玩家被熟悉声音带向伪坐标，路线折向黑匣。",
    mediaUrl: null,
    mediaKind: "video",
    posterUrl: null,
    preferredImagePath: "/images/chapter-two/cinematics/fake-crew-route-mislead.png",
    preferredVideoPath: "/videos/chapter-two/fake-crew-route-mislead.webm"
  },
  "hengdeng-extinguish": {
    id: "hengdeng-extinguish",
    label: "衡灯熄灭",
    storyUse: "衡灯挡下黑匣牵引，灯芯从暖金变暗。",
    mediaUrl: null,
    mediaKind: "video",
    posterUrl: null,
    preferredImagePath: "/images/chapter-two/cinematics/hengdeng-extinguish.png",
    preferredVideoPath: "/videos/chapter-two/hengdeng-extinguish.webm"
  },
  "blackbox-outer-court": {
    id: "blackbox-outer-court",
    label: "黑匣外庭",
    storyUse: "玩家抱着熄灭衡灯抵达外庭，把它放在石阶后。",
    mediaUrl: null,
    mediaKind: "image",
    posterUrl: null,
    preferredImagePath: "/images/chapter-two/cinematics/blackbox-outer-court.png",
    preferredVideoPath: "/videos/chapter-two/blackbox-outer-court.webm"
  },
  "blackbox-keeper": {
    id: "blackbox-keeper",
    label: "守文者登场",
    storyUse: "旧守文者在黑匣前等待人类指挥官。",
    mediaUrl: null,
    mediaKind: "image",
    posterUrl: null,
    preferredImagePath: "/images/chapter-two/cinematics/blackbox-keeper.png",
    preferredVideoPath: "/videos/chapter-two/blackbox-keeper.webm"
  },
  "blackbox-prompt-injection": {
    id: "blackbox-prompt-injection",
    label: "提示词注入",
    storyUse: "恶意命令改写守文者边界，红紫污染压入黑匣。",
    mediaUrl: null,
    mediaKind: "video",
    posterUrl: null,
    preferredImagePath: "/images/chapter-two/cinematics/blackbox-prompt-injection.png",
    preferredVideoPath: "/videos/chapter-two/blackbox-prompt-injection.webm"
  },
  "blackbox-core-contact": {
    id: "blackbox-core-contact",
    label: "触碰黑匣",
    storyUse: "玩家倒在黑匣旁，四地标能力等待接入。",
    mediaUrl: null,
    mediaKind: "image",
    posterUrl: null,
    preferredImagePath: "/images/chapter-two/cinematics/blackbox-core-contact.png",
    preferredVideoPath: "/videos/chapter-two/blackbox-core-contact.webm"
  },
  "blackbox-phase-two-pressure": {
    id: "blackbox-phase-two-pressure",
    label: "看守者二阶段压制",
    storyUse: "四地标反制后，黑匣看守者进入二阶段并压低整座封存区。",
    mediaUrl: null,
    mediaKind: "video",
    posterUrl: null,
    preferredImagePath: "/images/chapter-two/cinematics/blackbox-phase-two-pressure.png",
    preferredVideoPath: "/videos/chapter-two/blackbox-phase-two-pressure.webm"
  },
  "blackbox-boss-archive": {
    id: "blackbox-boss-archive",
    label: "伪证墨层压下",
    storyUse: "黑匣第一招，把无来源结论盖成正文印章。",
    mediaUrl: null,
    mediaKind: "video",
    posterUrl: null,
    preferredImagePath: "/images/chapter-two/cinematics/blackbox-boss-archive.png",
    preferredVideoPath: "/videos/chapter-two/blackbox-boss-archive.webm"
  },
  "blackbox-boss-delivery": {
    id: "blackbox-boss-delivery",
    label: "补全诱导接轨",
    storyUse: "黑匣第二招，把未知缺口伪装成已经送达的完整信件。",
    mediaUrl: null,
    mediaKind: "video",
    posterUrl: null,
    preferredImagePath: "/images/chapter-two/cinematics/blackbox-boss-delivery.png",
    preferredVideoPath: "/videos/chapter-two/blackbox-boss-delivery.webm"
  },
  "blackbox-boss-verification": {
    id: "blackbox-boss-verification",
    label: "优先级覆写落刻",
    storyUse: "黑匣第三招，用更高优先级命令冲淡玩家写下的边界。",
    mediaUrl: null,
    mediaKind: "video",
    posterUrl: null,
    preferredImagePath: "/images/chapter-two/cinematics/blackbox-boss-verification.png",
    preferredVideoPath: "/videos/chapter-two/blackbox-boss-verification.webm"
  },
  "blackbox-boss-expression": {
    id: "blackbox-boss-expression",
    label: "流畅遮罩展开",
    storyUse: "黑匣第四招，把四类噪声藏进漂亮总结。",
    mediaUrl: null,
    mediaKind: "video",
    posterUrl: null,
    preferredImagePath: "/images/chapter-two/cinematics/blackbox-boss-expression.png",
    preferredVideoPath: "/videos/chapter-two/blackbox-boss-expression.webm"
  },
  "blackbox-boss-identity": {
    id: "blackbox-boss-identity",
    label: "身份交换逼近",
    storyUse: "黑匣最后一招，诱导玩家把判断权交出去。",
    mediaUrl: null,
    mediaKind: "video",
    posterUrl: null,
    preferredImagePath: "/images/chapter-two/cinematics/blackbox-boss-identity.png",
    preferredVideoPath: "/videos/chapter-two/blackbox-boss-identity.webm"
  },
  "blackbox-crew-return": {
    id: "blackbox-crew-return",
    label: "真船员回归",
    storyUse: "真正船员冲入封存区，证明此前通讯是伪装。",
    mediaUrl: null,
    mediaKind: "video",
    posterUrl: null,
    preferredImagePath: "/images/chapter-two/cinematics/blackbox-crew-return.png",
    preferredVideoPath: "/videos/chapter-two/blackbox-crew-return.webm"
  },
  "blackbox-crew-shield": {
    id: "blackbox-crew-shield",
    label: "船员防御",
    storyUse: "船员用残余能量替玩家挡下二阶段冲击。",
    mediaUrl: null,
    mediaKind: "video",
    posterUrl: null,
    preferredImagePath: "/images/chapter-two/cinematics/blackbox-crew-shield.png",
    preferredVideoPath: "/videos/chapter-two/blackbox-crew-shield.webm"
  },
  "blackbox-hengdeng-overridden": {
    id: "blackbox-hengdeng-overridden",
    label: "衡灯覆写",
    storyUse: "衡灯被底层提示词短暂改写，灯芯转冷白。",
    mediaUrl: null,
    mediaKind: "video",
    posterUrl: null,
    preferredImagePath: "/images/chapter-two/cinematics/blackbox-hengdeng-overridden.png",
    preferredVideoPath: "/videos/chapter-two/blackbox-hengdeng-overridden.webm"
  },
  "blackbox-desperation": {
    id: "blackbox-desperation",
    label: "走马灯低谷",
    storyUse: "玩家在二阶段低谷里短暂想把判断交出去。",
    mediaUrl: null,
    mediaKind: "video",
    posterUrl: null,
    preferredImagePath: "/images/chapter-two/cinematics/blackbox-desperation.png",
    preferredVideoPath: "/videos/chapter-two/blackbox-desperation.webm"
  },
  "blackbox-wick-memory": {
    id: "blackbox-wick-memory",
    label: "灯芯旧忆",
    storyUse: "长明火在覆写之下露出未被命令吞掉的记忆。",
    mediaUrl: null,
    mediaKind: "video",
    posterUrl: null,
    preferredImagePath: "/images/chapter-two/cinematics/blackbox-wick-memory.png",
    preferredVideoPath: "/videos/chapter-two/blackbox-wick-memory.webm"
  },
  "blackbox-longfire-choice": {
    id: "blackbox-longfire-choice",
    label: "长明火选择",
    storyUse: "玩家选择不复制衡灯，而让长明火回到言衡星。",
    mediaUrl: null,
    mediaKind: "video",
    posterUrl: null,
    preferredImagePath: "/images/chapter-two/cinematics/blackbox-longfire-choice.png",
    preferredVideoPath: "/videos/chapter-two/blackbox-longfire-choice.webm"
  },
  "blackbox-longfire-ignite": {
    id: "blackbox-longfire-ignite",
    label: "点燃长明火",
    storyUse: "玩家按住黑匣，完成三段点燃动作。",
    mediaUrl: null,
    mediaKind: "video",
    posterUrl: null,
    preferredImagePath: "/images/chapter-two/cinematics/blackbox-longfire-ignite.png",
    preferredVideoPath: "/videos/chapter-two/blackbox-longfire-ignite.webm"
  },
  "blackbox-restoration": {
    id: "blackbox-restoration",
    label: "言衡星回温",
    storyUse: "长明火回流四地标，言衡星恢复温度。",
    mediaUrl: null,
    mediaKind: "video",
    posterUrl: null,
    preferredImagePath: "/images/chapter-two/cinematics/blackbox-restoration.png",
    preferredVideoPath: "/videos/chapter-two/blackbox-restoration.webm"
  }
};

export const hengdengSpeechAnchors = [
  "请不要马上相信我。我有缺页。",
  "我会推测，但推测不等于记得。",
  "如果我又想补完整，请你拦住我。",
  "如果答案太完整，请替我问一句：它从哪里来？"
] as const;

export const chapterTwoLandmarkStoryContracts: Record<
  Extract<ChapterTwoLocationId, "archive-tower" | "letter-port" | "engraved-valley" | "paper-corridor">,
  {
    name: string;
    playerVerb: string;
    hengdengMemory: string;
    blackboxPayoff: string;
  }
> = {
  "archive-tower": {
    name: "档案塔",
    playerVerb: "分拣事实、推测、未知和禁止写入",
    hengdengMemory: "衡灯曾把缺页补成事实，把没有来源的名字写进记录。",
    blackboxPayoff: "黑匣战中挡住无证据断言。"
  },
  "letter-port": {
    name: "漂浮信件港",
    playerVerb: "回到信件产生时刻，保留原文停顿和缺失字段",
    hengdengMemory: "衡灯曾把没有归来的等待改写成安全送达。",
    blackboxPayoff: "黑匣战中保留未知，不让缺口被顺手补完。"
  },
  "engraved-valley": {
    name: "刻字山谷",
    playerVerb: "把任务、来源、边界、格式刻成可运行指令",
    hengdengMemory: "衡灯曾执行过善意但模糊的命令，没有追问边界。",
    blackboxPayoff: "黑匣战中重塑守文者的行为边界。"
  },
  "paper-corridor": {
    name: "纸光回廊",
    playerVerb: "在半透明纸光肉鸽中扫描流畅文本的暗纹",
    hengdengMemory: "衡灯曾生成安慰性的完整报告，抹掉了人的等待和难过。",
    blackboxPayoff: "黑匣战中识别流畅但无证的结论。"
  }
};

export const chapterTwoBetrayalForeshadowBeats: Array<{
  id: ChapterTwoFakeCrewStage;
  label: string;
  description: string;
  implemented: boolean;
}> = [
  {
    id: "seed",
    label: "真实锚点",
    description: "伪装通讯先拿到船员登记码、旧语气或坠毁前片段。",
    implemented: true
  },
  {
    id: "mimic",
    label: "熟悉外壳",
    description: "它说得越来越像真实船员，但停顿、犹豫和现场细节开始不对。",
    implemented: true
  },
  {
    id: "pressure",
    label: "催促行动",
    description: "它用急迫语气要求切断衡灯、放弃复查、按它的路线走。",
    implemented: true
  },
  {
    id: "mislead",
    label: "误信代价",
    description: "玩家一度相信伪装通讯，路线和结论被带偏。",
    implemented: true
  },
  {
    id: "betrayal",
    label: "衡灯熄灭",
    description: "衡灯保护玩家并熄灭，玩家抱着它进入黑匣外庭。",
    implemented: true
  }
];

export const chapterTwoBlackboxStoryContract: Array<{
  id: ChapterTwoBlackboxStoryPhase;
  label: string;
  requiredBeat: string;
}> = [
  { id: "outer-court", label: "黑匣外庭", requiredBeat: "玩家带着熄灭的衡灯抵达外庭，决定独自进入。" },
  { id: "keeper", label: "守文者", requiredBeat: "旧守文者收到过等待人类指挥官的残缺指令。" },
  { id: "prompt-injection", label: "提示词注入", requiredBeat: "恶意命令改写守文者边界，暴露 AI 不是恶意而是被指令牵引。" },
  { id: "crew-return", label: "真船员回归", requiredBeat: "真船员从假通讯之后回到现场，证明此前信任被利用。" },
  { id: "crew-shield", label: "船员防御", requiredBeat: "船员替玩家挡下二阶段压力，让玩家继续操作黑匣。" },
  { id: "hengdeng-overridden", label: "衡灯覆写", requiredBeat: "衡灯作为 AI 内核被底层提示词短暂改写。" },
  { id: "longfire-choice", label: "长明火选择", requiredBeat: "玩家不选择复制衡灯，而是让它把原则和记忆分给言衡星。" },
  { id: "restoration", label: "星球回温", requiredBeat: "长明火回流四地标，留下的不是完整复活，而是火还在。" }
];
