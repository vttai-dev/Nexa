'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { taxonomyApi } from '@/lib/api/taxonomy';
import { toSlug } from '@/lib/utils/slug';
import type { TagDto } from '@/lib/types/api';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import { PageLoader } from '@/components/ui/loading-spinner';
import { ErrorState } from '@/components/ui/states';
import { Badge } from '@/components/ui/badge';

const tagSchema = z.object({
  name: z.string().min(1, 'Vui lòng nhập tên tag').max(50, 'Tối đa 50 ký tự'),
  slug: z.string().min(1, 'Slug không được trống').max(180, 'Slug quá dài').regex(/^[a-z0-9-]+$/, 'Slug chỉ gồm a-z, 0-9 và dấu trừ'),
});

type TagInputs = z.infer<typeof tagSchema>;

export default function AdminTagsPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-tags'],
    queryFn: () => taxonomyApi.listTags({ pageSize: 100 }),
  });

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<TagInputs>({
    resolver: zodResolver(tagSchema),
    defaultValues: { name: '', slug: '' },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: TagInputs) => {
      if (editingId) {
        await taxonomyApi.updateTag(editingId, values);
      } else {
        await taxonomyApi.createTag(values);
      }
    },
    onSuccess: () => {
      toast({ title: editingId ? 'Cập nhật thành công' : 'Thêm mới thành công' });
      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-tags'] });
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
    onError: (e: any) => toast({ title: 'Lỗi', description: e.title, variant: 'destructive' })
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => taxonomyApi.deleteTag(id),
    onSuccess: () => {
      toast({ title: 'Đã xóa tag' });
      setDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ['admin-tags'] });
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
    onError: (e: any) => {
      setDeleteId(null);
      toast({ 
        title: 'Không thể xóa', 
        description: e.status === 409 ? 'Tag đang được sử dụng bởi bài viết' : e.title, 
        variant: 'destructive' 
      });
    }
  });

  const openCreate = () => {
    setEditingId(null);
    reset({ name: '', slug: '' });
    setModalOpen(true);
  };

  const openEdit = (t: TagDto) => {
    setEditingId(t.id);
    reset({ name: t.name, slug: t.slug });
    setModalOpen(true);
  };

  const onSubmit = (values: TagInputs) => saveMutation.mutate(values);

  const generateSlug = () => {
    const name = watch('name');
    if (name) setValue('slug', toSlug(name), { shouldValidate: true });
  };

  if (isLoading) return <PageLoader />;
  if (error) return <ErrorState retry={() => refetch()} />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Quản lý Thẻ (Tags)</h2>
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 mr-2" /> Thêm thẻ mới
        </Button>
      </div>

      <div className="border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên Thẻ</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="w-[100px] text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.items.length === 0 ? (
              <TableRow><TableCell colSpan={3} className="text-center py-6 text-muted-foreground">Chưa có tag nào.</TableCell></TableRow>
            ) : (
              data?.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    <Badge variant="outline">#{item.name}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">{item.slug}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Edit2 className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(item.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Sửa thẻ' : 'Thêm thẻ mới'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Tên thẻ (Tag Name)</Label>
              <Input {...register('name')} placeholder="Ví dụ: C# 10" />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Đường dẫn (Slug)</Label>
                <Button type="button" variant="link" size="sm" onClick={generateSlug} className="h-auto p-0">Tạo tự động</Button>
              </div>
              <Input {...register('slug')} placeholder="csharp-10" />
              {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Hủy</Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Lưu
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Không thể xóa nếu thẻ đang được đính kèm vào bài viết.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <Button variant="destructive" onClick={() => deleteId && deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xóa
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
