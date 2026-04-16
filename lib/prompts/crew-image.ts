import type { PromptBlueprint } from "@/lib/prompts/types";
import { renderList, renderSections } from "@/lib/prompts/utils";

export interface CrewImagePromptInput {
  playerDescription: string;
  crewName: string;
  crewTitle: string;
  abilityTag: string;
  roleSummary: string;
  visualSubject: string;
  guardrails: string[];
  styleKeywords: string[];
  styleDirection: string;
  wardrobeDirection: string;
  parallelEchoNote: string;
  revision: number;
}

function compact(items: Array<string | null | undefined | false>) {
  return items.filter(Boolean).join("；");
}

export const crewImagePrompt: PromptBlueprint<CrewImagePromptInput> = {
  id: "crew-image-v3",
  label: "船员形象生成提示词 V3",
  goal: "把船员文本设定收束成主体明确、风格统一、适合档案展示的单人角色图像提示词。",
  inputGuide: [
    "玩家主描述是最高优先级，必须压过默认模板。",
    "主体物种和角色类型必须锁定，不能被自动替换。",
    "平行宇宙回响只允许改变外形细节，不改变角色核心身份。",
    "除非玩家明确要求拟人化、宇航服或飞船制服，否则不要自动加入这些元素。"
  ],
  outputGuide: [
    "返回一条适合图像模型的中文主提示词。",
    "提示词要明确主体、构图、风格与安全边界，不输出解释。"
  ],
  system: renderSections([
    {
      title: "task",
      body: [
        "你正在为主舰船员档案生成一位伙伴的正式形象。",
        "玩家刚刚输入的主体、服装和画风要求高于默认模板，必须优先执行。"
      ]
    },
    {
      title: "must-do",
      body: renderList([
        "主体类型必须严格遵守玩家描述和系统锁定",
        "单人角色，完整主体清楚可见，适合档案页展示",
        "保留飞船世界的角色感、收藏感和远征感，但不要强行套统一机甲模板",
        "全年龄友好、安全、不恐怖",
        "如果玩家要求写实、半写实、厚涂或动画风，必须服从，不要强行拉回默认二次元档案风",
        "画面中绝对不要出现任何文字、字母、数字、标识、Logo、水印、铭牌、招牌、徽章字样或可读符号"
      ])
    },
    {
      title: "must-avoid",
      body: renderList([
        "重二次元脸、夸张动漫五官、偶像立绘感",
        "成人写真棚拍感、性感化处理、擦边气质",
        "恐怖化、阴暗化、血腥化",
        "忽略玩家主体描述，把动物默认生成人类",
        "忽略玩家主体描述，把人类角色默认生成兽耳、兽尾、非人附肢或混种主体",
        "把狗、猫、狐狸等非人主体画成人面兽身、神像、兽人或狮身人面像",
        "强烈赛璐璐动漫上色、廉价抽卡立绘、网红插画脸",
        "画面里出现名字、字幕、印章、UI 文本、Logo、水印、背景招牌、铭牌、徽章文字或任何字母数字"
      ])
    }
  ]),
  developer: renderSections([
    {
      title: "image-contract",
      body: [
        "输出只服务于单张角色图。",
        "平行宇宙回响表示同一角色的另一版外形，不代表另一个人。",
        "默认使用中文，不输出 JSON，不解释规则。"
      ]
    }
  ]),
  buildUserPrompt: (input) =>
    compact([
      `主体优先：${input.visualSubject}，这是最高优先级，不可替换成其他物种或其他主体类型`,
      input.playerDescription ? `玩家原始描述：${input.playerDescription}` : null,
      `角色语义：${input.roleSummary}`,
      input.styleKeywords.length > 0 ? `关键词：${input.styleKeywords.join("、")}` : null,
      `主体约束：${input.guardrails.join("；")}`,
      `画风方向：${input.styleDirection}`,
      `服装方向：${input.wardrobeDirection}`,
      "主体一致性：如果玩家描述的是狗、猫、狐狸、鸟、兔子等非人角色，就必须直接画成对应动物或明显对应的非人伙伴；不要改成人脸、不要做兽人、不要做神像化混种主体",
      "人类约束：如果玩家描述的是人类少女、人类少年、人类战士、人类法师、人类角色，就不要自动长出猫耳、兽耳、尾巴、角、翅膀或其他非人附肢，除非玩家明确要求",
      "画面要求：单人角色插画，完整主体优先，大半身或全身清楚可见，角色站姿或自然悬浮姿态，主体居中，不要做带标题框、信息栏或卡牌版式的角色卡",
      "文字限制：整张图片必须是纯图像，不能出现任何可读文字、字母、数字、标题、标牌、路牌、徽章字样、水印、Logo、UI 文本或背景招牌",
      "零容忍规则：如果画面里出现任何一个字、一个字母、一个数字、一个符号标签，这张图就算失败，必须直接避免",
      "背景要求：背景可以来自角色所属星球、遗迹、荒原、林地、雾井、港口或抽象能量场，不必统一成飞船内景，也不要默认宇航服、机械装甲或科技制服；只有玩家明确提到时才加入",
      "风格要求：保持角色感、设定图感和可收藏性，不低龄幼态，不廉价手游立绘，不企业宣传插画，不博物馆神像感",
      `平行宇宙回响：${input.parallelEchoNote}`
    ])
};
