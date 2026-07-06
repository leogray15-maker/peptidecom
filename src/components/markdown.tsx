import type { ReactNode } from "react";

/** A tiny, dependency-free Markdown renderer for the imported library content.
 * Handles the subset actually used: #/##/### headings, - bullet lists,
 * 1. numbered lists, **bold**, *italic*, ***bold italic***, and [text](url).
 * Each non-empty prose line becomes its own paragraph to preserve the punchy,
 * one-thought-per-line rhythm of the source material. */

const INLINE =
  /\[([^\]]+)\]\(([^)]+)\)|\*\*\*([^*]+)\*\*\*|\*\*([^*]+)\*\*|\*([^*]+)\*/g;

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  INLINE.lastIndex = 0;
  while ((m = INLINE.exec(text))) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[1] !== undefined) {
      nodes.push(
        <a
          key={key++}
          href={m[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-300 underline underline-offset-2 hover:text-brand-200"
        >
          {m[1]}
        </a>
      );
    } else if (m[3] !== undefined) {
      nodes.push(
        <strong key={key++} className="font-semibold italic text-white">
          {m[3]}
        </strong>
      );
    } else if (m[4] !== undefined) {
      nodes.push(
        <strong key={key++} className="font-semibold text-white">
          {m[4]}
        </strong>
      );
    } else if (m[5] !== undefined) {
      nodes.push(
        <em key={key++} className="italic text-slate-200">
          {m[5]}
        </em>
      );
    }
    last = INLINE.lastIndex;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function Markdown({ content }: { content: string }) {
  const lines = content.replace(/\r/g, "").split("\n");
  const blocks: ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let key = 0;

  const flushList = () => {
    if (!list) return;
    const items = list.items.map((it, i) => (
      <li key={i} className="leading-relaxed">
        {renderInline(it)}
      </li>
    ));
    blocks.push(
      list.ordered ? (
        <ol key={key++} className="my-3 list-decimal space-y-1.5 pl-6 text-slate-300">
          {items}
        </ol>
      ) : (
        <ul key={key++} className="my-3 list-disc space-y-1.5 pl-6 text-slate-300">
          {items}
        </ul>
      )
    );
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushList();
      continue;
    }

    const bullet = line.match(/^[-*]\s+(.*)$/);
    const numbered = line.match(/^\d+[.)]\s+(.*)$/);
    const heading = line.match(/^(#{1,3})\s+(.*)$/);

    if (bullet) {
      if (!list || list.ordered) {
        flushList();
        list = { ordered: false, items: [] };
      }
      list.items.push(bullet[1]);
      continue;
    }
    if (numbered) {
      if (!list || !list.ordered) {
        flushList();
        list = { ordered: true, items: [] };
      }
      list.items.push(numbered[1]);
      continue;
    }

    flushList();

    if (heading) {
      const level = heading[1].length;
      const text = renderInline(heading[2].replace(/[:.]\s*$/, ""));
      if (level === 1) {
        blocks.push(
          <h2 key={key++} className="mt-8 text-xl font-bold text-white first:mt-0">
            {text}
          </h2>
        );
      } else if (level === 2) {
        blocks.push(
          <h3 key={key++} className="mt-6 text-lg font-semibold text-white">
            {text}
          </h3>
        );
      } else {
        blocks.push(
          <h4 key={key++} className="mt-5 text-base font-semibold text-slate-100">
            {text}
          </h4>
        );
      }
      continue;
    }

    blocks.push(
      <p key={key++} className="my-2 leading-relaxed text-slate-300">
        {renderInline(line)}
      </p>
    );
  }
  flushList();

  return <div className="text-[15px]">{blocks}</div>;
}
