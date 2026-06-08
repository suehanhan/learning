"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import JXG from "jsxgraph";

type CurveKind = "ellipse" | "hyperbola" | "parabola";

export type SimulatorCurve = {
  id: string;
  kind: CurveKind;
  name: string;
  visible: boolean;
  style: { color: string; width: number; dash: number };
  params: Record<string, number>;
};

export type SimulatorState = {
  viewport: { boundingbox: [number, number, number, number] };
  curves: SimulatorCurve[];
  selectedId: string | null;
};

type CurveRuntime = {
  elements: any[];
  labels: any[];
};

const palette = ["#2563eb", "#dc2626", "#16a34a", "#7c3aed", "#ea580c", "#0f766e"];

function nextColor(existing: string[]) {
  for (const c of palette) if (!existing.includes(c)) return c;
  return palette[Math.floor(Math.random() * palette.length)];
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function SimulatorBoard({ initialState }: { initialState: SimulatorState }) {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const boardRef = useRef<any>(null);
  const runtimeRef = useRef<Record<string, CurveRuntime>>({});

  const [state, setState] = useState<SimulatorState>(initialState);
  const [saving, setSaving] = useState(false);
  const selected = useMemo(() => state.curves.find((c) => c.id === state.selectedId) ?? null, [state.curves, state.selectedId]);

  useEffect(() => {
    if (!boxRef.current) return;

    const board = JXG.JSXGraph.initBoard(boxRef.current.id, {
      boundingbox: state.viewport.boundingbox,
      axis: true,
      showCopyright: false,
      showNavigation: false,
      keepaspectratio: false,
      pan: { enabled: true },
      zoom: { wheel: true, needShift: false },
    });

    boardRef.current = board;

    for (const c of state.curves) mountCurve(board, c, runtimeRef.current);
    board.update();

    const handler = () => {
      try {
        const bb = board.getBoundingBox() as [number, number, number, number];
        setState((s) => ({ ...s, viewport: { boundingbox: bb } }));
      } catch {
        return;
      }
    };

    board.on("up", handler);
    board.on("zoom", handler);

    return () => {
      try {
        JXG.JSXGraph.freeBoard(board);
      } finally {
        boardRef.current = null;
        runtimeRef.current = {};
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;

    const currentIds = new Set(Object.keys(runtimeRef.current));
    const nextIds = new Set(state.curves.map((c) => c.id));

    for (const id of currentIds) {
      if (nextIds.has(id)) continue;
      unmountCurve(board, id, runtimeRef.current);
    }

    for (const c of state.curves) {
      if (!runtimeRef.current[c.id]) mountCurve(board, c, runtimeRef.current);
      updateCurve(board, c, runtimeRef.current);
    }

    board.update();
  }, [state.curves]);

  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    for (const c of state.curves) updateCurve(board, c, runtimeRef.current);
    board.update();
  }, [state.selectedId]);

  async function exportPng() {
    const board = boardRef.current;
    if (!board) return;
    const dataUrl = await exportBoardPng(board, 2);
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "conic-simulator.png";
    a.click();
  }

  async function share() {
    setSaving(true);
    try {
      const res = await fetch("/api/curve-state", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ stateJson: JSON.stringify(state) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "保存失败");

      const url = `${window.location.origin}${data.url}`;
      await navigator.clipboard.writeText(url);
      alert("分享链接已复制，可直接发给同学打开。");
    } catch (e: any) {
      alert(e?.message || "分享失败");
    } finally {
      setSaving(false);
    }
  }

  function addPreset(kind: CurveKind) {
    setState((s) => {
      const color = nextColor(s.curves.map((x) => x.style.color));
      const id = `${kind}-${Math.random().toString(16).slice(2, 8)}`;

      const curve: SimulatorCurve =
        kind === "ellipse"
          ? { id, kind, name: "椭圆", visible: true, style: { color, width: 2, dash: 0 }, params: { a: 6, b: 4 } }
          : kind === "hyperbola"
            ? { id, kind, name: "双曲线", visible: true, style: { color, width: 2, dash: 2 }, params: { a: 4, b: 3 } }
            : { id, kind, name: "抛物线", visible: true, style: { color, width: 2, dash: 0 }, params: { p: 4 } };

      return { ...s, curves: [curve, ...s.curves], selectedId: id };
    });
  }

  function applyScenario(name: string) {
    if (name === "共焦点椭圆与双曲线") {
      setState((s) => ({
        ...s,
        curves: [
          { id: "scene-e", kind: "ellipse", name: "共焦椭圆", visible: true, style: { color: "#2563eb", width: 2, dash: 0 }, params: { a: 6, b: 4 } },
          { id: "scene-h", kind: "hyperbola", name: "共焦双曲线", visible: true, style: { color: "#dc2626", width: 2, dash: 2 }, params: { a: 4, b: 3 } },
        ],
        selectedId: "scene-e",
      }));
    }

    if (name === "不同离心率的椭圆族") {
      setState((s) => ({
        ...s,
        curves: [
          { id: "e-a", kind: "ellipse", name: "e 较小", visible: true, style: { color: "#2563eb", width: 2, dash: 0 }, params: { a: 6, b: 5.2 } },
          { id: "e-b", kind: "ellipse", name: "e 中等", visible: true, style: { color: "#7c3aed", width: 2, dash: 2 }, params: { a: 6, b: 4 } },
          { id: "e-c", kind: "ellipse", name: "e 接近 1", visible: true, style: { color: "#ea580c", width: 2, dash: 4 }, params: { a: 6, b: 2.2 } },
        ],
        selectedId: "e-b",
      }));
    }

    if (name === "抛物线开口对比") {
      setState((s) => ({
        ...s,
        curves: [
          { id: "p-1", kind: "parabola", name: "p=2", visible: true, style: { color: "#2563eb", width: 2, dash: 0 }, params: { p: 2 } },
          { id: "p-2", kind: "parabola", name: "p=4", visible: true, style: { color: "#16a34a", width: 2, dash: 2 }, params: { p: 4 } },
          { id: "p-3", kind: "parabola", name: "p=8", visible: true, style: { color: "#dc2626", width: 2, dash: 4 }, params: { p: 8 } },
        ],
        selectedId: "p-2",
      }));
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
      <div className="rounded-2xl border border-sky-100 bg-white/80 p-4 shadow-sm shadow-sky-100">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-slate-900">曲线列表</div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="h-9 rounded-lg border border-sky-100 bg-white px-3 text-sm text-slate-700 transition hover:bg-sky-50"
              onClick={() => addPreset("ellipse")}
            >
              + 椭圆
            </button>
            <button
              type="button"
              className="h-9 rounded-lg border border-sky-100 bg-white px-3 text-sm text-slate-700 transition hover:bg-sky-50"
              onClick={() => addPreset("hyperbola")}
            >
              + 双曲线
            </button>
            <button
              type="button"
              className="h-9 rounded-lg border border-sky-100 bg-white px-3 text-sm text-slate-700 transition hover:bg-sky-50"
              onClick={() => addPreset("parabola")}
            >
              + 抛物线
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-2">
          {state.curves.map((c) => (
            <div
              key={c.id}
              className={`rounded-xl border p-3 transition ${
                c.id === state.selectedId ? "border-sky-200 bg-sky-50" : "border-slate-100 bg-white hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  onClick={() => setState((s) => ({ ...s, selectedId: c.id }))}
                >
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: c.style.color }} />
                  <span className="truncate text-sm font-medium text-slate-900">{c.name}</span>
                  <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-600">
                    {c.kind === "ellipse" ? "椭圆" : c.kind === "hyperbola" ? "双曲线" : "抛物线"}
                  </span>
                </button>
                <button
                  type="button"
                  className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 transition hover:bg-slate-50"
                  onClick={() =>
                    setState((s) => ({
                      ...s,
                      curves: s.curves.map((x) => (x.id === c.id ? { ...x, visible: !x.visible } : x)),
                    }))
                  }
                >
                  {c.visible ? "隐藏" : "显示"}
                </button>
                <button
                  type="button"
                  className="h-8 rounded-lg border border-rose-200 bg-rose-50 px-2 text-xs text-rose-700 transition hover:bg-rose-100"
                  onClick={() =>
                    setState((s) => ({
                      ...s,
                      curves: s.curves.filter((x) => x.id !== c.id),
                      selectedId: s.selectedId === c.id ? (s.curves.find((x) => x.id !== c.id)?.id ?? null) : s.selectedId,
                    }))
                  }
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-2xl border border-slate-100 bg-white p-4">
          <div className="text-sm font-semibold text-slate-900">预设对比场景</div>
          <div className="mt-3 grid gap-2">
            {["共焦点椭圆与双曲线", "不同离心率的椭圆族", "抛物线开口对比"].map((x) => (
              <button
                key={x}
                type="button"
                className="h-10 rounded-xl border border-sky-100 bg-white px-4 text-left text-sm text-slate-700 transition hover:bg-sky-50"
                onClick={() => applyScenario(x)}
              >
                {x}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-100 bg-white p-4">
          <div className="text-sm font-semibold text-slate-900">选中曲线参数</div>
          <div className="mt-3 grid gap-4">
            {selected ? (
              selected.kind === "ellipse" ? (
                <>
                  <Slider
                    label="a"
                    value={selected.params.a ?? 6}
                    min={1}
                    max={12}
                    step={0.1}
                    onChange={(v) => updateParams(selected.id, { a: v })}
                  />
                  <Slider
                    label="b"
                    value={selected.params.b ?? 4}
                    min={0.5}
                    max={12}
                    step={0.1}
                    onChange={(v) => updateParams(selected.id, { b: v })}
                  />
                </>
              ) : selected.kind === "hyperbola" ? (
                <>
                  <Slider
                    label="a"
                    value={selected.params.a ?? 4}
                    min={0.5}
                    max={10}
                    step={0.1}
                    onChange={(v) => updateParams(selected.id, { a: v })}
                  />
                  <Slider
                    label="b"
                    value={selected.params.b ?? 3}
                    min={0.5}
                    max={10}
                    step={0.1}
                    onChange={(v) => updateParams(selected.id, { b: v })}
                  />
                </>
              ) : (
                <Slider
                  label="p"
                  value={selected.params.p ?? 4}
                  min={0.5}
                  max={12}
                  step={0.1}
                  onChange={(v) => updateParams(selected.id, { p: v })}
                />
              )
            ) : (
              <div className="text-sm text-slate-600">请选择一条曲线。</div>
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="h-10 rounded-xl bg-sky-600 px-4 text-sm font-medium text-white transition hover:bg-sky-700"
            onClick={exportPng}
          >
            导出 PNG
          </button>
          <button
            type="button"
            disabled={saving}
            className="h-10 rounded-xl border border-sky-100 bg-white px-4 text-sm text-slate-700 transition hover:bg-sky-50 disabled:opacity-60"
            onClick={share}
          >
            {saving ? "生成链接…" : "复制分享链接"}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-sky-100 bg-white/80 p-4 shadow-sm shadow-sky-100">
        <div className="text-sm font-semibold text-slate-900">画布</div>
        <div className="mt-3 overflow-hidden rounded-2xl border border-slate-100 bg-white">
          <div id="jxg-simulator" ref={boxRef} className="h-[560px] w-full" />
        </div>
      </div>
    </div>
  );

  function updateParams(id: string, next: Record<string, number>) {
    setState((s) => ({
      ...s,
      curves: s.curves.map((c) => (c.id === id ? { ...c, params: { ...c.params, ...next } } : c)),
    }));
  }
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between text-sm">
        <div className="font-medium text-slate-900">{label}</div>
        <div className="rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-600">{value.toFixed(2)}</div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-sky-600"
      />
    </div>
  );
}

function mountCurve(board: any, curve: SimulatorCurve, store: Record<string, CurveRuntime>) {
  const rt: CurveRuntime = { elements: [], labels: [] };
  store[curve.id] = rt;

  const { color, width, dash } = curve.style;

  if (curve.kind === "ellipse") {
    const a = () => Math.max(0.1, curve.params.a || 6);
    const b = () => Math.max(0.1, clamp(curve.params.b || 4, 0.1, a()));
    const el = board.create(
      "curve",
      [
        (t: number) => a() * Math.cos(t),
        (t: number) => b() * Math.sin(t),
        0,
        2 * Math.PI,
      ],
      { strokeColor: color, strokeWidth: width, dash },
    );

    rt.elements.push(el);
    rt.labels.push(
      board.create("text", [() => a() + 0.2, () => 0.2, curve.name], { strokeColor: color, fixed: true, fontSize: 12 }),
    );

    const c = () => Math.sqrt(Math.max(a() * a() - b() * b(), 0));
    rt.elements.push(board.create("point", [() => c(), 0], { name: "F₁", size: 2, color, label: { offset: [6, 6] } }));
    rt.elements.push(board.create("point", [() => -c(), 0], { name: "F₂", size: 2, color, label: { offset: [6, 6] } }));
    rt.elements.push(board.create("point", [() => a(), 0], { name: "A₁", size: 2, color, label: { offset: [6, 6] } }));
    rt.elements.push(board.create("point", [() => -a(), 0], { name: "A₂", size: 2, color, label: { offset: [6, 6] } }));
    rt.elements.push(board.create("point", [0, 0], { name: "O", size: 2, color, label: { offset: [6, 6] } }));
  }

  if (curve.kind === "hyperbola") {
    const a = () => Math.max(0.1, curve.params.a || 4);
    const b = () => Math.max(0.1, curve.params.b || 3);
    const tMin = -2.2;
    const tMax = 2.2;

    const xPos = (t: number) => a() * Math.cosh(t);
    const yPos = (t: number) => b() * Math.sinh(t);
    const xNeg = (t: number) => -a() * Math.cosh(t);
    const yNeg = (t: number) => b() * Math.sinh(t);

    rt.elements.push(board.create("curve", [xPos, yPos, tMin, tMax], { strokeColor: color, strokeWidth: width, dash }));
    rt.elements.push(board.create("curve", [xNeg, yNeg, tMin, tMax], { strokeColor: color, strokeWidth: width, dash }));

    const c = () => Math.sqrt(a() * a() + b() * b());
    rt.elements.push(board.create("point", [() => c(), 0], { name: "F₁", size: 2, color, label: { offset: [6, 6] } }));
    rt.elements.push(board.create("point", [() => -c(), 0], { name: "F₂", size: 2, color, label: { offset: [6, 6] } }));
    rt.elements.push(board.create("point", [() => a(), 0], { name: "A₁", size: 2, color, label: { offset: [6, 6] } }));
    rt.elements.push(board.create("point", [() => -a(), 0], { name: "A₂", size: 2, color, label: { offset: [6, 6] } }));

    const asym1 = board.create("line", [0, 0, () => b() / a()], { strokeColor: color, dash: 2, strokeWidth: 1 });
    const asym2 = board.create("line", [0, 0, () => -b() / a()], { strokeColor: color, dash: 2, strokeWidth: 1 });
    rt.elements.push(asym1, asym2);
  }

  if (curve.kind === "parabola") {
    const p = () => Math.max(0.1, curve.params.p || 4);
    const tMin = -12;
    const tMax = 12;

    const parab = board.create(
      "curve",
      [
        (t: number) => (t * t) / (2 * p()),
        (t: number) => t,
        tMin,
        tMax,
      ],
      { strokeColor: color, strokeWidth: width, dash },
    );
    rt.elements.push(parab);

    rt.elements.push(board.create("point", [0, 0], { name: "V", size: 2, color, label: { offset: [6, 6] } }));
    rt.elements.push(board.create("point", [() => p() / 2, 0], { name: "F", size: 2, color, label: { offset: [6, 6] } }));

    const directrix = board.create("line", [() => -p() / 2, 0, 0], { strokeColor: color, dash: 2, strokeWidth: 1 });
    rt.elements.push(directrix);
  }

  updateVisibility(store, curve.id, curve.visible);
}

function updateCurve(board: any, curve: SimulatorCurve, store: Record<string, CurveRuntime>) {
  const rt = store[curve.id];
  if (!rt) return;

  for (const el of rt.elements) {
    if (el?.setAttribute) {
      el.setAttribute({ strokeColor: curve.style.color, strokeWidth: curve.style.width, dash: curve.style.dash });
    }
  }

  updateVisibility(store, curve.id, curve.visible);
  board.update();
}

function updateVisibility(store: Record<string, CurveRuntime>, id: string, visible: boolean) {
  const rt = store[id];
  if (!rt) return;
  for (const el of [...rt.elements, ...rt.labels]) {
    if (el?.setAttribute) el.setAttribute({ visible });
  }
}

function unmountCurve(board: any, id: string, store: Record<string, CurveRuntime>) {
  const rt = store[id];
  if (!rt) return;
  for (const el of [...rt.elements, ...rt.labels]) {
    try {
      board.removeObject(el);
    } catch {
      continue;
    }
  }
  delete store[id];
}

async function exportBoardPng(board: any, scale = 2): Promise<string> {
  const svgRoot: SVGSVGElement | undefined = board?.renderer?.svgRoot;
  if (!svgRoot) throw new Error("SVG root not found");

  const clone = svgRoot.cloneNode(true) as SVGSVGElement;
  const bbox = svgRoot.getBoundingClientRect();
  const width = Math.max(1, Math.round(bbox.width));
  const height = Math.max(1, Math.round(bbox.height));

  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", String(width));
  clone.setAttribute("height", String(height));

  const svgText = new XMLSerializer().serializeToString(clone);
  const svgDataUrl = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgText);

  const img = new Image();
  img.decoding = "async";
  img.src = svgDataUrl;

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Failed to load SVG"));
  });

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context not found");
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.drawImage(img, 0, 0);

  return canvas.toDataURL("image/png");
}
