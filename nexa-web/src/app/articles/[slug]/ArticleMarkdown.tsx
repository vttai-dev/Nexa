'use client';

import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { Check, Copy, Code2, FileText, Image as ImageIcon } from 'lucide-react';
import { useState } from 'react';
import { parseNotebook, serializeNotebook } from '@/lib/notebook';
import { MarkdownImage } from '@/components/articles/MarkdownImage';

interface Props {
  markdown: string;
}

export function ArticleMarkdown({ markdown }: Props) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const cells = parseNotebook(markdown);

  const copyCode = async (id: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
    } catch {
      setCopiedId(null);
    }
  };

  return (
    <div className="space-y-5">
      {cells.map((cell, index) => {
        const CellIcon = cell.type === 'code' ? Code2 : cell.type === 'image' ? ImageIcon : FileText;
        return <section key={cell.id} className="overflow-hidden rounded-2xl border border-border/70 bg-background/60 shadow-xs sm:grid sm:grid-cols-[3.75rem_minmax(0,1fr)]">
          <div className="flex items-center gap-2 border-b border-border/60 bg-muted/30 px-4 py-2 text-xs font-mono text-muted-foreground sm:flex-col sm:justify-start sm:gap-2 sm:border-b-0 sm:border-r sm:px-2 sm:py-5">
            <span className="text-primary">[{String(index + 1).padStart(2, '0')}]</span>
            <CellIcon className="h-3.5 w-3.5" aria-hidden="true" />
          </div>
          {cell.type === 'text' && <div className="min-w-0 p-5 sm:p-7 prose prose-slate dark:prose-invert max-w-none
            prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground
            prose-h1:text-3xl prose-h2:text-2xl prose-h2:border-b prose-h2:border-border/60 prose-h2:pb-2.5 prose-h2:mt-10
            prose-h3:text-xl prose-h3:mt-8
            prose-p:text-foreground/90 prose-p:leading-relaxed prose-p:text-base sm:prose-p:text-lg
            prose-a:text-primary prose-a:font-medium prose-a:no-underline hover:prose-a:underline
            prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
            prose-pre:bg-slate-950 dark:prose-pre:bg-slate-900 prose-pre:border prose-pre:border-border/80 prose-pre:rounded-xl prose-pre:shadow-sm prose-pre:p-4
            prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-muted/40 prose-blockquote:py-2 prose-blockquote:px-5 prose-blockquote:rounded-r-xl prose-blockquote:italic
            prose-img:rounded-2xl prose-img:border prose-img:border-border/60 prose-img:shadow-md
            prose-ul:my-4 prose-li:my-1 text-foreground/90">
            <ReactMarkdown components={{ img: MarkdownImage }} rehypePlugins={[rehypeSanitize]}>{cell.content}</ReactMarkdown>
          </div>}
          {cell.type === 'code' && <div className="min-w-0 bg-slate-950 text-slate-100">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-2 text-xs text-slate-400">
              <span className="font-mono">{cell.language || 'code'}</span>
              <button type="button" onClick={() => void copyCode(cell.id, cell.content)} className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 hover:bg-white/10 hover:text-white" aria-label="Sao chép mã nguồn">
                {copiedId === cell.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedId === cell.id ? 'Đã sao chép' : 'Sao chép'}
              </button>
            </div>
            <pre className="overflow-x-auto p-4 text-sm leading-6"><code>{cell.content}</code></pre>
          </div>}
          {cell.type === 'image' && <figure className="min-w-0 p-4 sm:p-6">
            <div className="overflow-hidden rounded-xl border border-border/60 bg-muted/20 text-center prose-img:mx-auto prose-img:max-h-[32rem] prose-img:rounded-lg">
              <ReactMarkdown components={{ img: MarkdownImage }} rehypePlugins={[rehypeSanitize]}>{serializeNotebook([cell])}</ReactMarkdown>
            </div>
            {cell.alt && <figcaption className="pt-3 text-center text-sm text-muted-foreground">{cell.alt}</figcaption>}
          </figure>}
        </section>;
      })}
    </div>
  );
}
