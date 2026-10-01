'use client';

import { useState } from 'react';
import { Heart, Bookmark, Share2, Check, Flag, Loader2, Link2, Mail, MessageCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/stores/auth.store';
import { engagementApi } from '@/lib/api/engagement';
import { articlesApi } from '@/lib/api/articles';
import { reportsApi } from '@/lib/api/reports';
import { NexaApiError } from '@/lib/api/client';
import type { ArticleDto, ReportReason } from '@/lib/types/api';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface Props {
  article: ArticleDto;
}

export function ArticleActions({ article }: Props) {
  const { user } = useAuthStore();
  const router = useRouter();
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(article.likeCount);
  const [loading, setLoading] = useState<'like' | 'bookmark' | null>(null);
  const [copied, setCopied] = useState(false);
  const [shareCount, setShareCount] = useState(article.shareCount ?? 0);

  // Report state
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<ReportReason>('Spam');
  const [reportDetails, setReportDetails] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  const requireAuth = () => {
    toast({ title: 'Yêu cầu đăng nhập', description: 'Vui lòng đăng nhập để thực hiện thao tác này.' });
    router.push('/login');
  };

  const handleLike = async () => {
    if (!user) { requireAuth(); return; }
    setLoading('like');
    try {
      if (liked) {
        await engagementApi.unlike(article.id);
        setLiked(false);
        setLikeCount((c) => Math.max(0, c - 1));
      } else {
        await engagementApi.like(article.id);
        setLiked(true);
        setLikeCount((c) => c + 1);
        toast({ title: 'Đã thích bài viết' });
      }
    } catch (e) {
      if (e instanceof NexaApiError && e.status === 401) requireAuth();
    } finally {
      setLoading(null);
    }
  };

  const handleBookmark = async () => {
    if (!user) { requireAuth(); return; }
    setLoading('bookmark');
    try {
      if (bookmarked) {
        await engagementApi.unbookmark(article.id);
        setBookmarked(false);
        toast({ title: 'Đã bỏ lưu bài viết' });
      } else {
        await engagementApi.bookmark(article.id);
        setBookmarked(true);
        toast({ title: 'Đã lưu vào danh sách riêng' });
      }
    } catch (e) {
      if (e instanceof NexaApiError && e.status === 401) requireAuth();
    } finally {
      setLoading(null);
    }
  };

  const recordShare = async () => {
    try {
      await articlesApi.recordShare(article.slug);
      setShareCount((count) => count + 1);
    } catch {
      toast({ title: 'Chưa cập nhật được lượt chia sẻ', description: 'Liên kết vẫn có thể được chia sẻ.' });
    }
  };

  const handleCopyLink = async () => {
    const url = window.location.href;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const input = document.createElement('textarea');
        input.value = url;
        input.style.position = 'fixed';
        input.style.opacity = '0';
        document.body.append(input);
        input.select();
        const copied = document.execCommand('copy');
        input.remove();
        if (!copied) throw new Error('Clipboard unavailable');
      }
      setCopied(true);
      toast({ title: 'Đã sao chép liên kết bài viết' });
      window.setTimeout(() => setCopied(false), 2000);
      await recordShare();
    } catch {
      toast({ title: 'Không sao chép được liên kết', description: 'Hãy thử mở bài viết trong trình duyệt an toàn.' });
    }
  };

  const openShare = (platform: 'facebook' | 'x' | 'linkedin' | 'whatsapp' | 'telegram' | 'email') => {
    const url = window.location.href;
    const encodedUrl = encodeURIComponent(url);
    const title = encodeURIComponent(article.title);
    const targets = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      x: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${title}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      whatsapp: `https://wa.me/?text=${title}%20${encodedUrl}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${title}`,
      email: `mailto:?subject=${title}&body=${encodedUrl}`,
    };
    window.open(targets[platform], '_blank', 'noopener,noreferrer');
    void recordShare();
  };

  const handleNativeShare = async () => {
    if (!navigator.share) {
      await handleCopyLink();
      return;
    }
    try {
      await navigator.share({ title: article.title, url: window.location.href });
      await recordShare();
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      toast({ title: 'Không thể mở chức năng chia sẻ', description: 'Bạn có thể chọn một nền tảng khác.' });
    }
  };

  const handleOpenReport = () => {
    if (!user) { requireAuth(); return; }
    setReportReason('Spam');
    setReportDetails('');
    setReportOpen(true);
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingReport(true);
    try {
      await reportsApi.create({
        targetType: 'Article',
        targetId: article.id,
        reason: reportReason,
        details: reportDetails,
      });
      toast({ title: 'Đã gửi báo cáo vi phạm', description: 'Ban quản trị sẽ xem xét báo cáo của bạn.' });
      setReportOpen(false);
    } catch (error) {
      toast({ title: 'Lỗi', description: error instanceof NexaApiError ? error.title : 'Không thể gửi báo cáo', variant: 'destructive' });
    } finally {
      setSubmittingReport(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Like Button */}
        <Button
          variant={liked ? 'default' : 'outline'}
          size="sm"
          onClick={handleLike}
          disabled={loading === 'like'}
          className={`rounded-xl gap-2 font-medium transition-all ${
            liked 
              ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-600/30' 
              : 'border-border/80 hover:bg-rose-500/10 hover:text-rose-600 hover:border-rose-500/30'
          }`}
        >
          <Heart className={`h-4 w-4 transition-transform active:scale-125 ${liked ? 'fill-current text-white' : ''}`} />
          <span>{likeCount}</span>
        </Button>

        {/* Bookmark Button */}
        <Button
          variant={bookmarked ? 'default' : 'outline'}
          size="icon"
          onClick={handleBookmark}
          disabled={loading === 'bookmark'}
          className={`h-9 w-9 rounded-xl transition-all ${
            bookmarked 
              ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm shadow-amber-600/30' 
              : 'border-border/80 hover:bg-amber-500/10 hover:text-amber-600 hover:border-amber-500/30'
          }`}
          title={bookmarked ? "Bỏ lưu bài" : "Lưu bài viết"}
        >
          <Bookmark className={`h-4 w-4 ${bookmarked ? 'fill-current text-white' : ''}`} />
        </Button>

        {/* Share Button */}
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-border bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" title="Chia sẻ bài viết">
            {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Share2 className="h-4 w-4" />}
            <span>{shareCount.toLocaleString('vi-VN')}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onClick={() => void handleCopyLink()}><Link2 className="mr-2 h-4 w-4" />Sao chép liên kết</DropdownMenuItem>
            <DropdownMenuItem onClick={() => openShare('facebook')}><Share2 className="mr-2 h-4 w-4" />Facebook</DropdownMenuItem>
            <DropdownMenuItem onClick={() => openShare('x')}><Share2 className="mr-2 h-4 w-4" />X</DropdownMenuItem>
            <DropdownMenuItem onClick={() => openShare('linkedin')}><Share2 className="mr-2 h-4 w-4" />LinkedIn</DropdownMenuItem>
            <DropdownMenuItem onClick={() => openShare('whatsapp')}><MessageCircle className="mr-2 h-4 w-4" />WhatsApp</DropdownMenuItem>
            <DropdownMenuItem onClick={() => openShare('telegram')}><Send className="mr-2 h-4 w-4" />Telegram</DropdownMenuItem>
            <DropdownMenuItem onClick={() => openShare('email')}><Mail className="mr-2 h-4 w-4" />Email</DropdownMenuItem>
            <DropdownMenuItem onClick={() => void handleNativeShare()}><Share2 className="mr-2 h-4 w-4" />Ứng dụng trên thiết bị</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Report Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleOpenReport}
          className="h-9 w-9 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          title="Báo cáo vi phạm"
        >
          <Flag className="h-4 w-4" />
        </Button>
      </div>

      {/* Report Modal */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Báo cáo bài viết</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitReport} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Lý do báo cáo</Label>
              <Select value={reportReason} onValueChange={(val) => val && setReportReason(val as ReportReason)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Spam">Spam / Quảng cáo</SelectItem>
                  <SelectItem value="Inappropriate">Nội dung không phù hợp</SelectItem>
                  <SelectItem value="Plagiarism">Đạo văn / Vi phạm bản quyền</SelectItem>
                  <SelectItem value="PolicyViolation">Vi phạm quy định cộng đồng</SelectItem>
                  <SelectItem value="Other">Lý do khác</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Chi tiết (Tùy chọn)</Label>
              <Textarea
                placeholder="Mô tả cụ thể vi phạm..."
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                maxLength={2000}
                className="h-24 resize-none"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setReportOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" variant="destructive" disabled={submittingReport}>
                {submittingReport && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Gửi báo cáo
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
