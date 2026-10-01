'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Mail, RefreshCw, Sparkles } from 'lucide-react';
import { authApi } from '@/lib/api/auth';
import { NexaApiError } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const requestReset = async () => {
    setLoading(true);
    try {
      await authApi.requestPasswordReset(email);
      toast({ title: 'Đã tiếp nhận yêu cầu', description: 'Nếu email tồn tại, hướng dẫn đặt lại mật khẩu sẽ được gửi.' });
    } catch (error) {
      toast({ title: 'Không thể gửi yêu cầu', description: error instanceof NexaApiError ? error.title : 'Không kết nối được máy chủ.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const loadLocalToken = async () => {
    setLoading(true);
    try {
      const messages = await authApi.getDevelopmentMessages(email);
      const reset = messages.find((message) => message.subject.includes('Đặt lại mật khẩu'));
      const localToken = reset?.body.split(/[:：]/).at(-1)?.trim().split(/\s+/)[0];
      if (localToken) setToken(localToken);
      else toast({ title: 'Chưa tìm thấy mã', description: 'Hãy gửi yêu cầu đặt lại mật khẩu trước.' });
    } catch (error) {
      toast({ title: 'Không đọc được mã local', description: error instanceof NexaApiError ? error.title : 'Chỉ khả dụng khi API chạy môi trường Development.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (newPassword.length < 12) {
      toast({ title: 'Mật khẩu chưa đủ mạnh', description: 'Mật khẩu mới cần tối thiểu 12 ký tự.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword(email, token, newPassword);
      toast({ title: 'Đặt lại mật khẩu thành công', description: 'Bạn có thể đăng nhập bằng mật khẩu mới.' });
      router.push('/login');
    } catch (error) {
      toast({ title: 'Không thể đặt lại mật khẩu', description: error instanceof NexaApiError ? error.title : 'Kiểm tra mã đặt lại và thử lại.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md rounded-3xl border border-border/80 bg-card/90 p-2 shadow-2xl sm:p-4">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-lg"><Sparkles className="h-6 w-6" /></div>
          <CardTitle className="text-2xl font-extrabold">Đặt lại mật khẩu</CardTitle>
          <CardDescription>Nhận mã qua email, sau đó đặt mật khẩu mới có ít nhất 12 ký tự.</CardDescription>
        </CardHeader>
        <form onSubmit={resetPassword}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email tài khoản</Label>
              <div className="relative"><Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input id="reset-email" className="pl-10" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></div>
            </div>
            <Button type="button" variant="outline" className="w-full" disabled={loading || !email} onClick={requestReset}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}Gửi mã đặt lại
            </Button>
            {process.env.NODE_ENV === 'development' && <Button type="button" variant="ghost" className="w-full" disabled={loading || !email} onClick={loadLocalToken}><RefreshCw className="mr-2 h-4 w-4" />Lấy mã gửi local</Button>}
            <div className="space-y-2"><Label htmlFor="reset-token">Mã đặt lại</Label><Input id="reset-token" required value={token} onChange={(event) => setToken(event.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="new-password">Mật khẩu mới</Label><Input id="new-password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /></div>
          </CardContent>
          <CardFooter className="flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading || !email || !token || !newPassword}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Cập nhật mật khẩu</Button>
            <Link href="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4" />Quay lại đăng nhập</Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function ForgotPasswordPage() {
  if (process.env.NEXT_PUBLIC_ACCOUNT_VERIFICATION_ENABLED !== 'true') {
    return (
      <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md rounded-3xl border border-border/80 bg-card/90 p-2 shadow-2xl sm:p-4">
          <CardHeader className="text-center"><CardTitle>Khôi phục email chưa được bật</CardTitle><CardDescription>Nexa chưa cấu hình dịch vụ email gửi mã thật. Tính năng sẽ mở khi nhà cung cấp email được kết nối.</CardDescription></CardHeader>
          <CardFooter><Button asChild className="w-full"><Link href="/login">Quay lại đăng nhập</Link></Button></CardFooter>
        </Card>
      </div>
    );
  }
  return <ForgotPasswordForm />;
}
