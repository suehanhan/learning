"use client";

import { useEffect, useMemo, useState } from "react";
import MathMarkdown from "@/components/content/math-markdown";

type Node = {
  id: string;
  title: string;
  content: string;
  category: string;
  parentId: string | null;
  order: number;
  children?: Node[];
};

function flattenTree(nodes: Node[], acc: Node[] = []) {
  for (const n of nodes) {
    acc.push(n);
    if (n.children?.length) flattenTree(n.children, acc);
  }
  return acc;
}

export default function KnowledgeBrowser() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [tree, setTree] = useState<Node[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const flat = useMemo(() => flattenTree(tree), [tree]);
  const selected = useMemo(() => flat.find((x) => x.id === selectedId) ?? null, [flat, selectedId]);

  useEffect(() => {
    let alive = true;
    setLoading(true);

    fetch("/api/knowledge")
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        setTree(d.nodes || []);
        const first = (d.nodes || [])[0]?.children?.[0]?.id || (d.nodes || [])[0]?.id || null;
        setSelectedId(first);
      })
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return null;
    const hits = flat.filter((x) => x.title.includes(q) || x.content.includes(q));
    return hits.slice(0, 50);
  }, [flat, query]);

  function NodeItem({ node, depth }: { node: Node; depth: number }) {
    const hasChildren = !!node.children?.length;
    const isExpanded = expanded[node.id] ?? depth < 2;
    const isActive = node.id === selectedId;

    return (
      <div>
        <button
          type="button"
          className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${
            isActive ? "bg-sky-100 text-slate-900" : "text-slate-700 hover:bg-sky-50"
          }`}
          style={{ paddingLeft: 12 + depth * 10 }}
          onClick={() => {
            setSelectedId(node.id);
            if (hasChildren) setExpanded((m) => ({ ...m, [node.id]: !isExpanded }));
          }}
        >
          <span className="line-clamp-1">{node.title}</span>
          {hasChildren ? (
            <span className="text-xs text-slate-500">{isExpanded ? "收起" : "展开"}</span>
          ) : (
            <span className="text-xs text-slate-400">查看</span>
          )}
        </button>

        {hasChildren && isExpanded ? (
          <div className="mt-1 grid gap-1">
            {node.children!.map((c) => (
              <NodeItem key={c.id} node={c} depth={depth + 1} />
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-[360px_1fr]">
      <div className="rounded-2xl border border-sky-100 bg-white/80 p-4 shadow-sm shadow-sky-100">
        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索：离心率 / 渐近线 / 通径 / 点差法 …"
            className="h-10 w-full rounded-xl border border-sky-100 bg-white px-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-sky-300"
          />
          <button
            type="button"
            className="h-10 rounded-xl border border-sky-100 bg-white px-3 text-sm text-slate-700 transition hover:bg-sky-50"
            onClick={() => setQuery("")}
          >
            清空
          </button>
        </div>

        <div className="mt-4">
          {loading ? (
            <div className="grid gap-2">
              <div className="h-10 animate-pulse rounded-xl bg-slate-100" />
              <div className="h-10 animate-pulse rounded-xl bg-slate-100" />
              <div className="h-10 animate-pulse rounded-xl bg-slate-100" />
            </div>
          ) : filtered ? (
            <div className="grid gap-2">
              <div className="text-xs text-slate-500">命中 {filtered.length} 条（最多展示 50 条）</div>
              {filtered.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => setSelectedId(n.id)}
                  className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
                    n.id === selectedId
                      ? "border-sky-200 bg-sky-50 text-slate-900"
                      : "border-slate-100 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="font-medium">{n.title}</div>
                  <div className="mt-1 line-clamp-2 text-xs text-slate-500">{n.content}</div>
                </button>
              ))}
            </div>
          ) : (
            <div className="grid gap-2">
              {tree.map((n) => (
                <NodeItem key={n.id} node={n} depth={0} />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-sky-100 bg-white/80 p-6 shadow-sm shadow-sky-100">
        {selected ? (
          <div className="grid gap-4">
            <div>
              <div className="text-xs text-sky-700">{selected.category}</div>
              <div className="mt-2 text-xl font-semibold text-slate-900">{selected.title}</div>
            </div>
            <MathMarkdown content={selected.content} />
          </div>
        ) : (
          <div className="text-sm text-slate-600">请选择左侧知识点。</div>
        )}
      </div>
    </div>
  );
}

