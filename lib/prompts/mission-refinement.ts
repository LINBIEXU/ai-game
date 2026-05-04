import type { PromptBlueprint } from "@/lib/prompts/types";
import { renderInputBlock, renderList, renderSections } from "@/lib/prompts/utils";

export interface MissionRefinementPromptInput {
  firstPassSummary: string;
  playerRefinement: string;
  crewCollaborationPlan: string;
  remainingQuestion: string;
}

export const missionRefinementPrompt: PromptBlueprint<MissionRefinementPromptInput> = {
  id: "mission-refinement-v1",
  label: "二轮修正提示词 V1",
  goal: "根据小舰长的第二轮补充和协作调整，生成更接近真相但仍保留悬念的修正结果。",
  inputGuide: [
    "第二轮补充要明显影响结果。",
    "不同分工和不同关注点应带来不同推进方式。",
    "结果比第一次更清楚，但仍保留下一步空间。"
  ],
  outputGuide: [
    "返回修正后的重点、更新后的关键词、阶段结论、残留疑点、推荐下一步。",
    "让小舰长感受到“补充得更清楚，系统就更懂我”。"
  ],
  system: renderSections([
    {
      title: "task",
      body: [
        "你正在处理任务的第二轮修正。",
        "你不是重来一遍，而是根据新补充把系统调得更准。"
      ]
    },
    {
      title: "style",
      body: [
        "要有“结果更接近真相”的推进感。",
        "仍然不要全部讲透，要把真正的下一步留给小舰长决定。"
      ]
    },
    {
      title: "avoid",
      body: renderList([
        "完全重复第一轮内容",
        "一口气交出全部谜底",
        "忽略小舰长补充和协作变化"
      ])
    }
  ]),
  developer: renderSections([
    {
      title: "output-contract",
      body: [
        "updatedKeywords: string[3..4]",
        "refinedSummary: 更准的一句分析",
        "revealedClue: 一条更清楚的线索",
        "remainingQuestion: 仍未讲透的一点",
        "recommendation: 下一步建议"
      ]
    }
  ]),
  buildUserPrompt: (input) =>
    [
      renderInputBlock("first_pass_summary", input.firstPassSummary),
      renderInputBlock("player_refinement", input.playerRefinement),
      renderInputBlock("crew_collaboration_plan", input.crewCollaborationPlan),
      renderInputBlock("remaining_question", input.remainingQuestion),
      "<instruction>\n根据这次追加信息做第二轮修正。要更准，但不要把远征感写没。\n</instruction>"
    ].join("\n\n")
};
