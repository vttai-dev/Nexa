'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { taxonomyApi } from '@/lib/api/taxonomy';
import { toSlug } from '@/lib/utils/slug';
import type { CategoryDto } from '@/lib/types/api';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import { PageLoader } from '@/components/ui/loading-spinner';
import { ErrorState } from '@/components/ui/states';

const categorySchema = z.object({
  name: z.string().min(1, 'Vui lòng nhập tên').max(100, 'Tối đa 100 ký tự'),
  slug: z.string().min(1, 'Slug không được trống').max(180, 'Slug quá dài').regex(/^[a-z0-9-]+$/, 'Slug chỉ gồm a-z, 0-9 và dấu trừ'),
  description: z.string().max(1000, 'Tối đa 1000 ký tự'),
});

type CategoryInputs = z.infer<typeof categorySchema>;

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => taxonomyApi.listCategories({ pageSize: 100 }),
  });

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<CategoryInputs>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', slug: '', description: '' },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: CategoryInputs) => {
      if (editingId) {
        await taxonomyApi.updateCategory(editingId, values);
      } else {
        await taxonomyApi.createCategory(values);
      }
    },
    onSuccess: () => {
      toast({ title: editingId ? 'Cập nhật thành công' : 'Thêm mới thành công' });
      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (e: any) => toast({ title: 'Lỗi', description: e.title, variant: 'destructive' })
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => taxonomyApi.deleteCategory(id),
    onSuccess: () => {
      toast({ title: 'Đã xóa danh mục' });
      setDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (e: any) => {
      setDeleteId(null);
      toast({ 
        title: 'Không thể xóa', 
        description: e.status === 409 ? 'Danh mục đang được sử dụng bởi bài viết' : e.title, 
        variant: 'destructive' 
      });
    }
  });

  const openCreate = () => {
    setEditingId(null);
    reset({ name: '', slug: '', description: '' });
    setModalOpen(true);
  };

  const openEdit = (c: CategoryDto) => {
    setEditingId(c.id);
    reset({ name: c.name, slug: c.slug, description: c.description || '' });
    setModalOpen(true);
  };

  const onSubmit = (values: CategoryInputs) => saveMutation.mutate(values);

  const generateSlug = () => {
    const name = watch('name');
    if (name) setValue('slug', toSlug(name), { shouldValidate: true });
  };

  if (isLoading) return <PageLoader />;
  if (error) return <ErrorState retry={() => refetch()} />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Quản lý Danh mục</h2>
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 mr-2" /> Thêm danh mục
        </Button>
      </div>

      <div className="border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên danh mục</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Mô tả</TableHead>
              <TableHead className="w-[100px] text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.items.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">Chưa có danh mục nào.</TableCell></TableRow>
            ) : (
              data?.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">{item.slug}</TableCell>
                  <TableCell className="text-muted-foreground max-w-[200px] truncate">{item.description}</TableCell>
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
            <DialogTitle>{editingId ? 'Sửa danh mục' : 'Thêm danh mục mới'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Tên danh mục</Label>
              <Input {...register('name')} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Đường dẫn (Slug)</Label>
                <Button type="button" variant="link" size="sm" onClick={generateSlug} className="h-auto p-0">Tạo tự động</Button>
              </div>
              <Input {...register('slug')} />
              {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Textarea {...register('description')} />
              {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
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
              Hành động này không thể hoàn tác. Danh mục sẽ bị xóa vĩnh viễn. (Không thể xóa nếu đang có bài viết sử dụng).
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
