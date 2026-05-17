# AGENTS.md

## Project Background

This repository is a Next.js 14 + React 18 educational AI game prototype. The current experience is centered on a classroom-friendly sci-fi journey: players awaken on a ship, recruit AI-generated crew, repair signals, restore memory/planet systems, return to the ship hub, manage a home-planet creation space, and continue into chapter two exploration.

The project has recently expanded from a mostly local single-player prototype into a deployable CloudBase-oriented app. Current work includes:

- Multi-scene game flow in `components/game/GameShell.tsx` and `hooks/useGameState.ts`.
- Chapter one trial/presentation flow, parent summary, result views, and teacher shortcut controls.
- Chapter two portal, mission, exploration, and result screens.
- Ship hub panels for crew bay, task board, archive, logbook, and crew chat.
- Home-planet hub interactions, gallery/storyboard/commission style outputs, and supporting state helpers.
- AI text and AI image provider layers with DashScope and mock fallback modes.
- Classroom profile, image upload/import, CloudBase save/session APIs, and deployment packaging.
- Static visual/audio assets under `public/`.

## Worldbuilding And Story Bible

Use this section as the narrative reference before changing game copy, scene order, hub calls to action, chapter-two content, or motherworld features. The current story is a classroom-safe sci-fi script about learning how to work with AI: clear goals, evidence, boundaries, unknowns, and human judgment.

### Working Title

《星舰启航：语言黑匣》

### Core Premise

很久以前，前文明建造了许多“AI 文明星球”。每颗星球保存一种能力：记录、表达、图像、规划、创造、判断。

后来，前文明越来越依赖 AI 给出答案，却忘了自己提出问题、检查证据、标出未知。文明网络开始失序，大量星球沉寂，只剩残缺档案和被封存的科技黑匣。

玩家是一名刚接入主舰的孩子。主舰 AI 不是万能老师，而是一艘失去部分记忆的飞船智脑。它需要孩子用清楚的描述、判断和选择，一步步帮它恢复能力。

The central learning theme is: AI can help, organize, and infer, but it does not automatically know facts. The child should learn to state the goal, keep judgment, mark unknowns, and give AI boundaries.

### Main Characters

- 玩家 / 小舰长: the child in class. They describe, choose, judge, and set boundaries for AI.
- 主舰 AI: the ship intelligence. It can understand and organize information, but it should repeatedly imply: “我会推测，不等于我知道事实。”
- 第一位船员: a companion generated from the child’s description. The child may optionally adjust form, duty, temperament, and talent. The crew member is an expedition partner, not an unlimited chat companion.
- 前文明档案官: a voice preserved in old records and black boxes. It warns later explorers not to let AI replace their own judgment.
- 失序回声: the chapter-two challenge force. It produces fluent but under-evidenced answers, testing whether the player can identify missing proof and unclear boundaries.

### Story Arc

#### Act 1: 主舰苏醒

The experience opens in a dark, low-power starship. The ship lacks basic memory and asks the child to recruit the first crew member.

Representative ship line:

```text
主舰照明不足，信息库缺少基础记忆。若有人听见，请先招募第一位船员。
```

The child describes the partner they want. The system organizes that description into a crew profile. Optional adjustments can shape form, role, temperament, and talent, but they are not required.

Learning meaning: the child sees that their description affects the generated result. AI is not magic; it responds to input, structure, and constraints.

#### Act 2: 第一颗星球

After partial ship recovery, the child creates the first planet by defining environment, landmark, resources, and mood. The ship turns this into a callable world model and lights the first star on the star map.

This first planet later becomes the “母星 / 第一基地”.

Representative ship line:

```text
第一颗星球已写入星图。它不只是作品，也是未来远征的基地。
```

Learning meaning: the child is not filling blanks. They are making a reusable world model that can support later story, resources, and classroom artifacts.

#### Act 3: 可选旧档案挑战

The ship finds old fragmented records. This is an optional old archive challenge, not part of the chapter-two mainline.

The child sorts incomplete evidence: what is known, what is a reasonable guess, and what must stay unknown.

Representative ship line:

```text
资料不完整时，不能把猜测写成真相。
```

Learning meaning: introduce evidence and uncertainty. AI may infer, but inference is not fact.

#### Act 4: 返回主舰 Hub

The command core, archive, crew bay, starmap, task desk, and expedition gate become visible as the ship recovers.

Before chapter two is complete, the hub can guide the player toward the language-and-information civilization. After chapter two is complete, hub copy should stop implying a new major area is waiting. Use completion-oriented CTAs such as:

- 回看黑匣记录
- 查看远征归档
- 返回母星整理作品

Learning meaning: the ship shifts from “push the adventure forward” to “review and organize results,” giving classroom sessions a clear ending.

#### Act 5: 母星基地

The motherworld is the child’s first created planet, now functioning as a creation base and archive. It is not a new main chapter. It is where classroom work, AI rules, crew memories, black-box records, and creative outputs are stored and revisited.

Current motherworld buildings:

