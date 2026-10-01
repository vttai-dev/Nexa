'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';

import { authApi } from '@/lib/api/auth';
import { NexaApiError } from '@/lib/api/client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles, User, Mail, Lock, AtSign, ArrowRight, Phone, Eye, EyeOff } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { GuestOnlyRoute } from '@/components/auth/GuestOnlyRoute';

const registerSchema = z.object({
  userName: z
    .string()
    .min(3, 'Tối thiểu 3 ký tự')
    .max(30, 'Tối đa 30 ký tự')
    .regex(/^[a-zA-Z0-9_]+$/, 'Chỉ chứa chữ cái, số và dấu gạch dưới'),
  displayName: z
    .string()
    .min(1, 'Vui lòng nhập họ và tên hiển thị')
    .max(100, 'Tối đa 100 ký tự'),
  email: z.string().email('Email không đúng định dạng'),
  phoneNumber: z.string().max(32, 'Số điện thoại quá dài').refine(
    (value) => value.length === 0 || (value.length >= 8 && /^\+?[0-9\s().-]+$/.test(value)),
    'Số điện thoại chưa hợp lệ',
  ).optional(),
  password: z
    .string()
    .min(12, 'Mật khẩu phải có tối thiểu 12 ký tự để đảm bảo bảo mật')
    .max(128, 'Mật khẩu quá dài'),
  confirmPassword: z.string().min(1, 'Vui lòng nhập lại mật khẩu'),
}).superRefine(({ password, confirmPassword }, context) => {
  if (confirmPassword && password !== confirmPassword) {
    context.addIssue({ code: 'custom', path: ['confirmPassword'], message: 'Mật khẩu nhập lại không khớp' });
  }
});

type RegisterInputs = z.infer<typeof registerSchema>;
type AvailabilityStatus = 'idle' | 'checking' | 'available' | 'taken' | 'error';

