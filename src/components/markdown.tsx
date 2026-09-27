import type { ReactNode } from "react";

/** A tiny, dependency-free Markdown renderer for the imported library content.
 * Handles the subset actually used: #/##/### headings, - bullet lists,
 * 1. numbered lists, **bold**, *italic*, ***bold italic***, [text](url), and
 * standalone ![alt](url) images. Each non-empty prose line becomes its own
 * paragraph to preserve the punchy, one-thought-per-line rhythm of the source
 * material. */

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
          className="text-accent-strong underline underline-offset-2 hover:text-fg"
        >
          {m[1]}
        </a>
      );
    } else if (m[3] !== undefined) {
      nodes.push(
        <strong key={key++} className="font-semibold italic text-fg">
          {m[3]}
        </strong>
      );
    } else if (m[4] !== undefined) {
      nodes.push(
        <strong key={key++} className="font-semibold text-fg">
          {m[4]}
        </strong>
      );
    } else if (m[5] !== undefined) {
      nodes.push(
        <em key={key++} className="italic text-fg">
          {m[5]}
        </em>
      );
    }
    last = INLINE.lastIndex;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

/** Count the list items a body will render — each one is a checkable step. */
export function countSteps(content: string): number {
  return content
    .replace(/\r/g, "")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => /^[-*]\s+/.test(l) || /^\d+[.)]\s+/.test(l)).length;
}

export interface MarkdownSteps {
  done: ReadonlySet<number>;
  onToggle: (index: number) => void;
}

export function Markdown({ content, steps }: { content: string; steps?: MarkdownSteps }) {
  const lines = content.replace(/\r/g, "").split("\n");
  const blocks: ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let key = 0;
  let stepIndex = 0;

  const flushList = () => {
    if (!list) return;
    const ordered = list.ordered;
    const items = list.items.map((it, i) => {
      if (!steps) {
        return (
          <li key={i} className="leading-relaxed">
            {renderInline(it)}
          </li>
        );
      }
      const idx = stepIndex++;
      const on = steps.done.has(idx);
      return (
        <li key={i}>
          <label className="-mx-2 flex cursor-pointer gap-3 rounded-control px-2 py-2 transition-colors hover:bg-surface-active/60">
            <input
              type="checkbox"
              checked={on}
              onChange={() => steps.onToggle(idx)}
              className="mt-[3px] h-[18px] w-[18px] shrink-0 cursor-pointer rounded-[5px] accent-primary"
            />
            <span className={on ? "leading-relaxed text-fg-muted line-through decoration-fg-faint" : "leading-relaxed"}>
              {ordered && <span className="mr-1.5 font-mono text-[13px] tabular-nums text-fg-muted">{i + 1}.</span>}
              {renderInline(it)}
            </span>
          </label>
        </li>
      );
    });
    const cls = steps
      ? "my-3 space-y-0.5 text-fg-secondary"
      : ordered
        ? "my-3 list-decimal space-y-1.5 pl-6 text-fg-secondary"
        : "my-3 list-disc space-y-1.5 pl-6 text-fg-secondary";
    blocks.push(
      ordered ? (
        <ol key={key++} className={cls}>
          {items}
        </ol>
      ) : (
        <ul key={key++} className={cls}>
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

    // A line that is only an image — render it full-width. External CDN images
    // (Skool etc.) block hot-linking, so route them through our own server
    // proxy; local /public images pass straight through.
    const image = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (image) {
      flushList();
      const rawSrc = image[2];
      const src = /^https?:\/\//.test(rawSrc)
        ? `/api/protocol-image?u=${encodeURIComponent(rawSrc)}`
        : rawSrc;
      blocks.push(
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={key++}
          src={src}
          alt={image[1] || ""}
          loading="lazy"
          className="my-5 w-full rounded-control border border-line"
        />
      );
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
          <h2 key={key++} className="mt-9 text-[19px] font-semibold text-fg first:mt-0">
            {text}
          </h2>
        );
      } else if (level === 2) {
        blocks.push(
          <h3 key={key++} className="mt-7 text-[16.5px] font-semibold text-fg">
            {text}
          </h3>
        );
      } else {
        blocks.push(
          <h4 key={key++} className="mt-5 text-[15px] font-semibold text-fg">
            {text}
          </h4>
        );
      }
      continue;
    }

    blocks.push(
      <p key={key++} className="my-2.5 leading-[1.7] text-fg-secondary">
        {renderInline(line)}
      </p>
    );
  }
  flushList();

  return <div className="text-[15.5px]">{blocks}</div>;
}