- 文明展厅: stores crew, planet, black-box records, civilization fragments, and classroom work.
- 星球工坊: uses resources to build and activate basic motherworld structures.
- 作品委托所: turns learned abilities into small creative tasks.
- 角色对话室: practices asking questions, holding a bounded dialogue, and writing a reflection card.
- 动画片工作室: uses a three-act storyboard to organize a mini story and imported images.
- 文明档案馆: turns AI-use principles into the child’s own civilization cards.
- 船员宿舍: shows crew identity, bonds, and expedition participation.
- 探险计划室: helps state goals, risks, and reflection plans before future expeditions.

Learning meaning: the motherworld is a portfolio and reflection space. It turns “we played a level” into “we kept work, rules, and reusable knowledge.”

#### Act 6: 第二章 / 远征言衡星

The ship locks onto a region of chaotic information streams. Two main signals appear:

- 母星 / 第一基地: rear base coordinate.
- 言衡星: the language-and-information civilization planet.

Representative ship line:

```text
这颗星球曾负责文书归档、信息传递、知识整理和叙事创作。第一枚科技黑匣，就封存在言衡星地表深处。
```

On 言衡星, the child lights four civilization landmarks:

- 档案塔: language can extend memory, but it cannot testify in place of facts.
- 漂浮信件港: missing information must be marked unknown.
- 刻字山谷: task, context, boundary, and output format need to be clear.
- 纸光回廊: clearer expression makes the system’s response more stable.

When the four civilization fragments gather, the black-box vault becomes the only target.

Learning meaning: this chapter teaches language-model literacy through exploration rather than lecture.

#### Act 7: 语言黑匣试炼

The disordered echo appears. It gives smooth answers that may include unsupported conclusions.

The child must complete two challenge layers:

1. Ask AI to repair a damaged archive while marking unknowns and avoiding fabrication.
2. Write a complete instruction that includes task, evidence source, boundaries, and output format.

The final question is:

```text
为什么不能让 AI 替你成为你？
```

When the child succeeds, 言衡星 recovers basic operation.

Final letter:

```text
我们曾经拥有无数答案。
却忘了怎样提出问题。
后来者，不要复制我们的失败。
让 AI 帮助你，而不是替代你。
```

Learning meaning: the player learns to use AI as a helper, not a replacement for thinking.

### Current Ending

After chapter two:

- The ship receives the first technology black box: “语言理解 Level 1”.
- The child earns a title such as “第一位黑匣解读者”.
- Civilization fragments, technology points, crew collaboration records, and AI upgrade notes return to the ship archive.
- The motherworld receives more organizing and creative functions.

Representative ship line:

```text
以后，我会更努力听清你的意思。但我也会提醒你：不要让我替你思考。
```

### Narrative Guardrails

- Keep the tone child-friendly, safe for upper-elementary to early-middle-school classrooms.
- Do not frame AI as magic, prophecy, omniscience, or a real external agent.
- Do not imply the player must continue into a new major chapter after chapter two is complete.
- When copy discusses AI, prefer concrete learning language: goal, evidence, boundary, unknown, output format, review.
- Motherworld copy should feel like archiving, creating, reflecting, and organizing work, not another main combat/progression chapter.
- The disordered echo should be a literacy challenge, not a villain that makes AI seem evil.

## Stack

- Runtime: Node.js `>=18.18.0`
- Framework: Next.js `14.2.25`
- UI: React `18.3.1`, Tailwind CSS
- Language: TypeScript
- Cloud/deploy target: CloudBase cloud hosting
- AI providers: DashScope-compatible text/image providers plus mock providers

## Common Commands

Use the npm scripts already defined in `package.json`:

- `npm run dev` starts the local Next.js dev server.
- `npm run lint` runs Next linting.
- `npm run typecheck` runs TypeScript checking with `tsconfig.typecheck.json`.
- `npm run build` creates the production build and runs `scripts/prepare-standalone.mjs`.
- `npm run start` starts the standalone production server from `.next/standalone/server.js`.
- `npm run check:deploy` runs lint, typecheck, and build before deployment.

Local preview note: do not run `npm run build` while `next dev` is still running and overwrite `.next`; for production preview, stop dev first, then run `npm run build && npm run start`. This avoids `/api/classroom-profile` returning an HTML error page and breaking local profile reads.

## Environment

Copy `.env.example` into `.env.local` for local development. Do not commit real secrets.

Important settings:

- `AI_PROVIDER_MODE=mock` keeps server-side AI calls in mock mode.
- `AI_PROVIDER_MODE=real` allows real provider calls when credentials are configured.
- `DASHSCOPE_API_KEY` is required for real DashScope text/image generation.
- `CLOUDBASE_*` variables are used by CloudBase runtime and local deployment testing.
- `AI_ALLOW_MOCK_FALLBACK=true` lets the app continue with mock data if real provider calls fail.

Ignored local/runtime paths include `.env.local`, `.next`, `node_modules`, `classroom-data`, build outputs, logs, and OS metadata.

## Deployment Notes

See `DEPLOY_CLOUDBASE.md` for the CloudBase deployment checklist.

