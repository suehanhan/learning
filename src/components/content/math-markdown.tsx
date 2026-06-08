import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

export default function MathMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        h1: (p) => <h1 className="text-xl font-semibold text-slate-900" {...p} />,
        h2: (p) => <h2 className="text-lg font-semibold text-slate-900" {...p} />,
        h3: (p) => <h3 className="text-base font-semibold text-slate-900" {...p} />,
        p: (p) => <p className="text-sm leading-7 text-slate-700" {...p} />,
        ul: (p) => <ul className="list-disc pl-5 text-sm leading-7 text-slate-700" {...p} />,
        ol: (p) => <ol className="list-decimal pl-5 text-sm leading-7 text-slate-700" {...p} />,
        li: (p) => <li className="my-1" {...p} />,
        a: (p) => (
          <a className="text-sky-700 underline-offset-4 hover:underline" rel="noreferrer" target="_blank" {...p} />
        ),
        strong: (p) => <strong className="font-semibold text-slate-900" {...p} />,
        blockquote: (p) => (
          <blockquote className="border-l-2 border-sky-200 pl-3 text-sm leading-7 text-slate-700" {...p} />
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
