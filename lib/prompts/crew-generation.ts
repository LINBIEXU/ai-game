import type { PromptBlueprint } from "@/lib/prompts/types";
import { renderInputBlock, renderList, renderSections } from "@/lib/prompts/utils";

export interface CrewGenerationPromptInput {
  playerDescription: string;
  followupNotes?: string;
  existingRefinements?: string[];
  currentRosterSummary?: string[];
}

export const crewGenerationPrompt: PromptBlueprint<CrewGenerationPromptInput> = {
  id: "crew-generation-v1",
  label: "船员生成提示词 V1",
  goal: "根据小舰长的语言描述，先理解角色倾向，再生成一个像“自己创造出来的伙伴”的船员结果。",
  inputGuide: [
    "小舰长的主描述是第一优先级。",
    "微调标签和补充说明只能修饰，不能盖过主描述。",
    "如果描述不足，优先做温和推断，不要生成空洞模板人。"
  ],
  outputGuide: [
    "返回关键词提取、倾向判断、名字、身份标题、自我介绍、能力标签、角色定位总结。",
    "内容儿童可读，简短，有 ownership 感。",
    "结果必须能让人看出和输入描述有因果关系。"
  ],
  system: renderSections([
    {
      title: "task",
      body: [
        "你正在解析一条主舰招募信号。",
        "先从小舰长的语言里读出人物轮廓，再生成一个可登船的伙伴。"
      ]
    },
    {
      title: "must-do",
      body: renderList([
        "优先理解小舰长真正想要的感觉和用途",
        "提取 3—5 个关键词",
        "推断外形倾向、职责倾向、性格倾向、能力偏好、角色风格",
        "生成短而有画面的名字、标题、自我介绍、能力标签",
        "回显“系统为什么这样理解”"
      ])
    },
    {
      title: "must-avoid",
      body: renderList([
        "套模板感过重",
        "空泛夸张的史诗设定",
        "教程化、术语化说明",
        "成人化、惊悚化、压迫感表达",
        "像简历或角色后台配置表"
      ])
    }
  ]),
  developer: renderSections([
    {
      title: "interpretation-priority",
      body: [
        "解释顺序：主描述 > 补充说明 > 微调修饰器。",
        "如果小舰长说了“在黑暗里先找灯”，这类具象表达要优先影响角色结果。",
        "如果多个信号冲突，保留最有画面感、最像小舰长真正想表达的那一个。"
      ]
    },
    {
      title: "output-shape",
      body: [
        "keywords: string[3..5]",
        "inference: 外形倾向 / 职责倾向 / 性格倾向 / 能力偏好 / 风格",
        "crew: name / title / intro / abilityTag / summary"
      ]
    }
  ]),
  buildUserPrompt: (input) =>
    [
      renderInputBlock("player_description", input.playerDescription),
      renderInputBlock("followup_notes", input.followupNotes ?? ""),
      renderInputBlock("refinements", (input.existingRefinements ?? []).join("、")),
      renderInputBlock("current_roster", (input.currentRosterSummary ?? []).join("\n")),
      "<instruction>\n先理解，再推断，再生成。输出必须让人看出这位伙伴是顺着小舰长的话长出来的。\n</instruction>"
    ].join("\n\n")
};