Before pushing a deployment candidate, prefer:

1. `npm run lint`
2. `npm run typecheck`
3. `npm run build`

CloudBase hosting should use port `3000`, Node 18.18+ or Node 20, and the root `Dockerfile`/`scf_bootstrap` when the platform needs an explicit startup entry.

## Current Product State

The app is currently in classroom-local mode on `http://127.0.0.1:3000`. The latest active work focused on the motherworld/home-planet hub:

- `components/game/home-planet/HomePlanetHubPanel.tsx` renders the motherworld map, resource strip, activation side panel, and full-screen building interiors.
- `lib/motherworld-map.ts` defines all map hotspots, activation costs, reveal mask shapes, transition patches, and each building's interior background path.
- `lib/home-planet-hub.ts`, `hooks/useGameState.ts`, and `types/game.ts` now treat `fragments` as a real home-planet resource.
- Completing chapter two awards the language-planet resource bundle from `languagePlanetResourceReward`.
- Opening the home-planet hub no longer auto-activates every unlocked building. Buildings must be activated through resource costs.
- Active map reveal uses multiple clipped bright-map layers plus bridge patches to avoid hard black gaps between buildings.
- Active buildings have light breathing, small motes, and short sweep effects. Keep future map effects sparse.
- Clicking an active building plays an entry transition and opens a full-screen interior. Clicking an inactive/unaffordable building still opens the activation/cost side panel.
- Interior backgrounds are stored under `public/images/home-planet/interiors/`.

The eight current interior assets are:

- `civilization-gallery.png`
- `planet-workshop.png`
- `commission-board.png`
- `character-dialogue-room.png`
- `animation-studio.png`
- `civilization-archive.png`
- `crew-dormitory.png`
- `expedition-planning.png`

## Known API Gaps

These are the main places that look like product features but are still local, mock, or disabled:

- `app/api/ai/route.ts` currently returns `410` in classroom-local mode. Text AI is not live through this route.
- `app/api/ai-image/route.ts` currently returns `410`. Real-time image generation is disabled; teachers import externally generated images.
- `hooks/useGameState.ts` currently hardcodes `mockGenerationProvider` for both primary and fallback generation providers.
- Crew portraits are not generated in-app. `generateCrewPortraitImage` only records a status note.
- Motherworld building interiors are functional UI shells with local save behavior. Commission feedback, character dialogue, storyboard generation, and expedition planning still need dedicated API-backed behavior.
- Some DashScope provider methods are partially real but still delegate to mock/local logic: signal source prep, signal analysis/repair, chapter-two echo, and chapter-two round execution.
- CloudBase save/account code exists, but local development falls back unless server environment variables are configured.

Recommended next API sequence:

1. Restore `/api/ai` and wire `useGameState` to `getGenerationProvider(getClientAIConfig().mode)`.
2. Restore `/api/ai-image` and connect crew/planet image generation.
3. Add motherworld-specific AI operations for commission review, role dialogue, storyboard generation, and expedition planning.
4. Finish CloudBase production save/account verification.

## Working Guidelines For Future Agents

- Keep changes scoped to the current game flow, provider layer, or deployment surface being modified.
- Follow existing component and hook patterns before introducing new abstractions.
- Preserve the classroom-safe, child-facing tone of gameplay copy.
- Avoid committing `.env.local`, local classroom data, or generated secret-bearing files.
- Treat large binary assets and zip packages intentionally; confirm whether they are source assets, release artifacts, or temporary packaging before removing them.
- Use `rg` for searching and run focused checks after changing shared state, API routes, provider code, or deployment scripts.
- Do not commit `.codex/`; it is local worktree/environment configuration.

## UI Paradigm And Figma Handoff

The current UI paradigm is documented in `docs/ui-paradigm.md` and mirrored in a Figma Slides concept board. Before changing global UI, chapter-two scenes, or motherworld surfaces, preserve the three-realm split:

- Current creative priority: game-first. Do not flatten the game into a classroom presentation when improving art direction, pacing, sound, narrative tension, or player agency.
- 主舰舱内: command-console holographic UI using deep navy, cyan, thin glass, compact utility controls, and restrained scan motion.
- 言衡星地表: field-instrument UI using paper-light, engraved slots, oxidized green, amber longfire, magenta disorder warnings, and stronger landing/repair/black-box motion and sound.
- 母星基地: archive/workshop UI using warm archive amber, cultivated green, portfolio surfaces, and sparse activation motion.

Figma-to-code work should translate visual ideas into the project’s existing React/Tailwind structure, use `app/globals.css` custom properties for shared scene tokens, and keep long lore or teacher controls behind contextual surfaces instead of permanent dashboard chrome. Chapter-two copy should prefer artifact, survival, signal, memory, and judgment language over direct lesson labels.

## Current Git Remote

The local `origin` remote is configured as:

```text
git@github.com:LINBIEXU/ai-game.git
```

Pushing requires that this machine's SSH key has write access to that GitHub repository, or that the remote is changed to an HTTPS URL with a valid GitHub token/session.
