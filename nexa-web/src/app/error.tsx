'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RotateCcw, ShieldCheck, Terminal } from 'lucide-react';

export default function GlobalSegmentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[AppRouter Error Boundary]:', error);
  }, [error]);

  return (
    <div className="container mx-auto max-w-2xl px-4 py-16">
      <div className="relative rounded-3xl border border-amber-500/30 bg-card/85 backdrop-blur-2xl p-8 sm:p-10 text-center space-y-6 overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-primary" />

        <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/25">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
          Self-Healing Regulation Protocol • Route Segment Recovery
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">
            Phân hệ gặp sự cố tạm thời
          </h2>
          <p className="text-xs text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Hệ thống đã tự động cô lập lỗi tại Main Viewport mà không làm gián đoạn ứng dụng. Nhấn nút bên dưới để khôi phục phân hệ.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-muted/40 p-4 text-left font-mono text-xs space-y-1">
          <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
            <Terminal className="w-3.5 h-3.5" />
            <span>Thông tin chẩn đoán:</span>
          </div>
          <p className="text-rose-300 break-words">{error.message || 'Unknown segment error'}</p>
        </div>

        <div className="pt-2 flex justify-center">
          <Button
            onClick={() => reset()}
            className="rounded-2xl px-6 h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Tải lại phân hệ
          </Button>
        </div>
      </div>
    </div>
  );
}
