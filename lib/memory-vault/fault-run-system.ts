import { hashString } from "@/lib/game-utils";
import type {
  FaultRunNode,
  FaultRunState,
  FaultSeed,
  FaultSeedType
} from "@/types/game";

const seedLibrary: Array<Omit<FaultSeed, "id">> = [
  {
    type: "撞击小行星",
    title: "外层碰撞链",
    summary: "一块小行星碎片擦过主舰外环，引发了看似普通、实则连锁的系统失稳。",
    threat: "冲击记录不完整，容易把物理损伤误判成系统老化。",
    anomaly: "撞击日志里夹着一段晚到的修复指令。",
    hiddenTruth: "真正的问题不是撞击本身，而是撞击后错误地跳过了二次校准。"
  },
  {
    type: "外部信号干扰",
    title: "诱饵频段回灌",
    summary: "主舰在接收外部求救样本时，把一段噪声错误当成了安全引导。",
    threat: "相似案例很多，最容易被“看起来差不多”骗过去。",
    anomaly: "高频噪声总在关键节点前半秒插入。",
    hiddenTruth: "相似信号不等于同一来源，必须先验证频段身份。"
  },
  {
    type: "核心过载",
    title: "主核热回环",
    summary: "核心在短时间里被连续调用，推演结果越来越快，但越来越偏。",
    threat: "系统会给出看似流畅的答案，实际上目标已经偏掉。",
    anomaly: "过载前最后一条目标指令缺少边界条件。",
    hiddenTruth: "问题来自模糊指令，而不是核心自己突然失控。"
  },
  {
    type: "权限误操作",
    title: "误开权限链",
    summary: "某次维护把临时权限保留得太久，后续指令一路串错。",
    threat: "日志很完整，但完整不代表每一步都可信。",
    anomaly: "权限切换和修复申请的时间线对不上。",
    hiddenTruth: "错误来自目标范围没被收紧，系统把测试权限当成正式命令。"
  },
  {
    type: "未知污染侵入",
    title: "灰尘协议入侵",
    summary: "一段未知污染像灰尘一样落在多条日志里，让所有因果链都显得合理又互相冲突。",
    threat: "越早下结论，越容易被污染数据带偏。",
    anomaly: "异常样本会模仿正确日志的语气。",
    hiddenTruth: "必须先过滤噪声层，再决定保留哪条解释。"
  }
];

