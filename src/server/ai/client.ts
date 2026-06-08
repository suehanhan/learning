import { z } from "zod";
import { CozeAPI, COZE_CN_BASE_URL, RoleType } from "@coze/api";

/* =====================================================
   扣子（Coze）SDK 客户端
   使用官方 @coze/api SDK，内部自动处理轮询
   ===================================================== */

function createClient() {
  const pat = process.env.COZE_PAT || "";
  if (!pat) return null;
  return new CozeAPI({
    token: pat,
    baseURL: COZE_CN_BASE_URL,
  });
}

function getConfig() {
  return {
    baseUrl: (process.env.COZE_API_BASE || "https://api.coze.cn").replace(/\/+$/, ""),
    pat: process.env.COZE_PAT || "",
    botId: process.env.COZE_BOT_ID || "",
    userId: process.env.COZE_USER_ID || "conic-learning",
  };
}

function getBotId() {
  return process.env.COZE_BOT_ID || "";
}

function getUserId() {
  return process.env.COZE_USER_ID || "conic-learning";
}

/* ---------- 核心：发送消息给 Bot 并获取完整回复 ---------- */

async function sendToBot(
  messages: { role: string; content: string; content_type?: string }[],
): Promise<{ ok: true; reply: string } | { ok: false; error: string }> {
  const botId = getBotId();
  if (!botId) return { ok: false, error: "未配置 COZE_BOT_ID" };
  if (!getUserId()) return { ok: false, error: "未配置 COZE_USER_ID" };

  const client = createClient();
  if (!client) return { ok: false, error: "未配置 COZE_PAT（扣子个人访问令牌）" };

  try {
    const v = await client.chat.createAndPoll({
      bot_id: botId,
      user_id: getUserId(),
      additional_messages: messages.map((m) => ({
        role: m.role === "assistant" ? RoleType.Assistant : RoleType.User,
        content: m.content,
        content_type: (m.content_type || "text") as any,
      })),
      auto_save_history: true,
    });

    const answerMsg = v.messages?.find(
      (m) => m.role === "assistant" && m.type === "answer",
    );
    const reply = answerMsg?.content || "";
    if (!reply) return { ok: false, error: "扣子未返回有效回复" };

    return { ok: true, reply };
  } catch (e: any) {
    const msg = e?.message || String(e);
    return { ok: false, error: `扣子 API 错误: ${msg}` };
  }
}

/* ---------- 图片上传 ---------- */

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

async function uploadImage(imageDataUrl: string): Promise<{ ok: true; fileId: string } | { ok: false; error: string }> {
  const { baseUrl, pat } = getConfig();
  if (!pat) return { ok: false, error: "未配置 COZE_PAT" };

  try {
    const raw = imageDataUrl.includes(",") ? imageDataUrl.split(",")[1]! : imageDataUrl;
    const buffer = Buffer.from(raw, "base64");

    const fd = new FormData();
    const blob = new Blob([buffer], { type: "image/png" });
    fd.append("file", blob, `upload_${Date.now()}.png`);

    const res = await fetch(`${baseUrl}/v1/files/upload`, {
      method: "POST",
      headers: { authorization: `Bearer ${pat}` },
      body: fd,
    });

    const body = await safeJson(res);
    if (!res.ok || body?.code !== 0) return { ok: false, error: body?.msg || "扣子图片上传失败" };
    const fileId: string = body.data?.id || "";
    if (!fileId) return { ok: false, error: "扣子上传后未返回 file_id" };
    return { ok: true, fileId };
  } catch (e: any) {
    return { ok: false, error: `扣子图片上传失败: ${e?.message || String(e)}` };
  }
}

/* ---------- JSON 解析工具 ---------- */

function extractJson(text: string) {
  const cleaned = text.trim();
  const noCode = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  try {
    return { ok: true as const, data: JSON.parse(noCode) };
  } catch {}

  const start = (() => {
    const a = cleaned.indexOf("{"), b = cleaned.indexOf("[");
    if (a >= 0 && (b < 0 || a < b)) return a;
    if (b >= 0) return b;
    return -1;
  })();
  if (start >= 0) {
    let depth = 0, str = false, esc = false;
    for (let i = start; i < cleaned.length; i++) {
      const c = cleaned[i];
      if (esc) { esc = false; continue; }
      if (str) { if (c === "\\") esc = true; else if (c === '"') str = false; continue; }
      if (c === '"') { str = true; continue; }
      if (c === "{" || c === "[") { depth++; continue; }
      if (c === "}" || c === "]") { depth--; if (depth === 0) { try { return { ok: true as const, data: JSON.parse(cleaned.slice(start, i + 1)) }; } catch { break; } } }
    }
  }
  return { ok: false as const };
}

/* =====================================================
   公开 API
   ===================================================== */

/** 纯文本对话 → 返回 Bot 的原始回复（用于答疑聊天） */
export async function chatText(input: {
  system: string;
  user: string;
  imageDataUrl?: string;
}): Promise<{ ok: true; reply: string } | { ok: false; error: string }> {
  const combined = [
    `${input.system}`,
    "",
    `【学生问题】\n${input.user}`,
  ].join("\n\n");

  if (input.imageDataUrl) {
    const upload = await uploadImage(input.imageDataUrl);
    if (!upload.ok) return upload;
    return sendToBot([
      { role: "user", content: combined, content_type: "text" },
      { role: "user", content: upload.fileId, content_type: "file" },
    ]);
  }

  return sendToBot([{ role: "user", content: combined, content_type: "text" }]);
}

/** 结构化对话 → 解析为指定 schema 的 JSON（用于判题、报告等） */
export async function chatJson<T>(input: {
  system: string;
  user: string;
  schema: z.ZodType<T>;
}): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  const combined = [
    `${input.system}`,
    "",
    `${input.user}`,
    "",
    "---",
    "重要：你上面回复的内容中必须包含一个合法的 JSON 对象。可以在文字描述后附上 JSON，但 JSON 必须完整且可解析。",
  ].join("\n");

  const resp = await sendToBot([{ role: "user", content: combined, content_type: "text" }]);
  if (!resp.ok) return resp;

  const parsed = extractJson(resp.reply);
  if (!parsed.ok) return { ok: false, error: "扣子返回内容不是有效 JSON，请确保智能体的人设中要求输出 JSON 格式" };

  const checked = input.schema.safeParse(parsed.data);
  if (!checked.success) return { ok: false, error: `扣子返回 JSON 字段不符合预期: ${checked.error.message}` };

  return { ok: true, data: checked.data };
}

/** 图片 + 文本 → 视觉识别 → 解析为指定 schema 的 JSON */
export async function visionJson<T>(input: {
  system: string;
  prompt: string;
  imageDataUrl: string;
  schema: z.ZodType<T>;
}): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  const upload = await uploadImage(input.imageDataUrl);
  if (!upload.ok) return upload;

  const combined = [
    `${input.system}`,
    "",
    `${input.prompt}`,
    "",
    "---",
    "重要：回复中必须包含一个合法的 JSON 对象。",
  ].join("\n");

  const resp = await sendToBot([
    { role: "user", content: combined, content_type: "text" },
    { role: "user", content: upload.fileId, content_type: "file" },
  ]);
  if (!resp.ok) return resp;

  const parsed = extractJson(resp.reply);
  if (!parsed.ok) return { ok: false, error: "扣子返回内容不是有效 JSON" };

  const checked = input.schema.safeParse(parsed.data);
  if (!checked.success) return { ok: false, error: "扣子返回 JSON 字段不符合预期" };

  return { ok: true, data: checked.data };
}
