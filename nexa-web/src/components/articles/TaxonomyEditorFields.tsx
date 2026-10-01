'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Loader2, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { taxonomyApi } from '@/lib/api/taxonomy';
import { useAuthStore } from '@/lib/stores/auth.store';
import { canAuthor } from '@/lib/types/api';
import { toSlug } from '@/lib/utils/slug';
import { toast } from '@/hooks/use-toast';
import type { CategoryDto, TagDto } from '@/lib/types/api';

interface Props {
  categoryId?: string | null;
  tagIds: string[];
  onCategoryChange: (categoryId: string) => void;
  onTagIdsChange: (tagIds: string[]) => void;
}

function normalizeSearch(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().trim();
}

export function TaxonomyEditorFields({ categoryId, tagIds, onCategoryChange, onTagIdsChange }: Props) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const canCreate = canAuthor(user?.account.roles ?? []);
  const [categorySearch, setCategorySearch] = useState('');
  const [tagSearch, setTagSearch] = useState('');
  const [createdCategories, setCreatedCategories] = useState<CategoryDto[]>([]);
  const [createdTags, setCreatedTags] = useState<TagDto[]>([]);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => taxonomyApi.listCategories(),
  });
  const { data: tags } = useQuery({
    queryKey: ['tags'],
    queryFn: () => taxonomyApi.listTags(),
  });

  const categoryOptions = useMemo(() => mergeById(categories?.items ?? [], createdCategories), [categories?.items, createdCategories]);
  const tagOptions = useMemo(() => mergeById(tags?.items ?? [], createdTags), [tags?.items, createdTags]);
  const selectedCategory = categoryOptions.find((category) => category.id === categoryId);
  const selectedTags = tagIds.map((id) => tagOptions.find((tag) => tag.id === id) ?? { id, name: 'Thẻ đã chọn', slug: '' });
  const categoryQuery = normalizeSearch(categorySearch);
  const tagQuery = normalizeSearch(tagSearch);
  const filteredCategories = categoryOptions.filter((category) => normalizeSearch(category.name).includes(categoryQuery)).slice(0, 8);
  const filteredTags = tagOptions.filter((tag) => !tagIds.includes(tag.id) && normalizeSearch(tag.name).includes(tagQuery)).slice(0, 8);

  const createCategory = useMutation({
    mutationFn: (name: string) => taxonomyApi.createCategory({ name, slug: toSlug(name), description: '' }),
    onSuccess: (created, name) => {
      const category = { id: created.id, name, slug: toSlug(name), description: '' };
      setCreatedCategories((items) => [...items, category]);
      onCategoryChange(created.id);
      setCategorySearch('');
      void queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({ title: 'Đã tạo chủ đề mới' });
    },
    onError: () => toast({ title: 'Không tạo được chủ đề', description: 'Tên chủ đề có thể đã tồn tại hoặc bạn chưa có quyền tác giả.', variant: 'destructive' }),
  });

  const createTag = useMutation({
    mutationFn: (name: string) => taxonomyApi.createTag({ name, slug: toSlug(name) }),
    onSuccess: (created, name) => {
      const tag = { id: created.id, name, slug: toSlug(name) };
      setCreatedTags((items) => [...items, tag]);
      onTagIdsChange([...tagIds, created.id]);
      setTagSearch('');
      void queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast({ title: 'Đã tạo và gắn tag mới' });
    },
    onError: () => toast({ title: 'Không tạo được tag', description: 'Tên tag có thể đã tồn tại hoặc bạn chưa có quyền tác giả.', variant: 'destructive' }),
  });

  const createName = (value: string, limit: number) => {
    const name = value.trim();
    if (!name || name.length > limit || !toSlug(name)) return null;
    return name;
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label className="text-xs font-semibold text-foreground" htmlFor="article-category-search">Chủ đề / chuyên mục</label>
        <Input
          id="article-category-search"
          value={categorySearch}
          onChange={(event) => setCategorySearch(event.target.value)}
          placeholder={selectedCategory?.name ?? 'Tìm chủ đề hiện có...'}
          className="h-10 rounded-xl text-sm"
        />
        {categoryId && (
          <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs">
            <span className="font-medium text-foreground">{selectedCategory?.name ?? 'Chủ đề đã chọn'}</span>
            <button type="button" aria-label="Bỏ chọn chủ đề" onClick={() => onCategoryChange('')} className="text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" /></button>
          </div>
        )}
        <div className="max-h-36 space-y-1 overflow-y-auto">
          {filteredCategories.map((category) => (
            <button key={category.id} type="button" onClick={() => { onCategoryChange(category.id); setCategorySearch(''); }} className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs text-muted-foreground hover:bg-muted hover:text-foreground">
              {category.name}{category.id === categoryId && <Check className="h-3.5 w-3.5 text-primary" />}
            </button>
          ))}
          {!filteredCategories.length && !categoryOptions.length && <p className="px-3 py-2 text-xs text-muted-foreground">Chưa có chủ đề nào.</p>}
        </div>
        {canCreate && categorySearch.trim() && !categoryOptions.some((category) => normalizeSearch(category.name) === categoryQuery) && (
          <Button type="button" variant="outline" size="sm" className="w-full justify-start rounded-xl" disabled={createCategory.isPending || !createName(categorySearch, 100)} onClick={() => { const name = createName(categorySearch, 100); if (name) createCategory.mutate(name); }}>
            {createCategory.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Tạo chủ đề “{categorySearch.trim()}”
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-foreground" htmlFor="article-tag-search">Tags (tối đa 10)</label>
        <div className="flex flex-wrap gap-1.5">
          {selectedTags.map((tag) => (
            <span key={tag.id} className="inline-flex items-center gap-1 rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              #{tag.name}
              <button type="button" aria-label={`Bỏ tag ${tag.name}`} onClick={() => onTagIdsChange(tagIds.filter((id) => id !== tag.id))} className="hover:text-destructive"><X className="h-3 w-3" /></button>
            </span>
          ))}
        </div>
        <Input
          id="article-tag-search"
          value={tagSearch}
          onChange={(event) => setTagSearch(event.target.value)}
          placeholder="Tìm tag hoặc nhập tên mới..."
          className="h-10 rounded-xl text-sm"
          disabled={tagIds.length >= 10}
        />
        <div className="max-h-36 space-y-1 overflow-y-auto">
          {filteredTags.map((tag) => (
            <button key={tag.id} type="button" onClick={() => { if (tagIds.length < 10) onTagIdsChange([...tagIds, tag.id]); setTagSearch(''); }} className="flex w-full items-center rounded-lg px-3 py-2 text-left text-xs text-muted-foreground hover:bg-muted hover:text-foreground">#{tag.name}</button>
          ))}
          {tagQuery && !filteredTags.length && tagIds.length < 10 && <p className="px-3 py-2 text-xs text-muted-foreground">Chưa có tag khớp.</p>}
        </div>
        {canCreate && tagSearch.trim() && !tagOptions.some((tag) => normalizeSearch(tag.name) === tagQuery) && (
          <Button type="button" variant="outline" size="sm" className="w-full justify-start rounded-xl" disabled={createTag.isPending || tagIds.length >= 10 || !createName(tagSearch, 50)} onClick={() => { const name = createName(tagSearch, 50); if (name) createTag.mutate(name); }}>
            {createTag.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Tạo tag “{tagSearch.trim()}”
          </Button>
        )}
      </div>
    </div>
  );
}

function mergeById<T extends { id: string }>(items: T[], createdItems: T[]) {
  const byId = new Map(items.map((item) => [item.id, item]));
  for (const item of createdItems) byId.set(item.id, item);
  return [...byId.values()];
}
