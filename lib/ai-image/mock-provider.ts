import type { CrewImageGenerationRequest, CrewImageGenerationResult, ImageGenerationProvider } from "@/types/ai";
import { providerPromptBindings } from "@/lib/prompts/provider-bindings";

function encodeSvg(svg: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function gradientForCrew(formType: string) {
  if (formType === "mechanical") return ["#99f6e4", "#0f172a"];
  if (formType === "biological") return ["#86efac", "#052e16"];
  if (formType === "energy") return ["#c4b5fd", "#172554"];
  return ["#fcd34d", "#4c0519"];
}

function silhouetteForSubject(subject: string) {
  if (subject.includes("猫")) {
    return `
      <ellipse cx="384" cy="585" rx="120" ry="152" fill="rgba(255,255,255,0.16)" />
      <circle cx="384" cy="310" r="102" fill="rgba(255,255,255,0.2)" />
      <polygon points="320,238 352,168 382,246" fill="rgba(255,255,255,0.18)" />
      <polygon points="448,238 416,168 386,246" fill="rgba(255,255,255,0.18)" />
      <path d="M470 585c78 16 92 108 38 150" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="26" stroke-linecap="round"/>
      <circle cx="352" cy="298" r="9" fill="rgba(255,255,255,0.82)" />
      <circle cx="416" cy="298" r="9" fill="rgba(255,255,255,0.82)" />
      <path d="M366 338h36" stroke="rgba(255,255,255,0.65)" stroke-width="8" stroke-linecap="round" />
    `;
  }

  if (subject.includes("犬") || subject.includes("狐")) {
    return `
      <ellipse cx="384" cy="588" rx="126" ry="150" fill="rgba(255,255,255,0.15)" />
      <circle cx="384" cy="308" r="98" fill="rgba(255,255,255,0.2)" />
      <polygon points="330,236 354,172 384,246" fill="rgba(255,255,255,0.18)" />
      <polygon points="438,236 414,172 384,246" fill="rgba(255,255,255,0.18)" />
      <path d="M360 332c20 18 48 18 68 0" stroke="rgba(255,255,255,0.52)" stroke-width="8" stroke-linecap="round" />
      <circle cx="352" cy="294" r="9" fill="rgba(255,255,255,0.82)" />
      <circle cx="416" cy="294" r="9" fill="rgba(255,255,255,0.82)" />
    `;
  }

  if (subject.includes("鸟")) {
    return `
      <ellipse cx="384" cy="575" rx="118" ry="160" fill="rgba(255,255,255,0.14)" />
      <circle cx="384" cy="296" r="88" fill="rgba(255,255,255,0.2)" />
      <path d="M250 432c78 36 118 44 134 62" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="28" stroke-linecap="round" />
      <path d="M518 432c-78 36 -118 44 -134 62" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="28" stroke-linecap="round" />
      <path d="M384 316l24 18-24 14-24-14z" fill="rgba(255,255,255,0.56)" />
      <circle cx="362" cy="282" r="8" fill="rgba(255,255,255,0.82)" />
      <circle cx="406" cy="282" r="8" fill="rgba(255,255,255,0.82)" />
    `;
  }

  if (subject.includes("能量")) {
    return `
      <circle cx="384" cy="328" r="112" fill="rgba(255,255,255,0.26)" />
      <ellipse cx="384" cy="570" rx="122" ry="168" fill="rgba(255,255,255,0.12)" />
      <ellipse cx="384" cy="520" rx="180" ry="82" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="16" />
      <ellipse cx="384" cy="632" rx="148" ry="60" fill="none" stroke="rgba(255,255,255,0.16)" stroke-width="12" />
    `;
  }

  if (subject.includes("机械")) {
    return `
      <rect x="286" y="420" width="196" height="266" rx="72" fill="rgba(255,255,255,0.14)" />
      <rect x="306" y="210" width="156" height="166" rx="54" fill="rgba(255,255,255,0.2)" />
      <circle cx="352" cy="280" r="10" fill="rgba(255,255,255,0.82)" />
      <circle cx="416" cy="280" r="10" fill="rgba(255,255,255,0.82)" />
      <rect x="332" y="324" width="104" height="12" rx="6" fill="rgba(255,255,255,0.55)" />
      <path d="M274 516h-44M494 516h44" stroke="rgba(255,255,255,0.24)" stroke-width="22" stroke-linecap="round" />
    `;
  }

  return `
    <ellipse cx="384" cy="582" rx="122" ry="154" fill="rgba(255,255,255,0.14)" />
    <circle cx="384" cy="296" r="96" fill="rgba(255,255,255,0.2)" />
    <circle cx="352" cy="280" r="10" fill="rgba(255,255,255,0.82)" />
    <circle cx="416" cy="280" r="10" fill="rgba(255,255,255,0.82)" />
    <rect x="332" y="322" width="104" height="12" rx="6" fill="rgba(255,255,255,0.55)" />
  `;
}

function echoLabel(revision: number) {
  return revision <= 1 ? "主宇宙回响" : `平行回响 ${revision}`;
}

function echoNote(subject: string, revision: number) {
  const notes = [
    `${subject} 的基础轮廓与主舰第一次完成同步。`,
    `${subject} 保持稳定，只是外层服装与光谱温度来自另一条分支。`,
    `${subject} 的身份没有改变，这一版更像从侧向宇宙投来的影像。`
  ];

  return notes[Math.max(0, revision - 1) % notes.length];
}

function mockCrewSvg(request: CrewImageGenerationRequest) {
  const { crew } = request;
  const [accent, deep] = gradientForCrew(crew.formType);
  const keywords = crew.signalKeywords.slice(0, 3).join(" · ") || crew.abilityTag;
  const summary = `${crew.name} / ${crew.abilityTag}`;
  const silhouette = silhouetteForSubject(crew.visualSubject);

  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="768" height="960" viewBox="0 0 768 960">
    <defs>
      <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stop-color="${accent}" stop-opacity="0.92"/>
        <stop offset="100%" stop-color="${deep}" stop-opacity="1"/>
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="34%" r="46%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.52"/>
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="768" height="960" fill="#020617"/>
    <rect x="32" y="32" width="704" height="896" rx="44" fill="url(#bg)" opacity="0.2" stroke="rgba(255,255,255,0.12)"/>
    <circle cx="384" cy="280" r="210" fill="url(#glow)" />
    ${silhouette}
    <text x="64" y="812" fill="rgba(255,255,255,0.96)" font-family="Arial, sans-serif" font-size="42" font-weight="700">${summary}</text>
    <text x="64" y="862" fill="rgba(255,255,255,0.72)" font-family="Arial, sans-serif" font-size="24">${crew.title}</text>
    <text x="64" y="904" fill="rgba(255,255,255,0.56)" font-family="Arial, sans-serif" font-size="22">${crew.visualSubject} · ${keywords}</text>
  </svg>
  `;
}

export const mockCrewImageProvider: ImageGenerationProvider = {
  mode: "mock",
  providerId: "mock",
  prompts: {
    worldRules: providerPromptBindings.worldRules,
    generateCrewImage: providerPromptBindings.generateCrewImage
  },
  generateCrewImage(request: CrewImageGenerationRequest): CrewImageGenerationResult {
    const bundle = providerPromptBindings.generateCrewImage(request);
    const revision = request.variant ?? 1;

    return {
      asset: {
        imageUrl: encodeSvg(mockCrewSvg(request)),
        prompt: bundle.user,
        negativePrompt: bundle.negative,
        providerId: "mock",
        styleLabel: echoLabel(revision),
        echoNote: echoNote(request.crew.visualSubject, revision),
        updatedAt: Date.now(),
        revision
      }
    };
  }
};
