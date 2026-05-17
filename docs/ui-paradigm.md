# AI Game UI Paradigm

This document is the code-facing companion to the Figma Slides UI paradigm board created for the current game refresh. Use it before changing global UI, chapter-two scenes, or motherworld surfaces.

Current creative priority: make the game work as a finished expressive piece first. Classroom readability can remain, but it must not flatten art direction, pacing, sound, stakes, or player agency.

## Design Contract

- The UI is part of the story world, not a generic app dashboard.
- The central motif stays consistent everywhere: the player refuses to surrender judgment to a fluent system.
- Each location has its own material language: ship command, Yanheng fieldwork, motherworld archive.
- Persistent HUD should stay compact. Long lore, teacher controls, and detailed tasks should be contextual or collapsible.
- After chapter two is complete, copy and CTAs should feel like aftermath and return, not a classroom worksheet.

## UI Realms

### Shipboard UI

- Narrative role: command, navigation, crew management, archive review.
- Material: translucent holographic glass, fine cyan borders, orbital routes, compact utility controls.
- Palette: deep navy, cyan, soft white, limited amber warnings.
- Motion: scan sweeps, route locks, small unlock bursts, low-frequency core pulses.
- Sound: clean hums, short command tones, restrained warning noise.

### Yanheng Field UI

- Narrative role: post-landing field instruments, survival after a crash, and damaged language infrastructure that behaves like a living ruin.
- Material: field scanner glass, paper-light sheets, engraved stone slots, signal dust, warm lantern traces.
- Palette: ink-black ruins, paper white, oxidized green, amber longfire, magenta only for disorder or unsupported conclusions.
- Motion: landing shock, text instability, fragment docking, repair beams, black-box pressure pulses.
- Sound: wind-like low ambience, broken signal grit, warm repair chimes, pressure tones in black-box scenes. Every major state needs a motif, not just a UI beep.

### Motherworld UI

- Narrative role: creation base, archive, and homecoming after the expedition.
- Material: map light, gallery plinths, workshop boards, dormitory cards, planning desk surfaces.
- Palette: warm archive amber, cultivated green, soft cyan links back to the ship.
- Motion: sparse building activation breaths, resource confirmation, gentle archive writing.
- Sound: soft confirmation tones only; no threat language.

## Component Rules

- Surface panels should skin by realm instead of becoming one universal card style.
- Evidence chips should remain recognizable across realms, but their labels should feel like artifacts or tools before they feel like lesson tags.
- Primary actions should be brief and physical: command, scan, dock, repair, archive.
- Error states in chapter two should feel dangerous but fair: short shake, magenta interference, degraded sound, and a clear way to recover.
- Never use large marketing hero composition inside game scenes. The first screen should feel like play or fieldwork.

## Dialogue And Text Rhythm

- Chapter-two dialogue boxes are field transmitters, not classroom speech bubbles: asymmetrical edge, role-colored signal line, portrait/initial glyph, and one compact action cue.
- Dialogue text may be an array of lines. Use line breaks for breath, pressure, and emotional turns; do not force every pause into a separate click.
- Speaker voice matters: the player should sound young but brave, the crew should be intimate and practical, Hengdeng should be dry, damaged, and warm, and echoes should feel smooth but suspect.
- A pause line such as `……等等。` should be visually quieter or warmer, then followed by the consequential line.
- Landmark game content boxes should read as local instruments or artifacts: residual pages in Letter Port, engraved work surfaces in Valley, paper-light nodes in Corridor, not shared app cards.

## Game-First Direction

- Favor playable rhythm over explanatory completeness. If a line repeats information the player can infer from image, sound, or state, cut or hide it.
- Let consequence read through the world: light paths, field noise, broken communication, crew absence, and black-box pressure should carry the scene.
- Preserve quiet. Not every successful action needs fireworks; some should feel like a page finally lying flat.
- Treat sound as a narrative layer. Crash, fake signal, repair, black-box pressure, and longfire restoration need distinct motifs.
- Keep educational ideas inside mechanics and artifact language; avoid direct “lesson complete” copy in chapter two.

## Figma-To-Code Rules

- Use `app/globals.css` custom properties as the source of scene tokens.
- Reuse feature components in `components/game/**` before adding new primitives.
- Chapter-two UI belongs under `components/game/chapter-two/**` and `LandmarkGames/**`.
- Run `npm run typecheck` after changing game state, chapter-two scenes, or shared props.
- Use browser screenshot/playtest review for visual changes that affect chapter-two maps, landmark games, or black-box scenes.
