import type {
  CrewImageGenerationRequest,
  CrewImageGenerationResult,
  ImageGenerationProvider
} from "@/types/ai";
import { getServerImageConfig } from "@/lib/ai-image/config";
import { mockCrewImageProvider } from "@/lib/ai-image/mock-provider";
import { providerPromptBindings } from "@/lib/prompts/provider-bindings";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readImageUrl(data: unknown) {
  if (!data || typeof data !== "object") {
    return null;
  }

  const output = "output" in data && data.output && typeof data.output === "object" ? (data.output as Record<string, unknown>) : null;
  const results =
    output && Array.isArray(output.results)
      ? output.results
      : output && Array.isArray(output.result)
        ? output.result
        : [];

  for (const item of results) {
    if (item && typeof item === "object") {
      const record = item as Record<string, unknown>;
      if (typeof record.url === "string" && record.url.trim()) {
        return record.url.trim();
      }
    }
  }

  if (output && typeof output.image_url === "string" && output.image_url.trim()) {
    return output.image_url.trim();
  }

  const outputChoices =
    output && Array.isArray(output.choices)
      ? output.choices
      : Array.isArray((data as Record<string, unknown>)?.choices)
        ? ((data as Record<string, unknown>).choices as unknown[])
        : [];

  for (const choice of outputChoices) {
    if (!choice || typeof choice !== "object") continue;
    const message = "message" in choice && choice.message && typeof choice.message === "object" ? (choice.message as Record<string, unknown>) : null;
    const content = message && Array.isArray(message.content) ? message.content : [];
    for (const item of content) {
      if (item && typeof item === "object") {
        const record = item as Record<string, unknown>;
        if (typeof record.image === "string" && record.image.trim()) {
          return record.image.trim();
        }
        if (typeof record.image_url === "string" && record.image_url.trim()) {
          return record.image_url.trim();
        }
      }
    }
  }

  return null;
}

function readTaskId(data: unknown) {
  if (!data || typeof data !== "object" || !("output" in data) || !data.output || typeof data.output !== "object") {
    return null;
  }

  const output = data.output as Record<string, unknown>;
  return typeof output.task_id === "string" && output.task_id.trim() ? output.task_id.trim() : null;
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

function sanitizeImagePrompt(text: string) {
  return text
    .replace(/血腥|血液|伤口|尸体|恐怖|惊悚|黑暗化|阴暗化|成人化|性感化/g, "")
    .replace(/严格避免：/g, "风格限制：")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function isInappropriateContentError(message: string) {
  return /inappropriate content|不适宜|敏感|违规|ip infringement|侵权|知识产权|版权/i.test(message);
}

async function pollTaskResult(input: {
  taskId: string;
  apiKey: string;
  maxAttempts: number;
  initialDelayMs: number;
  intervalMs: number;
}) {
  for (let attempt = 0; attempt < input.maxAttempts; attempt += 1) {
    await sleep(attempt === 0 ? input.initialDelayMs : input.intervalMs);

    const response = await fetch(`https://dashscope.aliyuncs.com/api/v1/tasks/${input.taskId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${input.apiKey}`
      },
      cache: "no-store"
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const message =
        data && typeof data === "object" && "message" in data && typeof data.message === "string"
          ? data.message
          : `阿里百炼图像任务查询返回 ${response.status}`;
      throw new Error(message);
    }

    const taskStatus =
      data && typeof data === "object" && "output" in data && data.output && typeof data.output === "object" && "task_status" in data.output
        ? String((data.output as Record<string, unknown>).task_status)
        : "";

    if (taskStatus === "SUCCEEDED") {
      return data;
    }

    if (taskStatus === "FAILED" || taskStatus === "CANCELED" || taskStatus === "UNKNOWN") {
      const taskMessage =
        data && typeof data === "object" && "output" in data && data.output && typeof data.output === "object" && "message" in data.output
          ? String((data.output as Record<string, unknown>).message)
          : "船员形象任务未能完成。";
      throw new Error(taskMessage);
    }
  }

  throw new Error("船员形象生成等待时间过长，主舰已暂时切回本地外形回路。");
}

export const dashscopeCrewImageProvider: ImageGenerationProvider = {
  mode: "real",
  providerId: "dashscope",
  prompts: {
    worldRules: providerPromptBindings.worldRules,
    generateCrewImage: providerPromptBindings.generateCrewImage
  },
  async generateCrewImage(request: CrewImageGenerationRequest): Promise<CrewImageGenerationResult> {
    const config = getServerImageConfig();
    const bundle = providerPromptBindings.generateCrewImage(request);
    const revision = request.variant ?? 1;
    const safePrompt = sanitizeImagePrompt(bundle.user);
    const safeNegative = sanitizeImagePrompt(bundle.negative ?? "");
    const response = await fetch(config.dashscope.generationUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.dashscope.apiKey}`,
        "Content-Type": "application/json",
        "X-DashScope-Async": "enable"
      },
      body: JSON.stringify({
        model: config.dashscope.model,
        input: {
          messages: [
            {
              role: "user",
              content: [
                {
                  text: safeNegative ? `${safePrompt}\n\n风格限制：${safeNegative}` : safePrompt
                }
              ]
            }
          ]
        },
        parameters: {
          size: "2K",
          n: 1,
          watermark: false,
          thinking_mode: true
        }
      }),
      cache: "no-store"
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const message =
        data && typeof data === "object" && "message" in data && typeof data.message === "string"
          ? data.message
          : `阿里百炼图像接口返回 ${response.status}`;
      if (isInappropriateContentError(message)) {
        return mockCrewImageProvider.generateCrewImage(request);
      }
      throw new Error(message);
    }

    const taskId = readTaskId(data);
    let taskData: unknown;
    try {
      taskData = taskId
        ? await pollTaskResult({
            taskId,
            apiKey: config.dashscope.apiKey!,
            maxAttempts: config.polling.maxAttempts,
            initialDelayMs: config.polling.initialDelayMs,
            intervalMs: config.polling.intervalMs
          })
        : data;
    } catch (error) {
      if (error instanceof Error && isInappropriateContentError(error.message)) {
        return mockCrewImageProvider.generateCrewImage(request);
      }
      throw error;
    }
    const imageUrl = readImageUrl(taskData);
    if (!imageUrl) {
      return mockCrewImageProvider.generateCrewImage(request);
    }

    return {
      asset: {
        imageUrl,
        prompt: bundle.user,
        negativePrompt: bundle.negative,
        providerId: "dashscope",
        styleLabel: echoLabel(revision),
        echoNote: echoNote(request.crew.visualSubject, revision),
        updatedAt: Date.now(),
        revision
      }
    };
  }
};
