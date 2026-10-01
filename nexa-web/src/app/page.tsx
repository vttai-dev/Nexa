import Link from 'next/link';
import { articlesApi } from '@/lib/api/articles';
import { taxonomyApi } from '@/lib/api/taxonomy';
import { ArticleCard } from '@/components/articles/ArticleCard';
import { CommunityCtaActions } from '@/components/home/CommunityCtaActions';
import { Button } from '@/components/ui/button';
import { 
  ArrowRight, 
  BookOpen, 
  Layers, 
  Sparkles, 
  Terminal, 
  Cpu, 
  TrendingUp, 
  PenTool,
  Code2,
  Compass,
  Zap,
  Globe2
} from 'lucide-react';

export default async function HomePage() {
  const [articlesResult, categoriesResult, tagsResult] = await Promise.allSettled([
    articlesApi.list({ page: 1, pageSize: 6 }),
    taxonomyApi.listCategories({ pageSize: 12 }),
    taxonomyApi.listPopularTags({ pageSize: 10 }),
  ]);

  const articles = articlesResult.status === 'fulfilled' ? articlesResult.value.items : [];
  const totalCount = articlesResult.status === 'fulfilled' ? articlesResult.value.totalCount : 0;
  const categories = categoriesResult.status === 'fulfilled' ? categoriesResult.value.items : [];
  const popularTags = tagsResult.status === 'fulfilled' ? tagsResult.value.items : [];

  return (
    <div className="relative overflow-hidden pb-20">
      
      {/* 2. Hệ thống thiết kế: Hiệu ứng phát sáng Aurora Glow phía sau Hero */}
      


      <div className="container mx-auto max-w-6xl px-4 sm:px-6">
        
        {/* Khu vực Hero Section */}
        <section className="pt-20 pb-16 text-center max-w-4xl mx-auto relative">
          
          {/* Badge công nghệ AI style */}
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-muted px-4 py-1.5 text-xs font-semibold text-foreground mb-8 backdrop-blur-md">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-ping" />
            <span className="text-foreground">
              Nền tảng chia sẻ tri thức công nghệ thế hệ mới
            </span>
          </div>

          {/* Tiêu đề chính Hero Title: Gradient Tím sang Xanh Cyan */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.12]">
            <span className="text-foreground">Đọc sâu, hiểu thấu &</span> <br />
            <span className="text-foreground">
              chia sẻ tri thức kỹ thuật
            </span>
          </h1>

          {/* Sub-headline */}
          <p className="mt-6 text-xs text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Học tập và chia sẻ các bài viết thực chiến về <span className="text-foreground font-medium">Kiến trúc hệ thống</span>, <span className="text-foreground font-medium">.NET 10</span>, <span className="text-foreground font-medium">PostgreSQL</span>, Cloud Native & các giải pháp công nghệ AI hiện đại.
          </p>

          {/* Các nút hành động CTA Buttons */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            {/* Nút Khám phá bài viết: Xanh Neon phát sáng, chữ trắng */}
            <Button asChild size="lg" className="rounded-full px-8 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all duration-300 border-none">
              <Link href="/articles">
                <Compass className="mr-2 h-4.5 w-4.5 text-primary-foreground" />
                Khám phá bài viết
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>

            {/* Nút Bắt đầu viết bài: Viền mỏng trong suốt */}
            <Button asChild variant="outline" size="lg" className="rounded-full px-8 h-12 border-border/80 hover:border-purple-500/60 bg-card/30 hover:bg-card/60 backdrop-blur-md text-foreground font-medium transition-all duration-300 shadow-sm">
              <Link href="/editor/new">
                <PenTool className="mr-2 h-4 w-4 text-muted-foreground" />
                Bắt đầu viết bài
              </Link>
            </Button>
          </div>

          {/* Tags chủ đề nổi bật: JAVA, Python, C#, Docker... */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="font-semibold text-muted-foreground/90 flex items-center gap-1.5 mr-2">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              Chủ đề nổi bật:
            </span>
            {popularTags.length > 0 ? (
              popularTags.slice(0, 6).map((tag) => (
                <Link
                  key={tag.id}
                  href={`/articles?tagId=${tag.id}`}
                  className="rounded-full px-3.5 py-1 bg-card/60 hover:bg-cyan-500/10 text-muted-foreground hover:text-cyan-400 hover:border-cyan-500/40 transition-all border border-border/60 backdrop-blur-md font-mono text-[11px]"
                >
                  #{tag.name}
                </Link>
              ))
            ) : (
              ['.NET 10', 'PostgreSQL', 'JAVA', 'Python', 'Docker', 'AI System'].map((tagName) => (
                <Link
                  key={tagName}
                  href={`/search?q=${encodeURIComponent(tagName)}`}
                  className="rounded-full px-3.5 py-1 bg-card/60 hover:bg-cyan-500/10 text-muted-foreground hover:text-cyan-400 hover:border-cyan-500/40 transition-all border border-border/60 backdrop-blur-md font-mono text-[11px]"
                >
                  #{tagName}
                </Link>
              ))
            )}
          </div>
        </section>

        {/* Các thẻ thông tin Metrics Cards (Glassmorphism, 3 khối thẻ nằm ngang) */}
        <section className="mb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1: Bài viết kỹ thuật */}
            <div className="relative group rounded-3xl border border-border/60 bg-card/40 hover:bg-card/60 p-6 backdrop-blur-xl shadow-lg transition-all duration-300 hover:border-purple-500/40 hover:shadow-purple-500/10">
              <div className="flex items-center gap-4">
                <div className="w-13 h-13 rounded-2xl bg-muted border border-border text-purple-400 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                  <BookOpen className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <div className="text-3xl font-extrabold tracking-tight text-foreground font-mono">
                    {totalCount > 0 ? `${totalCount}+` : '100+'}
                  </div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">
                    Bài viết kỹ thuật đã đăng
                  </div>
                </div>
              </div>
              <p className="mt-4 text-xs text-muted-foreground/80 leading-relaxed">
                Nguồn tài liệu kiến trúc, database & thực hành backend/frontend được chia sẻ bởi cộng đồng kỹ sư.
              </p>
            </div>

            {/* Card 2: Danh mục & Chủ đề */}
            <div className="relative group rounded-3xl border border-border/60 bg-card/40 hover:bg-card/60 p-6 backdrop-blur-xl shadow-lg transition-all duration-300 hover:border-cyan-500/40 hover:shadow-cyan-500/10">
              <div className="flex items-center gap-4">
                <div className="w-13 h-13 rounded-2xl bg-muted border border-border text-cyan-400 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                  <Layers className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <div className="text-3xl font-extrabold tracking-tight text-foreground font-mono">
                    {categories.length > 0 ? categories.length : '12'}
                  </div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">
                    Chủ đề & Danh mục phân loại
                  </div>
                </div>
              </div>
              <p className="mt-4 text-xs text-muted-foreground/80 leading-relaxed">
                Phân loại theo chuẩn từng mảng chuyên sâu: Microservices, Cloud, Database, Frontend & DevOps.
              </p>
            </div>

            {/* Card 3: Giá trị cộng đồng */}
            <div className="relative group rounded-3xl border border-border/60 bg-card/40 hover:bg-card/60 p-6 backdrop-blur-xl shadow-lg transition-all duration-300 hover:border-emerald-500/40 hover:shadow-emerald-500/10">
              <div className="flex items-center gap-4">
                <div className="w-13 h-13 rounded-2xl bg-muted border border-border text-emerald-400 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                  <Code2 className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <div className="text-3xl font-extrabold tracking-tight text-foreground font-mono">
                    Cộng đồng tri thức
                  </div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">
                    Chia sẻ kiến thức kỹ thuật
                  </div>
                </div>
              </div>
              <p className="mt-4 text-xs text-muted-foreground/80 leading-relaxed">
                Khám phá kinh nghiệm thực chiến, hướng dẫn và giải pháp được cộng đồng Nexa chia sẻ.
              </p>
            </div>
          </div>
        </section>

        {/* Khu vực bài viết mới nhất (Latest Posts) */}
        <section className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/60 pb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wider text-cyan-400 uppercase mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                Cập nhật liên tục
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Bài viết mới nhất
              </h2>
            </div>
            <Button asChild variant="ghost" className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 p-0 h-auto sm:h-9 sm:px-3">
              <Link href="/articles" className="inline-flex items-center gap-1.5 group">
                Xem tất cả bài viết 
                <ArrowRight className="w-4 h-4 ml-0.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>

          {articles.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border/70 p-14 text-center bg-card/30 backdrop-blur-md">
              <Terminal className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
              <h3 className="text-xs font-semibold text-foreground">Chưa có bài viết xuất bản nào</h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                Hãy là lập trình viên đầu tiên chia sẻ kiến thức trên hệ sinh thái Nexa!
              </p>
              <Button asChild className="mt-6 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium" size="sm">
                <Link href="/editor/new">Tạo bài viết đầu tiên</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          )}
        </section>

        {/* Community Callout Banner phong cách AI Product */}
        <section className="mt-24 rounded-3xl border border-border bg-card/60 p-8 sm:p-14 relative overflow-hidden backdrop-blur-xl">
          <div className="max-w-2xl relative z-10">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 tracking-wider uppercase mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Cộng đồng Kỹ sư Nexa
            </span>
            <h3 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Bạn có bài học kỹ thuật muốn chia sẻ?
            </h3>
            <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
              Viết blog công nghệ giúp bạn củng cố kiến thức, xây dựng uy tín cá nhân và kết nối với hàng nghìn lập trình viên trong cộng đồng.
            </p>
            <div className="mt-6">
              <CommunityCtaActions />
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
