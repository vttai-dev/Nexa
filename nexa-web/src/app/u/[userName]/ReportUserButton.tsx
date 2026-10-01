'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/stores/auth.store';
import { reportsApi } from '@/lib/api/reports';
import { Button } from '@/components/ui/button';
import { Flag, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ReportReason } from '@/lib/types/api';

interface Props {
  userId: string;
  userName: string;
}

export function ReportUserButton({ userId, userName }: Props) {
  const { user } = useAuthStore();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>('Spam');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);

  // If viewing own profile, don't show report button
  if (user?.account.id === userId || user?.account.userName === userName) {
    return null;
  }

  const handleOpen = () => {
    if (!user) {
      toast({ title: 'Yêu cầu đăng nhập', description: 'Vui lòng đăng nhập để báo cáo người dùng.' });
      router.push('/login');
      return;
    }
    setReason('Spam');
    setDetails('');
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await reportsApi.create({
        targetType: 'User',
        targetId: userId,
        reason,
        details,
      });
      toast({ title: 'Đã gửi báo cáo người dùng', description: 'Ban quản trị sẽ xác minh tài khoản này.' });
      setOpen(false);
    } catch (e: any) {
      toast({ title: 'Lỗi', description: e.title || 'Không thể gửi báo cáo', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleOpen}
        className="rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        title={`Báo cáo @${userName}`}
      >
        <Flag className="w-4 h-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Báo cáo người dùng @{userName}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Lý do báo cáo</Label>
              <Select value={reason} onValueChange={(val) => val && setReason(val as ReportReason)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Spam">Tài khoản Spam / Lừa đảo</SelectItem>
                  <SelectItem value="Inappropriate">Mạo danh hoặc nội dung không phù hợp</SelectItem>
                  <SelectItem value="PolicyViolation">Vi phạm điều khoản sử dụng Nexa</SelectItem>
                  <SelectItem value="Other">Lý do khác</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Chi tiết</Label>
              <Textarea
                placeholder="Mô tả cụ thể hành vi vi phạm..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                maxLength={2000}
                className="h-24 resize-none"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" variant="destructive" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Gửi báo cáo
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
