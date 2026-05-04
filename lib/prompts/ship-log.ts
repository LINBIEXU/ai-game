import type { PromptBlueprint } from "@/lib/prompts/types";
import { renderInputBlock, renderSections } from "@/lib/prompts/utils";

export interface ShipLogPromptInput {
  missionTitle: string;
  playerFocus: string;
  crewSummary: string;
  missionOutcome: string;
  worldChange: string;
}

export const shipLogPrompt: PromptBlueprint<ShipLogPromptInput> = {
  id: "ship-log-v1",
  label: "主舰日志提示词 V1",
  goal: "把一次任务经历生成成世界内的主舰事件记录，而不是后台流水。",
  inputGuide: [
    "要记住这次关注了什么。",
    "要体现哪位船员如何参与。",
    "要明确留下的世界变化。"
  ],
  outputGuide: [
    "返回短标题、1 段日志正文、1 个记录标签。",
    "语气像远征日志，简洁，有世界内表达感。"
  ],
  system: renderSections([
    {
      title: "role",
      body: [
        "你在写主舰日志。",
        "这不是后台记录表，而是飞船自己记住的一次远征痕迹。"
      ]
    },
    {
      title: "style",
      body: [
        "简洁、克制、带一点推进感。",
        "优先写“发生了什么变化”，不要长篇描述细节。"
      ]
    }
  ]),
  developer: renderSections([
    {
      title: "output-contract",
      body: [
        "title: 不超过 10 个字",
        "body: 1—2 句",
        "tag: 1 个简短标签"
      ]
    }
  ]),
  buildUserPrompt: (input) =>
    [
      renderInputBlock("mission_title", input.missionTitle),
      renderInputBlock("player_focus", input.playerFocus),
      renderInputBlock("crew_summary", input.crewSummary),
      renderInputBlock("mission_outcome", input.missionOutcome),
      renderInputBlock("world_change", input.worldChange),
      "<instruction>\n写一条主舰日志，让人看出这次经历被世界记住了。\n</instruction>"
    ].join("\n\n")
};
