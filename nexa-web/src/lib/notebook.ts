export type NotebookCell =
  | { id: string; type: 'text'; content: string }
  | { id: string; type: 'code'; content: string; language: string }
  | { id: string; type: 'image'; url: string; alt: string };

const separator = '\n\n<!-- nexa:notebook-cell -->\n\n';
let nextCellId = 0;

export function createNotebookCell(type: NotebookCell['type']): NotebookCell {
  const id = `new-cell-${++nextCellId}`;
  if (type === 'code') return { id, type, content: '', language: '' };
  if (type === 'image') return { id, type, url: '', alt: '' };
  return { id, type, content: '' };
}

export function parseNotebook(markdown: string): NotebookCell[] {
  if (!markdown.trim()) return [{ id: 'cell-0', type: 'text', content: '' }];

  const normalizedMarkdown = markdown.replace(/(!\[(?:\\.|[^\]\\\n])*\])\s+\(([^)\s]+)\)/g, '$1($2)');

  return normalizedMarkdown.split(separator).map((raw, index): NotebookCell => {
    const content = raw.replace(/^\n+|\n+$/g, '');
    const id = `cell-${index}`;
    const code = /^(`{3,})([a-zA-Z0-9_+.-]*)\n([\s\S]*)\n\1$/.exec(content);
    if (code) return { id, type: 'code', language: code[2], content: code[3] };
    const image = /^!\[((?:\\.|[^\]\\\n])*)\]\(([^\n]*)\)$/.exec(content);
    if (image) return { id, type: 'image', alt: image[1].replace(/\\\]/g, ']').replace(/\\\\/g, '\\'), url: image[2] };
    return { id, type: 'text', content };
  });
}

export function serializeNotebook(cells: NotebookCell[]): string {
  return cells.map((cell) => {
    if (cell.type === 'text') return cell.content.replace(/^\n+|\n+$/g, '');
    if (cell.type === 'image') {
      if (!cell.url.trim()) return '';
      return `![${cell.alt.replace(/\\/g, '\\\\').replace(/\]/g, '\\]')}](${cell.url.trim().replace(/\)/g, '%29')})`;
    }
    if (!cell.content.trim()) return '';
    const longestTicks = Math.max(0, ...(cell.content.match(/`+/g)?.map((run) => run.length) ?? []));
    const fence = '`'.repeat(Math.max(3, longestTicks + 1));
    return `${fence}${cell.language}\n${cell.content}\n${fence}`;
  }).filter(Boolean).join(separator);
}
