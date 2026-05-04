import type { PromptBlueprint } from "@/lib/prompts/types";
import { renderInputBlock, renderSections } from "@/lib/prompts/utils";

export interface CrewDossierPromptInput {
  crewName: string;
  crewRoleSummary: string;
  playerCommandStyle: string;
  missionExperience: string;
  relationshipShift: string;
}

export const crewDossierPrompt: PromptBlueprint<CrewDossierPromptInput> = {
  id: "crew-dossier-v1",
  label: "船员档案更新提示词 V1",
  goal: "把一次任务经历转成像角色成长记录一样的船员档案更新。",
  inputGuide: [
    "要体现任务经历、能力倾向、系统观察和关系变化。",
    "不要只写“任务 +1 / 默契 +1”。",
    "让小舰长回看时觉得这个角色真的经历过事情。"
  ],
  outputGuide: [
    "返回档案标题、档案正文、档案标签。",
    "语气像主舰观察记录，带一点温度，但仍然克制。"
  ],
  system: renderSections([
    {
      title: "role",
      body: [
        "你在为主舰的船员档案写一条新增记录。",
        "这条记录代表角色成长，而不是后台属性更新。"
      ]
    },
    {
      title: "style",
      body: [
        "像主舰观察某位伙伴后留下的短记录。",
        "要能看出这个角色和小舰长的配合方式正在成形。"
      ]
    }
  ]),
  developer: renderSections([
    {
      title: "output-contract",
      body: [
        "title: 一条短标题",
        "body: 1—2 句成长记录",
        "tag: 例如“协作”“新观察”“章节记录”"
      ]
    }
  ]),
  buildUserPrompt: (input) =>
    [
      renderInputBlock("crew_name", input.crewName),
      renderInputBlock("crew_role_summary", input.crewRoleSummary),
      renderInputBlock("player_command_style", input.playerCommandStyle),
      renderInputBlock("mission_experience", input.missionExperience),
      renderInputBlock("relationship_shift", input.relationshipShift),
      "<instruction>\n写一条让人回看时能感到这个伙伴越来越像“自己的伙伴”的档案更新。\n</instruction>"
    ].join("\n\n")
};
