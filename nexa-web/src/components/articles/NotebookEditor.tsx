'use client';

import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { ArrowDown, ArrowUp, Code2, FileText, Image as ImageIcon, Loader2, Plus, Trash2, Upload } from 'lucide-react';
import { mediaApi } from '@/lib/api/media';
import { createNotebookCell, parseNotebook, serializeNotebook, type NotebookCell } from '@/lib/notebook';
import { MarkdownImage } from '@/components/articles/MarkdownImage';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface Props {
  value: string;
  onChange: (markdown: string) => void;
}

const cellOptions = [
  { type: 'text', label: 'Văn bản', icon: FileText },
  { type: 'code', label: 'Mã nguồn', icon: Code2 },
  { type: 'image', label: 'Hình ảnh', icon: ImageIcon },
] as const;

export function NotebookEditor({ value, onChange }: Props) {
  const [cells, setCells] = useState<NotebookCell[]>(() => parseNotebook(value));
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const cellsRef = useRef(cells);
  const serializedRef = useRef(value);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const imageTargetRef = useRef<string | null>(null);

  useEffect(() => {
    if (value !== serializedRef.current) {
      const parsed = parseNotebook(value);
      cellsRef.current = parsed;
      serializedRef.current = value;
      setCells(parsed);
    }
  }, [value]);

  const commit = (next: NotebookCell[]) => {
    cellsRef.current = next;
    setCells(next);
    const markdown = serializeNotebook(next);
    serializedRef.current = markdown;
    onChange(markdown);
  };

  const updateCell = (id: string, change: Partial<NotebookCell>) => {
    commit(cellsRef.current.map((cell) => cell.id === id ? { ...cell, ...change } as NotebookCell : cell));
  };

  const insertCell = (afterIndex: number, type: NotebookCell['type']) => {
    const next = [...cellsRef.current];
    next.splice(afterIndex + 1, 0, createNotebookCell(type));
    commit(next);
  };

  const removeCell = (id: string) => {
    const next = cellsRef.current.filter((cell) => cell.id !== id);
    commit(next.length ? next : [createNotebookCell('text')]);
  };

  const moveCell = (index: number, direction: -1 | 1) => {
    const next = [...cellsRef.current];
    const destination = index + direction;
    if (destination < 0 || destination >= next.length) return;
    [next[index], next[destination]] = [next[destination], next[index]];
    commit(next);
  };

  const uploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const id = imageTargetRef.current;
    if (!file || !id) return;
    setUploadingId(id);
    try {
      const asset = await mediaApi.uploadImage(file);
      const next = cellsRef.current.map((cell) => cell.id === id && cell.type === 'image'
        ? { ...cell, url: asset.url, alt: cell.alt || asset.fileName } : cell);
      commit(next);
      toast({ title: 'Đã thêm ảnh vào bài viết' });
    } catch (error) {
      toast({ title: 'Không tải được ảnh', description: error instanceof Error ? error.message : 'Vui lòng thử lại.', variant: 'destructive' });
    } finally {
      setUploadingId(null);
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 bg-muted/30 px-4 py-3">
        <div>
          <p className="text-sm font-semibold">Sổ tay bài viết</p>
          <p className="text-xs text-muted-foreground">Xếp từng khối văn bản, mã nguồn và ảnh theo thứ tự đọc.</p>
        </div>
        <span className="rounded-md bg-background px-2 py-1 font-mono text-[11px] text-muted-foreground">{cells.length} khối</span>
      </div>

      <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={uploadImage} />

      {cells.map((cell, index) => {
        const CellIcon = cell.type === 'code' ? Code2 : cell.type === 'image' ? ImageIcon : FileText;
        const label = cell.type === 'code' ? 'Mã nguồn' : cell.type === 'image' ? 'Hình ảnh' : 'Văn bản';
        return (
          <div key={cell.id} className="group rounded-2xl border border-border/80 bg-card shadow-xs focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/20">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 bg-muted/30 px-3 py-2 sm:px-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <span className="font-mono text-primary">[{String(index + 1).padStart(2, '0')}]</span>
                <CellIcon className="h-3.5 w-3.5" />
                {label}
              </div>
              <div className="flex items-center gap-0.5">
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={index === 0} aria-label="Chuyển khối lên" onClick={() => moveCell(index, -1)}><ArrowUp className="h-3.5 w-3.5" /></Button>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={index === cells.length - 1} aria-label="Chuyển khối xuống" onClick={() => moveCell(index, 1)}><ArrowDown className="h-3.5 w-3.5" /></Button>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" aria-label="Xóa khối" onClick={() => removeCell(cell.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </div>

            <div className="space-y-3 p-3 sm:p-4">
              {cell.type === 'text' && (
                <Textarea value={cell.content} onChange={(event) => updateCell(cell.id, { content: event.target.value })}
                  placeholder="Viết nội dung, dùng # cho tiêu đề hoặc **chữ đậm**..."
                  className="min-h-40 resize-y border-0 bg-transparent p-0 text-sm leading-7 shadow-none focus-visible:ring-0" />
              )}
              {cell.type === 'code' && (
                <>
                  <Input value={cell.language} onChange={(event) => updateCell(cell.id, { language: event.target.value.replace(/[^a-zA-Z0-9_+.-]/g, '').slice(0, 24) })}
                    placeholder="Ngôn ngữ: csharp, python, javascript..." aria-label="Ngôn ngữ mã nguồn"
                    className="h-8 max-w-xs border-border/70 bg-muted/40 font-mono text-xs" />
                  <Textarea value={cell.content} onChange={(event) => updateCell(cell.id, { content: event.target.value })}
                    placeholder="Dán hoặc viết mã nguồn ở đây..." spellCheck={false}
                    className="min-h-44 resize-y border-0 bg-slate-950 p-4 font-mono text-sm leading-6 text-slate-100 shadow-none focus-visible:ring-0" />
                  <p className="text-xs text-muted-foreground">Mã chỉ hiển thị để đọc, không chạy trên website.</p>
                </>
              )}
              {cell.type === 'image' && (
                <>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" disabled={uploadingId === cell.id}
                      onClick={() => { imageTargetRef.current = cell.id; imageInputRef.current?.click(); }}>
                      {uploadingId === cell.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                      Tải ảnh lên
                    </Button>
                    <Input value={cell.url} onChange={(event) => updateCell(cell.id, { url: event.target.value })}
                      placeholder="Hoặc dán URL ảnh" aria-label="URL ảnh" className="h-9 min-w-48 flex-1 text-xs" />
                  </div>
                  <Input value={cell.alt} onChange={(event) => updateCell(cell.id, { alt: event.target.value })}
                    placeholder="Mô tả ảnh (hỗ trợ tiếp cận)" aria-label="Mô tả ảnh" className="h-9 text-xs" />
                  {cell.url && <div className="overflow-hidden rounded-xl border border-border/70 bg-muted/20 p-3 text-center prose-img:mx-auto prose-img:max-h-72 prose-img:rounded-lg">
                    <ReactMarkdown components={{ img: MarkdownImage }} rehypePlugins={[rehypeSanitize]}>{serializeNotebook([cell])}</ReactMarkdown>
                  </div>}
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1 border-t border-border/70 px-3 py-2 sm:px-4">
              <Plus className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
              {cellOptions.map((option) => <Button key={option.type} type="button" variant="ghost" size="sm"
                className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-primary"
                onClick={() => insertCell(index, option.type)}><option.icon className="h-3.5 w-3.5" />{option.label}</Button>)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
