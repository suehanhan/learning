"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import SimulatorBoard, { type SimulatorState } from "@/components/simulator/simulator-board";

export default function SimulatorPage() {
  const sp = useSearchParams();
  const shareId = sp.get("share");

  const [initial, setInitial] = useState<SimulatorState | null>(null);
  const [loadingShare, setLoadingShare] = useState(false);

  const defaultState: SimulatorState = useMemo(
    () => ({
      viewport: { boundingbox: [-10, 10, 10, -10] },
      curves: [
        { id: "e1", kind: "ellipse", name: "椭圆 1", visible: true, style: { color: "#2563eb", width: 2, dash: 0 }, params: { a: 6, b: 4 } },
        { id: "h1", kind: "hyperbola", name: "双曲线 1", visible: true, style: { color: "#dc2626", width: 2, dash: 2 }, params: { a: 4, b: 3 } },
      ],
      selectedId: "e1",
    }),
    [],
  );

  useEffect(() => {
    if (!shareId) {
      setInitial(defaultState);
      return;
    }

    let alive = true;
    setLoadingShare(true);
    fetch(`/api/curve-state/${shareId}`)
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        const parsed = JSON.parse(d.stateJson || "{}") as SimulatorState;
        setInitial(parsed?.curves?.length ? parsed : defaultState);
      })
      .catch(() => alive && setInitial(defaultState))
      .finally(() => alive && setLoadingShare(false));

    return () => {
      alive = false;
    };
  }, [defaultState, shareId]);

  return (
    <div className="grid gap-6">
      <div className="rounded-2xl border border-sky-100 bg-white/80 p-6 shadow-sm shadow-sky-100">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm text-sky-700">多曲线动态图像模拟器</div>
            <div className="mt-2 text-xl font-semibold text-slate-900">同屏对比：只调一条曲线，其它保持不变，减少“想象成本”。</div>
            <div className="mt-3 text-sm leading-6 text-slate-600">
              操作：左侧管理曲线（显隐/样式/参数），选中某条后可滑块变形；支持导出 PNG 与分享链接（可复现状态）。
            </div>
          </div>
          {shareId ? (
            <div className="rounded-xl border border-sky-100 bg-sky-50 px-4 py-2 text-sm text-sky-800">
              {loadingShare ? "正在加载分享状态…" : "已从分享链接恢复状态"}
            </div>
          ) : null}
        </div>
      </div>

      {initial ? <SimulatorBoard initialState={initial} /> : <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />}
    </div>
  );
}

