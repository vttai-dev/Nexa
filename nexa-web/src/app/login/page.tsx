'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';

import { authApi } from '@/lib/api/auth';
import { useAuthStore } from '@/lib/stores/auth.store';
import { useNotificationStore } from '@/lib/stores/notification.store';
import { useCsrfStore } from '@/lib/stores/csrf.store';
import { NexaApiError } from '@/lib/api/client';
import { authenticatedLandingPath } from '@/lib/utils/auth-navigation';
import { GuestOnlyRoute } from '@/components/auth/GuestOnlyRoute';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles, Lock, Mail, ArrowRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const loginSchema = z.object({
  email: z.string().email('Email không đúng định dạng'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

type LoginInputs = z.infer<typeof loginSchema>;

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect');
  const { initialize } = useAuthStore();
  const pushNotification = useNotificationStore((s) => s.pushNotification);
  const fetchCsrf = useCsrfStore((s) => s.fetch);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginInputs>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInputs) => {
    setLoading(true);
    try {
      await authApi.login(data);
      await fetchCsrf();
      const account = await initialize();
      if (!account) {
        toast({
          title: 'Chưa duy trì được phiên đăng nhập',
          description: 'Không thể xác nhận phiên đăng nhập. Vui lòng thử lại.',
          variant: 'destructive',
        });
        return;
      }
      pushNotification({
        title: 'Đăng nhập thành công',
        message: `Chào mừng ${account.profile.displayName} trở lại với Nexa!`,
        type: 'success',
      });
      router.replace(redirectPath || authenticatedLandingPath(account));
    } catch (e) {
      if (e instanceof NexaApiError) {
        if (e.code === 'verification_required') {
          if (process.env.NEXT_PUBLIC_ACCOUNT_VERIFICATION_ENABLED === 'true') {
            toast({ title: 'Cần xác minh tài khoản', description: 'Xác minh email và số điện thoại trước khi đăng nhập.' });
            router.push(`/verify-account?email=${encodeURIComponent(data.email)}`);
          } else {
            toast({ title: 'Xác minh chưa được bật', description: 'Quản trị viên cần cấu hình nhà cung cấp email và SMS trước khi yêu cầu xác minh.', variant: 'destructive' });
          }
          return;
        }
        toast({ title: 'Đăng nhập thất bại', description: e.title || 'Email hoặc mật khẩu không chính xác', variant: 'destructive' });
      } else {
        toast({ title: 'Lỗi hệ thống', description: 'Không thể kết nối đến máy chủ', variant: 'destructive' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <GuestOnlyRoute>
      <div className="relative min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md rounded-3xl border border-border bg-card/85 backdrop-blur-2xl p-2 sm:p-4">
          <CardHeader className="text-center space-y-2 pb-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Sparkles className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl font-extrabold tracking-tight text-foreground">
              Đăng Nhập
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              {redirectPath
                ? `Vui lòng đăng nhập để tiếp tục truy cập ${redirectPath}`
                : 'Đăng nhập vào tài khoản Nexa của bạn để tiếp tục'}
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="developer@example.com"
                    className="pl-10 h-11 rounded-xl border-border bg-card/60 focus-visible:ring-primary text-xs"
                    {...register('email')}
                  />
                </div>
                {errors.email && <p className="text-xs text-destructive font-medium">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Mật khẩu
                  </Label>
                  {process.env.NEXT_PUBLIC_ACCOUNT_VERIFICATION_ENABLED === 'true' && (
                    <Link href="/forgot-password" className="text-xs font-semibold text-primary hover:underline">
                      Quên mật khẩu?
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••••••"
                    className="pl-10 h-11 rounded-xl border-border bg-card/60 focus-visible:ring-primary text-xs"
                    {...register('password')}
                  />
                </div>
                {errors.password && <p className="text-xs text-destructive font-medium">{errors.password.message}</p>}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 pt-2">
              <Button
                type="submit"
                className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang xác thực...
                  </>
                ) : (
                  <>
                    Đăng nhập
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Chưa có tài khoản Nexa?{' '}
                <Link href="/register" className="font-semibold text-primary hover:underline">
                  Đăng ký ngay
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </GuestOnlyRoute>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center text-xs text-muted-foreground">Đang tải...</div>}>
      <LoginContent />
    </Suspense>
  );
}

