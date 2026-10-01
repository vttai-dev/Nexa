'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, KeyRound, Loader2, Save } from 'lucide-react';
import { accountApi } from '@/lib/api/account';
import { useAuthStore } from '@/lib/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageLoader } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/states';
import { toast } from '@/hooks/use-toast';

export default function SecuritySettingsPage() {
  const router = useRouter();
  const { status } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (status === 'loading') return <PageLoader />;
  if (status !== 'authenticated') return <EmptyState title="Yêu cầu đăng nhập" description="Đăng nhập để thay đổi mật khẩu." action={<Button asChild><Link href="/login">Đăng nhập</Link></Button>} />;

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (newPassword.length < 12 || newPassword.length > 128) {
      toast({ title: 'Mật khẩu không hợp lệ', description: 'Mật khẩu mới cần từ 12 đến 128 ký tự.', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Mật khẩu xác nhận không khớp', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await accountApi.changePassword({ currentPassword, newPassword });
      toast({ title: 'Đã đổi mật khẩu thành công' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      router.push('/dashboard');
    } catch (error) {
      toast({ title: 'Không thể đổi mật khẩu', description: (error as { title?: string }).title ?? 'Kiểm tra mật khẩu hiện tại và thử lại.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl space-y-6 px-4 py-10">
      <div className="flex items-center gap-3"><Button asChild variant="ghost" size="icon"><Link href="/dashboard"><ArrowLeft className="h-4 w-4" /></Link></Button><div><h1 className="text-2xl font-bold">Bảo mật tài khoản</h1><p className="text-sm text-muted-foreground">Đổi mật khẩu đăng nhập Nexa.</p></div></div>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5" />Đổi mật khẩu</CardTitle><CardDescription>Mật khẩu mới cần có ít nhất 12 ký tự.</CardDescription></CardHeader>
        <form onSubmit={submit}><CardContent className="space-y-4">
          <div className="space-y-2"><Label htmlFor="current-password">Mật khẩu hiện tại</Label><Input id="current-password" type="password" autoComplete="current-password" required maxLength={128} value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor="new-password">Mật khẩu mới</Label><Input id="new-password" type="password" autoComplete="new-password" required minLength={12} maxLength={128} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor="confirm-password">Nhập lại mật khẩu mới</Label><Input id="confirm-password" type="password" autoComplete="new-password" required minLength={12} maxLength={128} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></div>
          <Button type="submit" className="w-full" disabled={loading || !currentPassword || !newPassword || !confirmPassword}>{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Cập nhật mật khẩu</Button>
        </CardContent></form>
      </Card>
    </div>
  );
}
