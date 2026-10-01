'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import type { UpdateRolesRequest, LockUserRequest } from '@/lib/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { PageLoader } from '@/components/ui/loading-spinner';
import { ErrorState } from '@/components/ui/states';
import { Badge } from '@/components/ui/badge';
import { Loader2, Lock, Unlock, ShieldAlert, ArrowLeft } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';

export default function AdminUserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  const queryClient = useQueryClient();

  // Modals state
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [lockModalOpen, setLockModalOpen] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [lockDays, setLockDays] = useState<number>(7);

  const { data: user, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-user', userId],
    queryFn: () => adminApi.getUser(userId),
  });

  const updateRolesMutation = useMutation({
    mutationFn: (req: UpdateRolesRequest) => adminApi.updateRoles(userId, req),
    onSuccess: () => {
      toast({ title: 'Cập nhật phân quyền thành công' });
      setRoleModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-user', userId] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (e: any) => toast({ title: 'Lỗi', description: e.title || 'Không thể cập nhật', variant: 'destructive' })
  });

  const lockMutation = useMutation({
    mutationFn: (req: LockUserRequest) => adminApi.lockUser(userId, req),
    onSuccess: () => {
      toast({ title: 'Khóa tài khoản thành công' });
      setLockModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-user', userId] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (e: any) => toast({ title: 'Lỗi', description: e.title || 'Không thể khóa', variant: 'destructive' })
  });

  const unlockMutation = useMutation({
    mutationFn: () => adminApi.unlockUser(userId),
    onSuccess: () => {
      toast({ title: 'Mở khóa tài khoản thành công' });
      queryClient.invalidateQueries({ queryKey: ['admin-user', userId] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (e: any) => toast({ title: 'Lỗi', description: e.title || 'Không thể mở khóa', variant: 'destructive' })
  });

  const openRoleModal = () => {
    if (user) {
      setSelectedRoles(user.roles);
      setRoleModalOpen(true);
    }
  };

  const openLockModal = () => {
    setLockDays(7);
    setLockModalOpen(true);
  };

  const toggleRole = (role: string) => {
    setSelectedRoles(prev => 
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  if (isLoading) return <PageLoader />;
  if (error || !user) return <ErrorState retry={() => refetch()} message="Không thể tải thông tin user." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-xl font-semibold">Chi tiết User: {user.userName}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-xl p-6 bg-card space-y-4">
          <h3 className="font-semibold text-lg border-b pb-2">Thông tin tài khoản</h3>
          
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="text-muted-foreground">ID:</div>
            <div className="col-span-2 font-mono">{user.id}</div>
            
            <div className="text-muted-foreground">UserName:</div>
            <div className="col-span-2 font-medium">{user.userName}</div>
            
            <div className="text-muted-foreground">Email:</div>
            <div className="col-span-2">{user.email}</div>
            
            <div className="text-muted-foreground">Ngày tạo:</div>
            <div className="col-span-2">{new Date(user.createdAtUtc).toLocaleString('vi-VN')}</div>
            
            <div className="text-muted-foreground">Xác thực Email:</div>
            <div className="col-span-2">
              {user.emailConfirmed ? <Badge variant="outline" className="text-green-500">Đã xác thực</Badge> : <Badge variant="secondary">Chưa xác thực</Badge>}
            </div>
            
            <div className="text-muted-foreground">Xác thực SĐT:</div>
            <div className="col-span-2">
              {user.phoneNumberConfirmed ? <Badge variant="outline" className="text-green-500">Đã xác thực</Badge> : <Badge variant="secondary">Chưa xác thực</Badge>}
            </div>
          </div>
        </div>

        <div className="border rounded-xl p-6 bg-card space-y-4">
          <h3 className="font-semibold text-lg border-b pb-2">Phân quyền & Trạng thái</h3>
          
          <div className="grid grid-cols-3 gap-2 text-sm items-center">
            <div className="text-muted-foreground">Roles:</div>
            <div className="col-span-2 flex gap-1 flex-wrap">
              {user.roles.map(r => (
                <Badge key={r} variant={r === 'Admin' ? 'destructive' : r === 'Moderator' ? 'default' : 'secondary'}>
                  {r}
                </Badge>
              ))}
            </div>

            <div className="text-muted-foreground">Trạng thái:</div>
            <div className="col-span-2">
              {user.isLocked ? (
                <Badge variant="destructive">Đã khóa</Badge>
              ) : (
                <Badge variant="outline" className="text-green-500 border-green-500">Hoạt động</Badge>
              )}
            </div>

            {user.isLocked && user.lockoutEndUtc && (
              <>
                <div className="text-muted-foreground">Mở khóa vào:</div>
                <div className="col-span-2 text-destructive">
                  {new Date(user.lockoutEndUtc).toLocaleString('vi-VN')}
                </div>
              </>
            )}
          </div>
          
          <div className="pt-4 flex gap-3 flex-wrap">
            <Button variant="outline" onClick={openRoleModal}>
              <ShieldAlert className="h-4 w-4 mr-2" /> Phân quyền
            </Button>
            {user.isLocked ? (
              <Button variant="outline" onClick={() => unlockMutation.mutate()} disabled={unlockMutation.isPending}>
                <Unlock className="h-4 w-4 mr-2" /> Mở khóa
              </Button>
            ) : (
              <Button variant="destructive" onClick={openLockModal}>
                <Lock className="h-4 w-4 mr-2" /> Khóa tài khoản
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Role Modal */}
      <Dialog open={roleModalOpen} onOpenChange={setRoleModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sửa Role cho {user?.userName}</DialogTitle>
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
            <DialogTitle>Khóa tài khoản {user?.userName}</DialogTitle>
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
