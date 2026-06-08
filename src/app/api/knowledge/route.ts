import { NextResponse } from "next/server";
import { prisma } from "@/server/db";

type Node = {
  id: string;
  title: string;
  content: string;
  category: string;
  parentId: string | null;
  order: number;
  children?: Node[];
};

function buildTree(items: Node[]) {
  const byId = new Map<string, Node>();
  for (const n of items) byId.set(n.id, { ...n, children: [] });

  const roots: Node[] = [];
  for (const n of byId.values()) {
    if (n.parentId && byId.has(n.parentId)) byId.get(n.parentId)!.children!.push(n);
    else roots.push(n);
  }

  const sortRec = (arr: Node[]) => {
    arr.sort((a, b) => a.order - b.order);
    for (const x of arr) sortRec(x.children || []);
  };
  sortRec(roots);
  return roots;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const query = url.searchParams.get("query")?.trim() || "";
  const category = url.searchParams.get("category")?.trim() || "";
  const parentId = url.searchParams.get("parentId")?.trim() || "";

  const where: any = {};
  if (category) where.category = category;
  if (parentId) where.parentId = parentId;
  if (query) {
    where.OR = [{ title: { contains: query } }, { content: { contains: query } }];
  }

  const rows = await prisma.knowledge.findMany({
    where,
    select: { id: true, title: true, content: true, category: true, parentId: true, order: true },
    orderBy: [{ order: "asc" }, { title: "asc" }],
  });

  const nodes: Node[] = rows.map((r) => ({ ...r, parentId: r.parentId ?? null }));

  if (query || parentId) return NextResponse.json({ nodes });
  return NextResponse.json({ nodes: buildTree(nodes) });
}

