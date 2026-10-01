'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Loader2, Mail, MessageSquareText, RefreshCw, Sparkles } from 'lucide-react';
import { authApi } from '@/lib/api/auth';
import { NexaApiError } from '@/lib/api/client';
import type { DevelopmentMessageDto } from '@/lib/types/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

function extractToken(body: string) {
  return body.split(/[:：]/).at(-1)?.trim().split(/\s+/)[0] ?? '';
}

function VerifyAccountForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [emailToken, setEmailToken] = useState('');
  const [phoneToken, setPhoneToken] = useState('');
  const [messages, setMessages] = useState<DevelopmentMessageDto[]>([]);
  const [loading, setLoading] = useState('');

  const run = async (action: string, request: () => Promise<unknown>, success: string) => {
    setLoading(action);
    try {
      await request();
      toast({ title: success });
    } catch (error) {
      toast({ title: 'Không thể thực hiện', description: error instanceof NexaApiError ? error.title : 'Không kết nối được máy chủ.', variant: 'destructive' });
    } finally {
      setLoading('');
    }
  };

  const loadLocalMessages = async () => {
    setLoading('outbox');
    try {
      const result = await authApi.getDevelopmentMessages(email);
      setMessages(result);
      const emailMessage = result.find((message) => message.channel === 'email' && message.subject.includes('Xác minh'));
      const phoneMessage = result.find((message) => message.channel === 'phone');
      if (emailMessage) setEmailToken(extractToken(emailMessage.body));
      if (phoneMessage) setPhoneToken(extractToken(phoneMessage.body));
      if (result.length === 0) toast({ title: 'Chưa có mã local', description: 'Hãy yêu cầu gửi mã xác minh trước.' });
    } catch (error) {
      toast({ title: 'Không đọc được mã local', description: error instanceof NexaApiError ? error.title : 'Chỉ khả dụng khi API chạy môi trường Development.', variant: 'destructive' });
    } finally {
      setLoading('');
    }
  };

  const confirmEmail = () => authApi.confirmEmail(email, emailToken);

  const confirmPhone = () => authApi.confirmPhone(email, phoneToken);

  return (
    <div className="relative flex min-h-[calc(100vh-12rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg rounded-3xl border border-border/80 bg-card/90 p-2 shadow-2xl sm:p-4">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-lg">
            <Sparkles className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-extrabold">Xác minh tài khoản</CardTitle>
          <CardDescription>Vui lòng xác minh cả email và số điện thoại trước khi đăng nhập.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="verify-email">Email tài khoản</Label>
            <Input id="verify-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>

          <section className="space-y-3 rounded-2xl border p-4">
            <div className="flex items-center gap-2 font-semibold"><Mail className="h-4 w-4" />Xác minh email</div>
            <Button variant="outline" className="w-full" disabled={!!loading || !email} onClick={() => run('email-send', () => authApi.requestEmailVerification(email), 'Đã yêu cầu gửi mã email')}>
              {loading === 'email-send' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Gửi lại mã email
            </Button>
            <div className="flex gap-2">
              <Input aria-label="Mã xác minh email" placeholder="Mã xác minh email" value={emailToken} onChange={(event) => setEmailToken(event.target.value)} />
              <Button disabled={!!loading || !email || !emailToken} onClick={() => run('email-confirm', confirmEmail, 'Email đã được xác minh')}>Xác minh</Button>
            </div>
          </section>

          <section className="space-y-3 rounded-2xl border p-4">
            <div className="flex items-center gap-2 font-semibold"><MessageSquareText className="h-4 w-4" />Xác minh số điện thoại</div>
            <Button variant="outline" className="w-full" disabled={!!loading || !email} onClick={() => run('phone-send', () => authApi.requestPhoneVerification(email), 'Đã yêu cầu gửi mã SMS')}>
              {loading === 'phone-send' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Gửi lại mã SMS
            </Button>
            <div className="flex gap-2">
              <Input aria-label="Mã xác minh số điện thoại" placeholder="Mã xác minh SMS" value={phoneToken} onChange={(event) => setPhoneToken(event.target.value)} />
              <Button disabled={!!loading || !email || !phoneToken} onClick={() => run('phone-confirm', confirmPhone, 'Số điện thoại đã được xác minh')}>Xác minh</Button>
            </div>
          </section>

          {process.env.NODE_ENV === 'development' && (
            <div className="space-y-2 rounded-xl bg-muted/50 p-3">
              <Button variant="ghost" className="w-full" disabled={!!loading || !email} onClick={loadLocalMessages}>
                {loading === 'outbox' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Lấy mã gửi local
              </Button>
              <p className="text-center text-xs text-muted-foreground">Chỉ hoạt động trên API Development, không hiển thị ở production.</p>
              {messages.length > 0 && <p className="text-center text-xs text-muted-foreground">Đã đọc {messages.length} tin nhắn local mới nhất.</p>}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex-col gap-3">
          <Button className="w-full" onClick={() => router.push('/login')}>
            Đi đến đăng nhập <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Link className="text-sm text-muted-foreground hover:text-primary" href="/register">Tạo tài khoản khác</Link>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function VerifyAccountPage() {
  if (process.env.NEXT_PUBLIC_ACCOUNT_VERIFICATION_ENABLED !== 'true') {
    return (
      <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center px-4 py-12">
        <Card className="w-full max-w-lg rounded-3xl border border-border/80 bg-card/90 p-2 shadow-2xl sm:p-4">
          <CardHeader className="space-y-3 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-lg"><Sparkles className="h-6 w-6" /></div>
            <CardTitle className="text-2xl font-extrabold">Xác minh chưa được bật</CardTitle>
            <CardDescription>Email/SMS ở đây chưa được gửi thật. Tài khoản Nexa hiện không yêu cầu xác minh để đăng nhập.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Gmail cá nhân không được dùng để gửi email tự động từ Nexa; cần cấu hình nhà cung cấp email doanh nghiệp.</p>
            <p>SMS cũng cần tích hợp nhà cung cấp và tài khoản gửi. Khi các dịch vụ này sẵn sàng, quản trị viên mới bật xác minh.</p>
          </CardContent>
          <CardFooter><Button asChild className="w-full"><Link href="/login">Đi đến đăng nhập <ArrowRight className="ml-2 h-4 w-4" /></Link></Button></CardFooter>
        </Card>
      </div>
    );
  }
  return <Suspense fallback={<div className="min-h-[calc(100vh-12rem)]" />}><VerifyAccountForm /></Suspense>;
}
