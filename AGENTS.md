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

## Current Git Remote

The local `origin` remote is configured as:

```text
git@github.com:LINBIEXU/ai-game.git
```

Pushing requires that this machine's SSH key has write access to that GitHub repository, or that the remote is changed to an HTTPS URL with a valid GitHub token/session.
