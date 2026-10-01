'use client';

import Link from 'next/link';
import { useAuthStore } from '@/lib/stores/auth.store';
import { Button } from '@/components/ui/button';
import { ShieldAlert, Lock, ArrowLeft, Terminal } from 'lucide-react';

interface Props {
  requiredRole?: string;
  targetPath?: string;
}

export function Unauthorized403View({
  requiredRole = 'Admin',
  targetPath = '/admin',
}: Props) {
  const { user } = useAuthStore();

  return (
    <div className="relative min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12 overflow-hidden">
      <div className="relative w-full max-w-xl rounded-3xl border border-rose-500/30 bg-card/85 backdrop-blur-2xl p-8 sm:p-10 text-center space-y-6 overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-primary" />

        <div className="mx-auto w-20 h-20 rounded-3xl bg-muted border border-rose-500/40 flex items-center justify-center">
          <ShieldAlert className="w-10 h-10 text-rose-400" />
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-widest bg-rose-500/15 text-rose-400 border border-rose-500/30">
          <Lock className="w-3.5 h-3.5 text-rose-400" />
          HTTP 403 • UNAUTHORIZED ACCESS
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Truy Cập Bị Từ Chối
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-md mx-auto">
            Tài khoản hiện tại của bạn không có quyền <strong className="text-primary">{requiredRole}</strong> để truy cập vào đường dẫn <code className="text-foreground font-mono">{targetPath}</code>.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-muted/40 p-4 text-left font-mono text-xs space-y-1.5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="flex items-center gap-1.5 text-foreground">
              <Terminal className="w-3.5 h-3.5" />
              Thông tin phiên truy cập
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-400">403 FORBIDDEN</span>
          </div>
          <div className="pt-1 border-t border-border space-y-1 text-[11px]">
            <div>
              <span className="text-muted-foreground">Tài khoản hiện tại: </span>
              <span className="text-foreground font-semibold">
                {user ? `@${user.account.userName} (${user.profile.displayName})` : 'Khách (Guest)'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Quyền hiện có (Roles): </span>
              <span className="text-foreground">
                {user ? `[${user.account.roles.join(', ')}]` : '[Unauthenticated]'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Quyền yêu cầu tối thiểu: </span>
              <span className="text-foreground font-bold">[{requiredRole}]</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            asChild
            className="w-full sm:w-auto rounded-2xl px-5 h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs"
          >
            <Link href="/articles">
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Quay về trang bài viết
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

