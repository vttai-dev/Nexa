'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, Loader2, SearchCheck } from 'lucide-react';
import { adminApi } from '@/lib/api/admin';
import type { ArticleReviewStatus } from '@/lib/types/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { PageLoader } from '@/components/ui/loading-spinner';
import { ErrorState } from '@/components/ui/states';
import { toast } from '@/hooks/use-toast';
import { ArticleMarkdown } from '@/app/articles/[slug]/ArticleMarkdown';

const reviewStates: { value: ArticleReviewStatus; label: string }[] = [
  { value: 'Pending', label: 'Chờ duyệt' },
  { value: 'Approved', label: 'Đã duyệt' },
  { value: 'Rejected', label: 'Từ chối' },
];

export default function AdminArticleReviewsPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<ArticleReviewStatus>('Pending');
  const [selected, setSelected] = useState<{ id: string; articleId: string } | null>(null);
  const [note, setNote] = useState('');
  const query = useQuery({ queryKey: ['article-reviews', status], queryFn: () => adminApi.listArticleReviews({ status, page: 1, pageSize: 50 }) });
  const articleQuery = useQuery({
    queryKey: ['admin-review-article', selected?.articleId],
    queryFn: () => adminApi.getArticle(selected!.articleId),
    enabled: !!selected,
  });
  const decision = useMutation({
    mutationFn: (result: 'Approved' | 'Rejected') => adminApi.decideArticleReview(selected!.id, result, note),
    onSuccess: (_, result) => {
      toast({ title: result === 'Approved' ? 'Đã duyệt và xuất bản bài viết' : 'Đã từ chối bài viết' });
      setSelected(null);
      setNote('');
      void queryClient.invalidateQueries({ queryKey: ['article-reviews'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (error: { title?: string }) => toast({ title: 'Không xử lý được yêu cầu', description: error.title ?? 'Vui lòng tải lại hàng chờ.', variant: 'destructive' }),
  });

  if (query.isLoading) return <PageLoader />;
  if (query.error || !query.data) return <ErrorState retry={() => void query.refetch()} />;

  return (
    <div className="space-y-6">
      <div><h2 className="text-xl font-semibold">Duyệt bài viết</h2><p className="text-sm text-muted-foreground">Đọc nội dung, sau đó duyệt để xuất bản hoặc từ chối kèm ghi chú.</p></div>
      <div className="flex flex-wrap gap-2">
        {reviewStates.map((item) => <Button key={item.value} variant={status === item.value ? 'default' : 'outline'} size="sm" onClick={() => setStatus(item.value)}>{item.label}</Button>)}
      </div>
      <div className="space-y-3">
        {query.data.items.length === 0 && <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Không có bài viết trong danh sách này.</CardContent></Card>}
        {query.data.items.map((review) => <Card key={review.id}>
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
            <div className="space-y-1"><CardTitle className="text-base">{review.title}</CardTitle><p className="text-sm text-muted-foreground">Tác giả: {review.authorName} (@{review.authorUserName}) · {new Date(review.submittedAtUtc).toLocaleString('vi-VN')}</p></div>
            <Badge variant={review.status === 'Pending' ? 'secondary' : review.status === 'Approved' ? 'default' : 'destructive'}>{reviewStates.find((item) => item.value === review.status)?.label ?? review.status}</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {review.submissionNote && <p className="rounded-lg bg-muted p-3 text-sm">Ghi chú tác giả: {review.submissionNote}</p>}
            <Button variant="outline" size="sm" onClick={() => { setSelected({ id: review.id, articleId: review.articleId }); setNote(''); }}><SearchCheck className="mr-2 h-4 w-4" />Đọc bài và xử lý</Button>
          </CardContent>
        </Card>)}
      </div>
      <Dialog open={!!selected} onOpenChange={(open) => { if (!open && !decision.isPending) setSelected(null); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader><DialogTitle>{articleQuery.data?.title ?? 'Nội dung bài viết'}</DialogTitle></DialogHeader>
          {articleQuery.isLoading ? <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div> : articleQuery.error ? <p className="text-sm text-destructive">Không tải được bài viết. Hãy đóng hộp thoại và thử lại.</p> : articleQuery.data && <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground"><span>Tác giả: {articleQuery.data.authorName}</span><a className="inline-flex items-center gap-1 text-primary hover:underline" href={`/articles/${articleQuery.data.slug}`} target="_blank" rel="noreferrer">Mở trang bài viết<ExternalLink className="h-3 w-3" /></a></div>
            <p className="font-medium">{articleQuery.data.summary}</p>
            <div className="max-h-[45vh] overflow-y-auto rounded-xl bg-muted/30 p-3">
              <ArticleMarkdown markdown={articleQuery.data.bodyMarkdown} />
            </div>
            {reviewStates[0].value === status && <div className="space-y-2"><label htmlFor="review-note" className="text-sm font-medium">Ghi chú quyết định (nếu từ chối, nên nêu lý do)</label><Textarea id="review-note" maxLength={2000} value={note} onChange={(event) => setNote(event.target.value)} /></div>}
          </div>}
          {status === 'Pending' && <DialogFooter>
            <Button variant="destructive" disabled={decision.isPending || !articleQuery.data} onClick={() => decision.mutate('Rejected')}>{decision.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Từ chối</Button>
            <Button disabled={decision.isPending || !articleQuery.data} onClick={() => decision.mutate('Approved')}>{decision.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Duyệt và xuất bản</Button>
          </DialogFooter>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
