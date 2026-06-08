import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { getAuthedUser } from "@/server/auth/api";
import { chatText } from "@/server/ai/client";

export const runtime = "nodejs";

// 内存缓存：questionId → AI 分析结果
const aiCache = new Map<string, { ok: boolean; reply?: string; error?: string }>();

export async function POST(req: Request) {
  const me = await getAuthedUser();
  if (!me) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const form = await req.formData();
  const text = String(form.get("text") || "").trim();
  const file = form.get("image");
  const image = file instanceof File ? file : null;

  if (!text && !image) return NextResponse.json({ error: "请上传图片或输入文本" }, { status: 400 });

  let imageDataUrl: string | undefined = undefined;
  let imageUrl: string | null = null;

  if (image) {
    const buf = Buffer.from(await image.arrayBuffer());
    imageDataUrl = `data:${image.type || "image/png"};base64,${buf.toString("base64")}`;
    imageUrl = imageDataUrl; // 直接存 base64 到数据库（Vercel 无本地磁盘写入）
  }

  const question = await prisma.question.create({
    data: {
      type: "solution",
      difficulty: "medium",
      content: text || (imageUrl ? "（图片题目）" : ""),
      answer: null,
      solution: null,
      pitfalls: null,
      knowledgePoints: [],
      source: "uploaded",
      imageUrl,
      status: "pending",
    },
    select: { id: true, status: true, content: true, imageUrl: true, createdAt: true },
  });

  analyzeInBackground(question.id, { text, imageDataUrl });

  return NextResponse.json({ question, aiStatus: "processing" });
}

async function analyzeInBackground(
  questionId: string,
  input: { text: string; imageDataUrl?: string },
) {
  const system = [
    "你是圆锥曲线教学专家。学生提交了一道圆锥曲线题目（文本或图片），请做以下三件事：",
    "1) 给出完整解答，逐步写出推导过程",
    "2) 标注易错点和关键考点",
    "3) 生成 3 道同考点、难度递进的变式题（基础→中等→困难），每道变式题也给出答案和解题思路",
    "",
    "请用中文回复，数学公式用 $...$ 或 $$...$$ 标记。",
  ].join("\n");

  const user = input.text
    ? `【学生提交的题目】\n${input.text}\n\n请按上述要求分析此题。`
    : "学生提交了一张题目图片，请识别并分析此题。";

  const result = await chatText({ system, user, imageDataUrl: input.imageDataUrl });
  aiCache.set(questionId, result);

  if (result.ok) {
    await prisma.question.update({
      where: { id: questionId },
      data: { solution: result.reply },
    }).catch(() => {});
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "缺少 id 参数" }, { status: 400 });

  const cached = aiCache.get(id);
  if (!cached) return NextResponse.json({ aiStatus: "processing" });

  aiCache.delete(id);
  if (cached.ok) return NextResponse.json({ aiStatus: "done", aiAnalysis: cached.reply });
  return NextResponse.json({ aiStatus: "error", aiError: cached.error });
}
