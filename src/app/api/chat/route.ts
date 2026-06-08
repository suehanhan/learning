import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";
import { getAuthedUser } from "@/server/auth/api";
import { chatText } from "@/server/ai/client";

const schema = z.object({
  mode: z.enum(["direct", "guided"]).default("guided"),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1),
      }),
    )
    .min(1)
    .max(20),
  imageDataUrl: z.string().optional(),
});

export async function POST(req: Request) {
  const me = await getAuthedUser();
  if (!me) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "参数不合法" }, { status: 400 });

  const lastUser = [...parsed.data.messages].reverse().find((m) => m.role === "user")?.content || "";
  const knowledge = await findRelatedKnowledge(lastUser);

  const knowledgeDigest = knowledge
    .map((k, idx) => `【K${idx + 1}】${k.title}\n${k.content.slice(0, 400)}`)
    .join("\n\n");

  const systemDirect =
    "你是高中数学圆锥曲线答疑老师。请用清晰、结构化的方式解答问题，使用中文，优先用数形结合语言解释，必要时给出关键公式与结论。可参考以下知识库内容辅助回答：";

  const systemGuided =
    "你是高中数学圆锥曲线答疑老师，采用引导式答疑。规则：1) 先问 1-2 个澄清/引导问题；2) 给 2-4 个提示，鼓励学生自己推导；3) 最后给完整解答与总结；4) 用中文；5) 尽量引用提供的知识库摘要。可参考以下知识库内容：";

  const system = [
    parsed.data.mode === "guided" ? systemGuided : systemDirect,
    "",
    knowledgeDigest || "（暂无相关知识库内容）",
  ].join("\n\n");

  const user = [
    "学生问题：",
    lastUser,
  ].join("\n");

  const res = await chatText({ system, user, imageDataUrl: parsed.data.imageDataUrl });

  const reply = res.ok ? res.reply : `【AI 暂时无法回复】${res.error}`;

  const now = new Date();
  await prisma.chatHistory.createMany({
    data: [
      { userId: me.sub, role: "user", content: lastUser, timestamp: now },
      { userId: me.sub, role: "assistant", content: reply, timestamp: now },
    ],
  });

  return NextResponse.json({ reply });
}

async function findRelatedKnowledge(text: string) {
  const q = text.trim();
  if (!q) return [];

  const keywords = extractKeywords(q);
  if (!keywords.length) return [];

  const or = keywords.slice(0, 5).map((k) => ({ OR: [{ title: { contains: k } }, { content: { contains: k } }] }));
  const rows = await prisma.knowledge.findMany({
    where: { AND: or },
    select: { id: true, title: true, content: true },
    take: 3,
    orderBy: { order: "asc" },
  });
  return rows;
}

function extractKeywords(text: string) {
  const list = [
    "椭圆",
    "双曲线",
    "抛物线",
    "离心率",
    "焦点",
    "准线",
    "通径",
    "渐近线",
    "切线",
    "弦长",
    "点差法",
    "设而不求",
    "焦半径",
  ];
  return list.filter((k) => text.includes(k));
}
