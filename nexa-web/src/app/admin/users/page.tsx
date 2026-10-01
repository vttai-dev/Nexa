'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import type { AdminUserDto, AdminUserFilter, UpdateRolesRequest, LockUserRequest } from '@/lib/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { PageLoader } from '@/components/ui/loading-spinner';
import { ErrorState } from '@/components/ui/states';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import { Search, Loader2, Lock, Unlock, ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminUsersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<AdminUserFilter>({ page: 1, pageSize: 10, search: '' });
  const [searchInput, setSearchInput] = useState('');
  
  // Modals state
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [lockModalOpen, setLockModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUserDto | null>(null);
  
  // Forms state
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [lockDays, setLockDays] = useState<number>(7);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-users', filter],
    queryFn: () => adminApi.listUsers(filter),
  });

  const updateRolesMutation = useMutation({
    mutationFn: (req: UpdateRolesRequest) => adminApi.updateRoles(selectedUser!.id, req),
    onSuccess: () => {
      toast({ title: 'Cập nhật phân quyền thành công' });
      setRoleModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (e: any) => toast({ title: 'Lỗi', description: e.title || 'Không thể cập nhật', variant: 'destructive' })
  });

  const lockMutation = useMutation({
    mutationFn: (req: LockUserRequest) => adminApi.lockUser(selectedUser!.id, req),
    onSuccess: () => {
      toast({ title: 'Khóa tài khoản thành công' });
      setLockModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (e: any) => toast({ title: 'Lỗi', description: e.title || 'Không thể khóa', variant: 'destructive' })
  });

  const unlockMutation = useMutation({
    mutationFn: (id: string) => adminApi.unlockUser(id),
    onSuccess: () => {
      toast({ title: 'Mở khóa tài khoản thành công' });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (e: any) => toast({ title: 'Lỗi', description: e.title || 'Không thể mở khóa', variant: 'destructive' })
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilter({ ...filter, search: searchInput, page: 1 });
  };

  const openRoleModal = (user: AdminUserDto) => {
    setSelectedUser(user);
    setSelectedRoles(user.roles);
    setRoleModalOpen(true);
  };

  const openLockModal = (user: AdminUserDto) => {
    setSelectedUser(user);
    setLockDays(7);
    setLockModalOpen(true);
  };

  const toggleRole = (role: string) => {
    setSelectedRoles(prev => 
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  if (isLoading) return <PageLoader />;
  if (error) return <ErrorState retry={() => refetch()} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-semibold">Quản lý Users</h2>
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input 
            placeholder="Tìm theo tên/email..." 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-[250px]"
          />
          <Button type="submit" variant="secondary">
            <Search className="h-4 w-4 mr-2" />
            Tìm
          </Button>
        </form>
      </div>

      <div className="border rounded-xl overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.items.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">Không tìm thấy user nào.</TableCell></TableRow>
            ) : (
              data?.items.map((user) => (
                <TableRow key={user.id} className="cursor-pointer" onClick={() => router.push(`/admin/users/${user.id}`)}>
                  <TableCell className="font-medium">{user.userName}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {user.roles.map(r => (
                        <Badge key={r} variant={r === 'Admin' ? 'destructive' : r === 'Moderator' ? 'default' : 'secondary'}>
                          {r}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.isLocked ? (
                      <Badge variant="destructive">Đã khóa</Badge>
                    ) : (
                      <Badge variant="outline" className="text-green-500 border-green-500">Hoạt động</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(user.createdAtUtc).toLocaleDateString('vi-VN')}
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => openRoleModal(user)}>
                        <ShieldAlert className="h-4 w-4 mr-1" /> Phân quyền
                      </Button>
                      {user.isLocked ? (
                        <Button variant="outline" size="sm" onClick={() => unlockMutation.mutate(user.id)} disabled={unlockMutation.isPending}>
                          <Unlock className="h-4 w-4 mr-1" /> Mở khóa
                        </Button>
                      ) : (
                        <Button variant="destructive" size="sm" onClick={() => openLockModal(user)}>
                          <Lock className="h-4 w-4 mr-1" /> Khóa
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {data && data.totalCount > 0 && (
        <Pagination
          page={data.page}
          pageSize={data.pageSize}
          totalCount={data.totalCount}
          onPageChange={(p) => setFilter(prev => ({ ...prev, page: p }))}
        />
      )}

      {/* Role Modal */}
      <Dialog open={roleModalOpen} onOpenChange={setRoleModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sửa Role cho {selectedUser?.userName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {['Member', 'Author', 'Moderator', 'Admin'].map(role => (
              <div key={role} className="flex items-center space-x-2">
                <Checkbox 
                  id={`role-${role}`} 
                  checked={selectedRoles.includes(role)}
                  onCheckedChange={() => toggleRole(role)}
                />
                <Label htmlFor={`role-${role}`}>{role}</Label>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleModalOpen(false)}>Hủy</Button>
            <Button 
              onClick={() => updateRolesMutation.mutate({ roles: selectedRoles })}
              disabled={updateRolesMutation.isPending}
            >
              {updateRolesMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lock Modal */}
      <Dialog open={lockModalOpen} onOpenChange={setLockModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Khóa tài khoản {selectedUser?.userName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Số ngày khóa</Label>
              <Input 
                type="number" 
                min={1} 
                value={lockDays} 
                onChange={(e) => setLockDays(parseInt(e.target.value) || 1)} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLockModalOpen(false)}>Hủy</Button>
            <Button 
              variant="destructive"
              onClick={() => lockMutation.mutate({ days: lockDays })}
              disabled={lockMutation.isPending}
            >
              {lockMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Khóa tài khoản
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