function buildNodes(seed: FaultSeed): FaultRunNode[] {
  return [
    {
      id: `${seed.id}-trigger`,
      stage: "事件触发",
      title: "回溯入口刚刚打开",
      body: `${seed.summary} ${seed.threat}`,
      guidance: "先决定你是保系统，还是先抢第一手证据。",
      choices: [
        {
          id: "stabilize-shell",
          label: "先稳住外层系统",
          summary: "减少崩塌风险，但会吃掉一点时间。",
          effect: { stability: 12, evidence: 0, time: -4 },
          principle: "先稳住系统，再继续推演。",
          recommendedRoles: ["repair", "pilot"],
          rescueWhenLowStability: true
        },
        {
          id: "pull-raw-log",
          label: "拉取原始日志",
          summary: "先看最早的一手记录，不急着下结论。",
          effect: { stability: -2, evidence: 14, time: -5 },
          principle: "数据不完整时，先补证据。",
          recommendedRoles: ["scout", "record"]
        },
        {
          id: "copy-similar-case",
          label: "直接套用相似案例",
          summary: "速度快，但如果证据不够，后面会很容易跑偏。",
          effect: { stability: -8, evidence: 4, time: 3 },
          principle: "相似案例不等于真实原因。",
          recommendedRoles: ["pilot"],
          requiresEvidence: 26
        }
      ]
    },
    {
      id: `${seed.id}-judge`,
      stage: "初步判断",
      title: "主舰开始询问：真正缺的是哪一块数据？",
      body: `异常点：${seed.anomaly}`,
      guidance: "这一轮的选择会决定后面推演是更准，还是更快。",
      choices: [
        {
          id: "mark-missing-data",
          label: "先标记缺失数据",
          summary: "承认不知道的部分，给系统一个更诚实的边界。",
          effect: { stability: 2, evidence: 12, time: -4 },
          principle: "不知道的时候，要先承认缺口。",
          recommendedRoles: ["record", "scout"]
        },
        {
          id: "split-by-role",
          label: "按船员擅长方向拆因果",
          summary: "让船员把复杂问题拆成可处理的小块。",
          effect: { stability: 6, evidence: 8, time: -3 },
          principle: "把模糊问题拆小，比直接猜结论更稳。",
          recommendedRoles: ["repair", "record", "scout", "pilot"]
        },
        {
          id: "push-fuzzy-goal",
          label: "先给系统一个模糊目标继续跑",
          summary: "会显得很顺，但目标不清时，结果更容易偏。",
          effect: { stability: -6, evidence: -2, time: 2 },
          principle: "目标不清楚，推演会越跑越偏。",
          recommendedRoles: ["pilot"],
          requiresEvidence: 32
        }
      ]
    },
    {
      id: `${seed.id}-escalate`,
      stage: "异常升级",
      title: "回溯链里出现了更多看似合理的噪声",
      body: "现在最危险的不是没有答案，而是错误答案开始变得好看。",
      guidance: "这一步在训练你分辨噪声、线索和诱饵。",
      choices: [
        {
          id: "filter-noise",
          label: "先过滤噪声层",
          summary: "不急着修，先把假线索赶出去。",
          effect: { stability: 4, evidence: 12, time: -4 },
          principle: "噪声数据会制造看似合理的假结果。",
          recommendedRoles: ["scout", "record"]
        },
        {
          id: "force-restore",
          label: "强行推进恢复",
          summary: "可能抢下一段片段，但系统会更不稳。",
          effect: { stability: -12, evidence: 6, time: 1 },
          principle: "证据不够时，快不一定更好。",
          recommendedRoles: ["repair"]
        },
        {
          id: "rebuild-timeline",
          label: "回看时间线",
          summary: "重新排列先后顺序，让因果链变清楚。",
          effect: { stability: 3, evidence: 10, time: -5 },
          principle: "先理清因果，再决定修哪一段。",
          recommendedRoles: ["record", "pilot"]
        }
      ]
    },
    {
      id: `${seed.id}-critical`,
      stage: "关键决策",
      title: "主舰给出第一条高可信路径，但它还不是最终真相",
      body: "这时候最容易把“差不多对”当成“已经对”。",
      guidance: "要么验证，要么保留余地，不要被第一眼的顺畅骗走。",
      choices: [
        {
          id: "verify-hypothesis",
          label: "验证当前最强假设",
          summary: "证据够时会很强，证据不够时会直接崩。",
          effect: { stability: 6, evidence: 12, time: -4 },
          principle: "最像答案的东西，也要先验证。",
          recommendedRoles: ["scout", "record"],
          requiresEvidence: 44
        },
        {
          id: "seal-and-sample",
          label: "先切断异常，再保留样本",
          summary: "更稳，也更容易拿到部分恢复。",
          effect: { stability: 12, evidence: 6, time: -5 },
          principle: "先止损，再继续恢复，也是一种好判断。",
          recommendedRoles: ["repair", "pilot"]
        },
        {
          id: "amplify-anomaly",
          label: "放大异常源赌一把",
          summary: "如果判断对，会很快；如果错了，整轮会崩。",
          effect: { stability: -16, evidence: 10, time: 3 },
          principle: "没有验证就放大异常，是高风险赌法。",
          recommendedRoles: ["pilot"],
          requiresEvidence: 56
        }
      ]
    },
    {
      id: `${seed.id}-resolve`,
      stage: "结果结算",
      title: "最后要决定这一轮是完整写回，还是先保住可信片段",
      body: "你的最后选择，会决定这是一次完整修复，还是一次有价值的失败。",
      guidance: "这里没有黑屏 Game Over，只有你愿意留下什么。",
      choices: [
        {
          id: "write-full-case",
          label: "完整写回案例库",
          summary: "要求高，但成功后会直接解锁完整案例能力。",
          effect: { stability: 4, evidence: 10, time: -2 },
          principle: "高把握时再写完整案例库。",
          recommendedRoles: ["record", "repair"],
          requiresEvidence: 60
        },
        {
          id: "save-confirmed-fragments",
          label: "先保存可信片段",
          summary: "更稳，适合部分恢复和下一轮继续。",
          effect: { stability: 6, evidence: 6, time: 0 },
          principle: "不确定时先保住确定的部分。",
          recommendedRoles: ["record", "scout"]
        },
        {
          id: "abort-run",
          label: "中断回溯保主舰",
          summary: "放弃当前完整恢复，但避免系统继续崩塌。",
          effect: { stability: 10, evidence: -4, time: 1 },
          principle: "有时先停下来，也是为了下一轮更稳。",
          recommendedRoles: ["pilot", "repair"]
        }
      ]
    }
  ];
}

export function createInitialFaultRun(): FaultRunState {
  return {
    status: "locked",
    attemptCount: 0,
    activeSeed: null,
    currentNodeIndex: 0,
    nodes: [],
    stability: 72,
    evidence: 18,
    timeWindow: 20,
    history: [],
    partialFragments: [],
    result: null
  };
}

export function createFaultSeed(seedHint: string): FaultSeed {
  const hashed = hashString(seedHint);
  const template = seedLibrary[hashed % seedLibrary.length];

  return {
    ...template,
    id: `fault-${hashed}`
  };
}

export function createFaultRun(seedHint: string, partialFragments: string[]): FaultRunState {
  const seed = createFaultSeed(seedHint);
  const nodes = buildNodes(seed);

  return {
    status: "running",
    attemptCount: 1,
    activeSeed: seed,
    currentNodeIndex: 0,
    nodes,
    stability: 72,
    evidence: 18 + Math.min(8, partialFragments.length * 2),
    timeWindow: 20,
    history: [],
    partialFragments,
    result: null
  };
}