function availabilityMessage(status: AvailabilityStatus, field: 'userName' | 'email') {
  const label = field === 'userName' ? 'Tên đăng nhập' : 'Email';
  if (status === 'checking') return `Đang kiểm tra ${field === 'userName' ? 'tên đăng nhập' : 'email'}...`;
  if (status === 'available') return `${label} có thể sử dụng`;
  if (status === 'taken') return `${label} đã được sử dụng`;
  if (status === 'error') return 'Chưa thể kiểm tra lúc này; hệ thống sẽ kiểm tra khi đăng ký';
  return '';
}

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [userNameCheck, setUserNameCheck] = useState<{ value: string; status: AvailabilityStatus }>({ value: '', status: 'idle' });
  const [emailCheck, setEmailCheck] = useState<{ value: string; status: AvailabilityStatus }>({ value: '', status: 'idle' });

  const { register, handleSubmit, setError, control, formState: { errors } } = useForm<RegisterInputs>({
    resolver: zodResolver(registerSchema),
    mode: 'onTouched',
  });
  const userNameValue = useWatch({ control, name: 'userName' }) ?? '';
  const emailValue = useWatch({ control, name: 'email' }) ?? '';
  const passwordValue = useWatch({ control, name: 'password' }) ?? '';
  const confirmPasswordValue = useWatch({ control, name: 'confirmPassword' }) ?? '';
  const passwordsMismatch = confirmPasswordValue.length > 0 && passwordValue !== confirmPasswordValue;

  useEffect(() => {
    const value = userNameValue.trim();
    if (value.length < 3 || value.length > 30 || !/^[a-zA-Z0-9_]+$/.test(value)) return;
    let active = true;
    const timeout = window.setTimeout(() => {
      setUserNameCheck({ value, status: 'checking' });
      void authApi.checkUserName(value)
        .then((result) => { if (active) setUserNameCheck({ value, status: result.available ? 'available' : 'taken' }); })
        .catch(() => { if (active) setUserNameCheck({ value, status: 'error' }); });
    }, 400);
    return () => { active = false; window.clearTimeout(timeout); };
  }, [userNameValue]);

  useEffect(() => {
    const value = emailValue.trim();
    if (!z.string().email().safeParse(value).success) return;
    let active = true;
    const timeout = window.setTimeout(() => {
      setEmailCheck({ value, status: 'checking' });
      void authApi.checkEmail(value)
        .then((result) => { if (active) setEmailCheck({ value, status: result.available ? 'available' : 'taken' }); })
        .catch(() => { if (active) setEmailCheck({ value, status: 'error' }); });
    }, 400);
    return () => { active = false; window.clearTimeout(timeout); };
  }, [emailValue]);

  const onSubmit = async (data: RegisterInputs) => {
    if (loading) return;
    setLoading(true);
    try {
      const [userNameResult, emailResult] = await Promise.all([
        authApi.checkUserName(data.userName.trim()),
        authApi.checkEmail(data.email.trim()),
      ]);
      setUserNameCheck({ value: userNameResult.value, status: userNameResult.available ? 'available' : 'taken' });
      setEmailCheck({ value: emailResult.value, status: emailResult.available ? 'available' : 'taken' });
      if (!userNameResult.available || !emailResult.available) {
        if (!userNameResult.available) setError('userName', { type: 'server', message: 'Tên đăng nhập đã được sử dụng' });
        if (!emailResult.available) setError('email', { type: 'server', message: 'Email đã được sử dụng' });
        toast({ title: 'Thông tin đã tồn tại', description: 'Vui lòng đổi tên đăng nhập hoặc email rồi thử lại.', variant: 'destructive' });
        return;
      }
      await authApi.register({
        userName: data.userName.trim(),
        email: data.email.trim(),
        password: data.password,
        displayName: data.displayName.trim(),
        phoneNumber: data.phoneNumber?.trim() || undefined,
      });
      toast({ 
        title: 'Tạo tài khoản thành công 🎉',
        description: 'Tài khoản mới có quyền người đọc. Bạn có thể đăng nhập và đăng ký làm tác giả riêng.'
      });
      router.push('/login');
    } catch (e) {
      if (e instanceof NexaApiError) {
        toast({ 
          title: 'Đăng ký thất bại', 
          description: e.status === 429
            ? 'Bạn thao tác quá nhanh. Vui lòng chờ khoảng một phút rồi thử lại.'
            : e.code === 'invalid_csrf' || e.code === 'csrf_unavailable'
              ? 'Không xác thực được yêu cầu. Hãy mở http://localhost:3000 trên máy chạy Nexa, tải lại trang rồi thử lại.'
            : e.status === 409 || e.code === 'account_unavailable'
              ? 'Tên đăng nhập hoặc email đã được sử dụng.'
              : e.title || 'Không thể tạo tài khoản. Vui lòng kiểm tra lại thông tin.',
          variant: 'destructive' 
        });
      } else {
        toast({ 
          title: 'Lỗi hệ thống', 
          description: 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau', 
          variant: 'destructive' 
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const currentUserNameStatus = userNameCheck.value === userNameValue.trim() ? userNameCheck.status : 'idle';
  const currentEmailStatus = emailCheck.value === emailValue.trim() ? emailCheck.status : 'idle';
  const availabilityClass = (status: AvailabilityStatus) => status === 'available'
    ? 'text-emerald-600 dark:text-emerald-400'
    : status === 'taken' ? 'text-destructive' : 'text-muted-foreground';

  return (
    <GuestOnlyRoute>
    <div className="relative min-h-[calc(100vh-12rem)] flex items-center justify-center px-4 py-12">
      {/* Background ambient glow */}
      <div className="absolute inset-0 -z-10 flex items-center justify-center">
        <div className="w-[36rem] h-[36rem] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      <Card className="w-full max-w-md rounded-3xl border border-border/80 bg-card/80 backdrop-blur-xl shadow-2xl p-2 sm:p-4">
        <CardHeader className="text-center space-y-2 pb-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25">
            <Sparkles className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-extrabold tracking-tight text-foreground">
            Tạo tài khoản Nexa
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Trở thành một phần của cộng đồng chia sẻ kiến thức kỹ thuật
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userName" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Tên đăng nhập (Username)
              </Label>
              <div className="relative">
                <AtSign className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="userName"
                  placeholder="nguyenvana"
                  className="pl-10 h-11 rounded-xl border-border/70 focus-visible:ring-primary text-sm font-mono"
                  {...register('userName')}
                />
              </div>
              {errors.userName && <p className="text-xs text-destructive font-medium">{errors.userName.message}</p>}
              {currentUserNameStatus !== 'idle' && <p role="status" className={`text-xs font-medium ${availabilityClass(currentUserNameStatus)}`}>{availabilityMessage(currentUserNameStatus, 'userName')}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Tên hiển thị
              </Label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="displayName"
                  placeholder="Nguyễn Văn A"
                  className="pl-10 h-11 rounded-xl border-border/70 focus-visible:ring-primary text-sm"
                  {...register('displayName')}
                />
              </div>
              {errors.displayName && <p className="text-xs text-destructive font-medium">{errors.displayName.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  className="pl-10 h-11 rounded-xl border-border/70 focus-visible:ring-primary text-sm"
                  {...register('email')}
                />
              </div>
              {errors.email && <p className="text-xs text-destructive font-medium">{errors.email.message}</p>}
              {currentEmailStatus !== 'idle' && <p role="status" className={`text-xs font-medium ${availabilityClass(currentEmailStatus)}`}>{availabilityMessage(currentEmailStatus, 'email')}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Số điện thoại (không bắt buộc)
              </Label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phoneNumber"
                  type="tel"
                  autoComplete="tel"
                  placeholder="Chưa cần nhập khi SMS chưa được bật"
                  className="pl-10 h-11 rounded-xl border-border/70 focus-visible:ring-primary text-sm"
                  {...register('phoneNumber')}
                />
              </div>
              {errors.phoneNumber && <p className="text-xs text-destructive font-medium">{errors.phoneNumber.message}</p>}
              <p className="text-xs text-muted-foreground">Nexa hiện chưa gửi SMS; có thể bổ sung số điện thoại sau.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Mật khẩu (tối thiểu 12 ký tự)
              </Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="••••••••••••"
                  className="pl-10 pr-11 h-11 rounded-xl border-border/70 focus-visible:ring-primary text-sm"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  aria-pressed={showPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive font-medium">{errors.password.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Nhập lại mật khẩu
              </Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Nhập lại mật khẩu"
                  className="pl-10 pr-11 h-11 rounded-xl border-border/70 focus-visible:ring-primary text-sm"
                  {...register('confirmPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((visible) => !visible)}
                  aria-label={showConfirmPassword ? 'Ẩn mật khẩu nhập lại' : 'Hiện mật khẩu nhập lại'}
                  aria-pressed={showConfirmPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-xs text-destructive font-medium">{errors.confirmPassword.message}</p>}
              {confirmPasswordValue && <p role="status" className={`text-xs font-medium ${passwordsMismatch ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {passwordsMismatch ? 'Mật khẩu nhập lại không khớp' : 'Mật khẩu khớp'}
              </p>}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 pt-2">
            <Button 
              type="submit" 
              className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md shadow-primary/20" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang khởi tạo tài khoản...
                </>
              ) : (
                <>
                  Hoàn tất đăng ký
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Đã có tài khoản?{' '}
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Đăng nhập ngay
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
    </GuestOnlyRoute>
  );
}
