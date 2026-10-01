import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border/70 bg-card/60 backdrop-blur-md mt-24">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-sm shadow-indigo-500/25">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-foreground">
                Nexa Platform
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              Nền tảng chia sẻ và lưu trữ tri thức kỹ thuật chuyên sâu dành cho lập trình viên, kỹ sư hệ thống và kiến trúc sư phần mềm.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Khám phá
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/articles" className="hover:text-primary transition-colors">
                  Tất cả bài viết
                </Link>
              </li>
              <li>
                <Link href="/articles?categoryId=" className="hover:text-primary transition-colors">
                  Chuyên mục kỹ thuật
                </Link>
              </li>
              <li>
                <Link href="/editor/new" className="hover:text-primary transition-colors">
                  Viết bài chia sẻ
                </Link>
              </li>
            </ul>
          </div>

          {/* Account & Community */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Cộng đồng
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/login" className="hover:text-primary transition-colors">
                  Đăng nhập
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-primary transition-colors">
                  Đăng ký tài khoản
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-primary transition-colors">
                  Bảng điều khiển tác giả
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Nexa Platform. Bản quyền nội dung thuộc về các tác giả.</p>
          <p className="flex items-center gap-1">
            Xây dựng với tâm huyết dành cho cộng đồng kỹ thuật Việt Nam
          </p>
        </div>
      </div>
    </footer>
  );
}
