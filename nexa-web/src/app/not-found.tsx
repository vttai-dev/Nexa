import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileQuestion, Home, LayoutDashboard, Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="container mx-auto max-w-xl px-4 py-24 text-center space-y-6">
      <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
        <FileQuestion className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          404 — Không tìm thấy nội dung
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
          Bài viết hoặc trang bạn tìm kiếm không tồn tại, có thể đang ở trạng thái <strong>Bản nháp</strong> chưa công khai, hoặc đường dẫn đã thay đổi.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/">
            <Home className="w-4 h-4 mr-2" />
            Trang chủ
          </Link>
        </Button>
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/dashboard">
            <LayoutDashboard className="w-4 h-4 mr-2 text-primary" />
            Bảng điều khiển
          </Link>
        </Button>
        <Button asChild className="rounded-xl bg-primary hover:bg-primary/90">
          <Link href="/articles">
            <Compass className="w-4 h-4 mr-2" />
            Khám phá bài viết
          </Link>
        </Button>
      </div>
    </div>
  );
}
