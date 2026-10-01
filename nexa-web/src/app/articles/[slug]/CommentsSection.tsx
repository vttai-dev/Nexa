'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { commentsApi } from '@/lib/api/comments';
import { reportsApi } from '@/lib/api/reports';
import { NexaApiError } from '@/lib/api/client';
import { useAuthStore } from '@/lib/stores/auth.store';
import { canModerate, type CommentDto, type ReportReason } from '@/lib/types/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { timeAgo } from '@/lib/utils/date';
import { 
  Loader2, MessageSquare, Send, Edit2, Trash2, Flag,
  MoreVertical, X, Reply, CornerDownRight
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { resolveArticleImageUrl } from '@/lib/media-url';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function CommentsSection({ articleId }: { articleId: string }) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [body, setBody] = useState('');
  const [replyingTo, setReplyingTo] = useState<CommentDto | null>(null);

  // Edit comment state
  const [editingComment, setEditingComment] = useState<CommentDto | null>(null);
  const [editBody, setEditBody] = useState('');

  // Delete comment state
  const [deletingComment, setDeletingComment] = useState<CommentDto | null>(null);

  // Report comment state
  const [reportingComment, setReportingComment] = useState<CommentDto | null>(null);
  const [reportReason, setReportReason] = useState<ReportReason>('Spam');
  const [reportDetails, setReportDetails] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['comments', articleId],
    queryFn: () => commentsApi.list(articleId, { page: 1, pageSize: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: ({ text, parentId }: { text: string; parentId?: string | null }) => 
      commentsApi.create(articleId, { body: text, parentCommentId: parentId }),
    onSuccess: () => {
      setBody('');
      setReplyingTo(null);
      queryClient.invalidateQueries({ queryKey: ['comments', articleId] });
      toast({ title: 'Đã gửi bình luận thành công' });
    },
    onError: () => toast({ title: 'Lỗi khi gửi bình luận', description: 'Vui lòng thử lại sau', variant: 'destructive' })
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, version, text }: { id: string; version: string; text: string }) =>
      commentsApi.update(id, { version, body: text }),
    onSuccess: () => {
      setEditingComment(null);
      setEditBody('');
      queryClient.invalidateQueries({ queryKey: ['comments', articleId] });
      toast({ title: 'Cập nhật bình luận thành công' });
    },
    onError: (error) =>
      toast({ 
        title: 'Lỗi cập nhật', 
        description: error instanceof NexaApiError && error.status === 409
          ? 'Bình luận đã bị thay đổi bởi phiên khác'
          : error instanceof NexaApiError ? error.title : 'Vui lòng thử lại',
        variant: 'destructive' 
      })
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id, version }: { id: string; version: string }) =>
      commentsApi.delete(id, version),
    onSuccess: () => {
      setDeletingComment(null);
      queryClient.invalidateQueries({ queryKey: ['comments', articleId] });
      toast({ title: 'Đã xóa bình luận' });
    },
    onError: (error) => {
      setDeletingComment(null);
      toast({ title: 'Lỗi xóa bình luận', description: error instanceof NexaApiError ? error.title : 'Vui lòng thử lại', variant: 'destructive' });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    createMutation.mutate({ text: body, parentId: replyingTo?.id });
  };

  const handleStartEdit = (c: CommentDto) => {
    setEditingComment(c);
    setEditBody(c.body);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingComment || !editBody.trim()) return;
    updateMutation.mutate({
      id: editingComment.id,
      version: editingComment.version,
      text: editBody,
    });
  };

  const handleReportComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingComment) return;
    setSubmittingReport(true);
    try {
      await reportsApi.create({
        targetType: 'Comment',
        targetId: reportingComment.id,
        reason: reportReason,
        details: reportDetails,
      });
      toast({ title: 'Đã gửi báo cáo bình luận' });
      setReportingComment(null);
    } catch (error) {
      toast({ title: 'Lỗi', description: error instanceof NexaApiError ? error.title : 'Không thể gửi báo cáo', variant: 'destructive' });
    } finally {
      setSubmittingReport(false);
    }
  };

  const userInitials = user?.profile.displayName?.[0]?.toUpperCase() ?? '?';
  const isModeratorOrAdmin = user ? canModerate(user.account.roles) : false;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <MessageSquare className="w-4 h-4" />
          </div>
          <h3 className="text-xl font-bold tracking-tight text-foreground">
            Bình luận & Thảo luận
          </h3>
        </div>
        {data && (
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground font-mono">
            {data.totalCount} thảo luận
          </span>
        )}
      </div>
      
      {/* Create Comment Form */}
      {user ? (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-3">
          {replyingTo && (
            <div className="flex items-center justify-between text-xs bg-primary/10 text-primary px-3 py-2 rounded-xl">
              <div className="flex items-center gap-1.5 font-medium truncate">
                <CornerDownRight className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">
                  Đang trả lời <strong className="font-semibold">@{replyingTo.authorName}</strong>: &ldquo;{replyingTo.body.slice(0, 45)}...&rdquo;
                </span>
              </div>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="text-primary hover:text-primary/70 p-1 rounded transition-colors shrink-0 ml-2"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <div className="flex items-start gap-3">
            <Avatar className="h-9 w-9 shrink-0 ring-1 ring-border/80">
              <AvatarImage src={resolveArticleImageUrl(user.profile.avatarUrl ?? undefined)} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div className="text-xs font-semibold text-foreground">
                {user.profile.displayName} <span className="text-muted-foreground font-mono">(@{user.account.userName})</span>
              </div>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={replyingTo ? `Viết phản hồi cho @${replyingTo.authorName}...` : "Chia sẻ góc nhìn hoặc câu hỏi của bạn về chủ đề này..."}
                className="min-h-[90px] rounded-xl resize-none border-border/70 focus-visible:ring-primary text-sm"
                disabled={createMutation.isPending}
              />
            </div>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-muted-foreground">Tôn trọng & văn minh trong thảo luận</span>
            <div className="flex items-center gap-2">
              {replyingTo && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyingTo(null)}
                  className="rounded-xl text-xs"
                >
                  Hủy phản hồi
                </Button>
              )}
              <Button 
                type="submit" 
                size="sm" 
                disabled={!body.trim() || createMutation.isPending}
                className="rounded-xl px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
              >
                {createMutation.isPending ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="mr-1.5 h-3.5 w-3.5" />
                )}
                {replyingTo ? 'Gửi phản hồi' : 'Gửi bình luận'}
              </Button>
            </div>
          </div>
        </form>
      ) : (
        <div className="rounded-2xl border border-dashed border-border/80 p-6 text-center bg-card/40 space-y-2">
          <p className="text-sm text-muted-foreground">
            Tham gia thảo luận cùng các kỹ sư công nghệ khác trên Nexa.
          </p>
          <Button asChild size="sm" variant="outline" className="rounded-xl">
            <Link href="/login">Đăng nhập để bình luận</Link>
          </Button>
        </div>
      )}

      {/* Comment List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-2xl border border-border/50 p-4 space-y-2 bg-card/30 animate-pulse">
              <div className="h-4 w-32 bg-muted rounded" />
              <div className="h-3 w-3/4 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {(() => {
            const allItems = data?.items ?? [];
            // Map top-level and their nested replies
            const topLevel = allItems.filter(c => !c.parentCommentId);
            const repliesMap = new Map<string, CommentDto[]>();
            allItems.forEach(c => {
              if (c.parentCommentId) {
                const list = repliesMap.get(c.parentCommentId) || [];
                list.push(c);
                repliesMap.set(c.parentCommentId, list);
              }
            });
            // Also collect orphan replies whose parent is not in topLevel
            const topLevelIds = new Set(topLevel.map(t => t.id));
            const orphanReplies = allItems.filter(c => c.parentCommentId && !topLevelIds.has(c.parentCommentId));
            const displayRoots = [...topLevel, ...orphanReplies];

            const renderSingleComment = (comment: CommentDto, isNested = false) => {
              const authorInitial = comment.authorName?.[0]?.toUpperCase() ?? '?';
              const isOwner = user?.account.id === comment.authorId;
              const canDeleteThis = isOwner || isModeratorOrAdmin;
              const parentComment = comment.parentCommentId ? allItems.find(c => c.id === comment.parentCommentId) : null;

              return (
                <div 
                  key={comment.id} 
                  className={`rounded-2xl border border-border/70 ${isNested ? 'bg-muted/20 border-border/50' : 'bg-card/60'} p-4 sm:p-5 space-y-2.5 shadow-xs transition-colors hover:border-border`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-8 w-8 ring-1 ring-border/60">
                        <AvatarFallback className="bg-secondary text-secondary-foreground font-semibold text-xs">
                          {authorInitial}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-foreground">{comment.authorName}</span>
                          {parentComment && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                              <CornerDownRight className="w-3 h-3 text-muted-foreground/70" />
                              @{parentComment.authorName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-mono">
                        {timeAgo(comment.createdAtUtc)}
                      </span>

                      {/* Actions Menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          {isOwner && (
                            <DropdownMenuItem onClick={() => handleStartEdit(comment)} className="cursor-pointer gap-2">
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Chỉnh sửa</span>
                            </DropdownMenuItem>
                          )}
                          {canDeleteThis && (
                            <DropdownMenuItem onClick={() => setDeletingComment(comment)} className="cursor-pointer gap-2 text-destructive focus:text-destructive">
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Xóa bình luận</span>
                            </DropdownMenuItem>
                          )}
                          {!isOwner && user && (
                            <DropdownMenuItem 
                              onClick={() => {
                                setReportingComment(comment);
                                setReportReason('Spam');
                                setReportDetails('');
                              }} 
                              className="cursor-pointer gap-2 text-muted-foreground hover:text-destructive"
                            >
                              <Flag className="w-3.5 h-3.5" />
                              <span>Báo cáo</span>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Comment Body or Inline Editor */}
                  {editingComment?.id === comment.id ? (
                    <form onSubmit={handleSaveEdit} className="space-y-3 pt-2">
                      <Textarea
                        value={editBody}
                        onChange={(e) => setEditBody(e.target.value)}
                        className="min-h-[80px] rounded-xl text-sm"
                        disabled={updateMutation.isPending}
                      />
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setEditingComment(null)}
                        >
                          Hủy
                        </Button>
                        <Button 
                          type="submit" 
                          size="sm" 
                          disabled={!editBody.trim() || updateMutation.isPending}
                        >
                          {updateMutation.isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                          Lưu thay đổi
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="pl-10 text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                      {comment.body}
                    </div>
                  )}

                  {/* Action Bar */}
                  {user && editingComment?.id !== comment.id && (
                    <div className="pl-10 pt-1 flex items-center gap-3">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setReplyingTo(comment);
                          window.scrollTo({ top: 300, behavior: 'smooth' });
                        }}
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-primary rounded-lg gap-1.5"
                      >
                        <Reply className="w-3 h-3" />
                        Trả lời
                      </Button>
                    </div>
                  )}
                </div>
              );
            };

            return (
              <div className="space-y-5">
                {displayRoots.map((comment) => {
                  const replies = repliesMap.get(comment.id) || [];
                  return (
                    <div key={comment.id} className="space-y-3">
                      {renderSingleComment(comment, false)}
                      {replies.length > 0 && (
                        <div className="ml-5 sm:ml-8 pl-4 border-l-2 border-primary/20 space-y-3">
                          {replies.map((reply) => renderSingleComment(reply, true))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {data?.items.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Chưa có bình luận nào. Hãy là người đầu tiên để lại ý kiến!
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Alert */}
      <AlertDialog open={!!deletingComment} onOpenChange={(open) => !open && setDeletingComment(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa bình luận này?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Bình luận sẽ bị gỡ bỏ vĩnh viễn khỏi bài viết.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deletingComment && deleteMutation.mutate({ id: deletingComment.id, version: deletingComment.version })}
            >
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Xác nhận xóa
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Report Comment Modal */}
      <Dialog open={!!reportingComment} onOpenChange={(open) => !open && setReportingComment(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Báo cáo bình luận vi phạm</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleReportComment} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Lý do báo cáo</Label>
              <Select value={reportReason} onValueChange={(val) => val && setReportReason(val as ReportReason)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Spam">Spam / Quảng cáo</SelectItem>
                  <SelectItem value="Inappropriate">Nội dung thù địch / Không phù hợp</SelectItem>
                  <SelectItem value="PolicyViolation">Vi phạm quy tắc cộng đồng</SelectItem>
                  <SelectItem value="Other">Lý do khác</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Chi tiết (Tùy chọn)</Label>
              <Textarea
                placeholder="Mô tả lý do bạn báo cáo bình luận này..."
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                maxLength={2000}
                className="h-24 resize-none"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setReportingComment(null)}>
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
    </div>
  );
}
