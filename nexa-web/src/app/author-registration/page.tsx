'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Loader2, PenTool, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { authApi } from '@/lib/api/auth';
import { NexaApiError } from '@/lib/api/client';
import { useAuthStore } from '@/lib/stores/auth.store';
import { canAuthor } from '@/lib/types/api';
import { toast } from '@/hooks/use-toast';

export default function AuthorRegistrationPage() {
  const router = useRouter();
  const { user, status, initialize } = useAuthStore();
  const [submitting, setSubmitting] = useState(false);
  const alreadyAuthor = user ? canAuthor(user.account.roles) : false;

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  const registerAsAuthor = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await authApi.enableAuthorRole();
      await initialize();
      toast({ title: 'Đã bật quyền tác giả', description: 'Bạn có thể bắt đầu tạo bài viết.' });
      router.push('/editor/new');
    } catch (error) {
      toast({
        title: 'Chưa thể đăng ký tác giả',
        description: error instanceof NexaApiError ? error.title : 'Không thể kết nối máy chủ. Vui lòng thử lại.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading' || !user) {
    return <div className="min-h-[60vh]" aria-busy="true" />;
  }

  return (
    <main className="container mx-auto flex min-h-[calc(100vh-12rem)] max-w-3xl items-center justify-center px-4 py-12">
      <Card className="w-full rounded-3xl border-border/80 bg-card/90 shadow-xl">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {alreadyAuthor ? <ShieldCheck className="h-7 w-7" /> : <PenTool className="h-7 w-7" />}
          </div>
          <CardTitle className="text-2xl">{alreadyAuthor ? 'Bạn đã là tác giả' : 'Đăng ký trở thành tác giả'}</CardTitle>
          <CardDescription className="max-w-xl text-sm leading-6">
            {alreadyAuthor
              ? 'Tài khoản của bạn đã có quyền tạo và quản lý bài viết.'
              : 'Tài khoản độc giả chỉ dùng để đọc và tham gia cộng đồng. Đăng ký tại đây để mở quyền soạn bài, lưu bản nháp và gửi bài viết.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          {!alreadyAuthor && (
            <div className="rounded-2xl bg-muted/50 p-4 leading-6">
              Quyền tác giả được bật ngay sau khi xác nhận. Việc đăng ký không thay đổi quyền quản trị hay kiểm duyệt của tài khoản.
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          {alreadyAuthor ? (
            <Button asChild className="w-full sm:w-auto">
              <Link href="/editor/new">Bắt đầu viết bài <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          ) : (
            <Button onClick={registerAsAuthor} disabled={submitting} className="w-full sm:w-auto">
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PenTool className="mr-2 h-4 w-4" />}
              Xác nhận đăng ký tác giả
            </Button>
          )}
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/">Quay lại đọc bài viết</Link>
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
