import type { PromptSection } from "@/lib/prompts/types";

function normalizeBody(body: string | string[]) {
  return Array.isArray(body) ? body.join("\n") : body;
}

export function renderSections(sections: PromptSection[]) {
  return sections
    .map((section) => `<${section.title}>\n${normalizeBody(section.body)}\n</${section.title}>`)
    .join("\n\n");
}

export function renderList(items: string[]) {
  return items.map((item) => `- ${item}`).join("\n");
}

export function renderInputBlock(title: string, value: string) {
  return `<${title}>\n${value.trim() || "(empty)"}\n</${title}>`;
}
