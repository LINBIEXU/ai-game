# 第二章剧情实现地图

这份文件只记录实现顺序，避免后续大改时偏离现有剧情设定。剧情优先级以 `AGENTS.md` 和 `docs/chapter-two-yanheng-master-rework-design.md` 为准。

## 硬基准

- 衡灯是语言黑匣外显的人格碎片，不是普通导航 NPC。
- 假船员线的重点不是“假消息”，而是熟悉声音、真实材料和流畅语气一起夺走玩家判断权。
- 黑匣战不是答题结算，而是提示词注入、边界重塑、真船员回归、衡灯覆写和长明火选择的终局。
- 第二章玩法必须服务“在坏掉的语言星球上生存和修复”，不能回到读卡片、点选项、填空的课堂形态。
- 四个主地标的玩法必须嵌入场景：背景图、残影槽、地表器物和现场后果共同组成 playfield。不要再把关卡内容拉成独立交互框；需要新内容时，优先设计成可点击的信标、刻槽、纸页、裂隙、轨道或场内仪器。

## 明天大改入口

1. 已接入假船员潜伏阶段：旧登记码、熟悉外壳、催促切断衡灯、误信路线、衡灯保护并熄灭。
2. 已接入黑匣外庭入口：玩家抱着熄灭的衡灯抵达，决定暂时放下它并独自进入。
3. 已改黑匣前半段表达：四地标能力作为 boss 反制手段，而不是独立小题。
4. 待继续收紧终局：真船员回归、防御、衡灯被覆写、长明火选择和“火还在”的余味需要继续做音画和节奏。

## 当前已铺好的准备

- `lib/chapter-two-narrative.ts` 集中保存第二章剧情契约、衡灯语气锚点、四地标功能和背叛/黑匣阶段。
- `ChapterTwoMissionPanel` 的异常通讯已开始引用背叛阶段骨架，并展开到误信路线与衡灯熄灭。
- `ChapterTwoCinematicSlot` 在素材未接入时会显示“残影未定”的损坏投影，先稳定版面和气氛；后续补图或视频只需改槽位 `mediaUrl`。
- `lib/chapter-two-field-cues.ts` 集中保存第二章场内反馈事件。四地标、假船员和黑匣终局都通过这个通道触发临时音效、震动与后续素材钩子。
- `ChapterTwoFieldAudioLayer` 会监听同一批 cue，并额外显示短促场景冲击层；稳定、危险、黑匣和长明火节点有不同视觉反应。
- `ChapterTwoFieldStateStrip` 是四地标和黑匣战的低占用 HUD：用“稳定度 / 压力”替代课堂式数据面板。
- 四个主地标已改成场景内叠层：状态条、操作链、字段/词块/纸页节点、现场后果和底部推进条都贴在画面边缘或场内器物上，避免从背景里抽出一个大交互框。
- 黑匣战每个能力阶段都有一次主动出招：伪证墨层、补全诱导、优先级覆写、流畅遮罩和身份交换。玩家必须先反制这次出招，才能把对应地标能力碎片嵌入黑匣；如果听从黑匣，会直接污染当前阶段的操作内容并推高压力。
- 黑匣二阶段不再只是连续剧情按钮：看守者崩坏、真船员回归、封存区压制、船员防御、衡灯覆写、低谷和灯芯记忆都有战斗动作格。玩家要先完成当前动作，才推进到下一拍。
- 四大主线开始接入“现场后果”规则：档案塔错归档会留下墨斑封条，信件港错轨会留下偏航尾迹，刻字山谷试运行失败会留下裂纹槽，纸光回廊高折压可消耗有限余锚压住纸页。失败不再只是提示文字，而是需要玩家处理的场内状态。

## 图片 / 视频转场插入口

所有第二章剧情转场素材槽位集中在 `lib/chapter-two-narrative.ts` 的 `chapterTwoCinematicSlots`。每个槽位都有 `preferredImagePath` 和 `preferredVideoPath`。后续补素材时，把文件放到推荐路径，再把对应槽位的 `mediaUrl` 改成实际路径即可；如果是视频，保留 `mediaKind: "video"`，可选填 `posterUrl`。

当前已预留的关键槽位：

- 档案塔内部：`archive-threshold` / `archive-names` / `archive-blank` / `archive-margin` / `archive-sealed` / `archive-operate` / `archive-repair`。
- 信件港内部：`letter-pile` / `letter-original` / `letter-slip` / `letter-draft` / `letter-return` / `letter-operate` / `letter-repair`。
- 刻字山谷内部：`valley-gate` / `valley-stories` / `valley-machine` / `valley-kindness` / `valley-wick` / `valley-slots` / `valley-operate` / `valley-repair`。
- 纸光回廊内部：`paper-intro` / `paper-route-choice` / `paper-relic` / `paper-residue` / `paper-core-scan` / `paper-repair`。
- `fake-crew-signal-mimic`：假船员用真实登记码和熟悉口吻接近玩家。
- `fake-crew-route-mislead`：玩家误信路线，被带向黑匣。
- `hengdeng-extinguish`：衡灯挡下牵引并熄灭。
- `blackbox-outer-court`：抱着熄灭衡灯抵达外庭。
- `blackbox-keeper` / `blackbox-prompt-injection` / `blackbox-core-contact` / `blackbox-phase-two-pressure`：守文者与提示词注入，以及二阶段压制。
- `blackbox-boss-archive` / `blackbox-boss-delivery` / `blackbox-boss-verification` / `blackbox-boss-expression` / `blackbox-boss-identity`：黑匣五次主动出招的短转场或招式特写。
- `blackbox-crew-return` / `blackbox-crew-shield` / `blackbox-hengdeng-overridden` / `blackbox-desperation` / `blackbox-wick-memory`：终局二阶段的同伴、覆写、低谷和灯芯记忆。
- `blackbox-longfire-choice` / `blackbox-longfire-ignite` / `blackbox-restoration`：长明火选择、点燃与言衡星回温。

## 音效 / 触觉反馈插入口

临时 WebAudio stinger 集中在 `hooks/useChapterTwoFieldAudio.ts`，触发函数为 `emitChapterTwoFieldCue`。后续换正式音频时，保留 cue 名称，把生成音换成采样播放即可。

同一 cue 现在同时驱动三层反馈：

- 声音：`useChapterTwoFieldAudio` 内的临时合成 stinger。
- 触觉：`emitChapterTwoFieldCue` 内的 `navigator.vibrate`。
- 画面：`ChapterTwoFieldAudioLayer` 内的 `chapter-two-field-impact` 场景冲击层。

当前已经接入的关卡操作反馈：

- 档案塔：读取线索、碎片入槽、归档错误、塔光修复。
- 信件港：封存时间锚、字段接轨、错轨、光轨修复。
- 刻字山谷：山谷行进、词块嵌刻、试运行失败、试运行稳定、铭文修复。
- 纸光回廊：岔路显形、路线折压、收取圣物、残魂命中/误判、圣盾抵挡、圣剑破碎、核心圣物动作、扫描标记、扫描失败、纸光修复。
- 假船员与黑匣：伪装声线、误信路线、衡灯熄灭、黑匣反制、真船员回归、船员防御、衡灯覆写、长明火选择与点燃。

## 纸光回廊当前玩法骨架

纸光回廊已经按“半透明肉鸽小关”继续加深：

- 路线选择会产生“折压”，低/中/高风险路线有不同代价。
- 本轮路径会写入“折痕记录”，保留玩家选择、圣物、污染和核心节点。
- 圣镜不再只是剧情道具：低折压时能提示残魂正确处理方式，并能在核心扫描阶段显影一处暗纹。
- 圣盾不只挡残魂误判，也能在核心扫描失败时挡下一次反噬并清除一处误标。
- 圣剑可以在岔路中斩开残魂，也可以留到核心阶段直接裁断一处暗纹。
- 错误选择会提高折压和幻光压力，影响后续显影稳定度。
