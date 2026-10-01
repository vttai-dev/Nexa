'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { moderationApi } from '@/lib/api/moderation';
import type { ReportDto, ReportFilter, ReportDecisionRequest, ReportStatus } from '@/lib/types/api';
import { useAuthStore } from '@/lib/stores/auth.store';
import { canModerate } from '@/lib/types/api';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { PageLoader } from '@/components/ui/loading-spinner';
import { ErrorState } from '@/components/ui/states';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

export default function AdminModerationPage() {
  const { user, status: authStatus } = useAuthStore();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<ReportFilter>({ page: 1, pageSize: 10, status: 'Pending' });
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportDto | null>(null);
  
  // Form state
  const [decision, setDecision] = useState<'Accepted' | 'Rejected'>('Accepted');
  const [resolutionNote, setResolutionNote] = useState('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['moderation-reports', filter],
    queryFn: () => moderationApi.listReports(filter),
    enabled: authStatus === 'authenticated' && !!user && canModerate(user.account.roles),
  });

  const resolveMutation = useMutation({
    mutationFn: (req: ReportDecisionRequest) => moderationApi.resolveReport(selectedReport!.id, req),
    onSuccess: () => {
      toast({ title: 'Đã xử lý báo cáo' });
      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['moderation-reports'] });
    },
    onError: (e: any) => toast({ title: 'Lỗi', description: e.title || 'Không thể xử lý', variant: 'destructive' })
  });

  if (authStatus === 'loading') return <PageLoader />;
  if (authStatus === 'unauthenticated' || !user || !canModerate(user.account.roles)) {
    return <ErrorState title="Từ chối truy cập" message="Bạn không có quyền kiểm duyệt." />;
  }

  if (isLoading) return <PageLoader />;
  if (error) return <ErrorState retry={() => refetch()} />;

  const openReport = (report: ReportDto) => {
    setSelectedReport(report);
    setDecision('Accepted');
    setResolutionNote('');
    setModalOpen(true);
  };

  const submitDecision = (e: React.FormEvent) => {
    e.preventDefault();
    resolveMutation.mutate({ status: decision, resolutionNote });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-semibold">Kiểm duyệt Báo cáo</h2>
        <div className="flex gap-2 bg-muted p-1 rounded-lg">
          {(['Pending', 'Accepted', 'Rejected'] as ReportStatus[]).map(s => (
            <Button 
              key={s}
              variant={filter.status === s ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter({ ...filter, status: s, page: 1 })}
            >
              {s === 'Pending' ? 'Chờ xử lý' : s === 'Accepted' ? 'Đã chấp nhận' : 'Đã từ chối'}
            </Button>
          ))}
        </div>
      </div>

      <div className="border rounded-xl overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Người báo cáo</TableHead>
              <TableHead>Loại</TableHead>
              <TableHead>Lý do</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Ngày tạo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.items.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">Không có báo cáo nào.</TableCell></TableRow>
            ) : (
              data?.items.map((report) => (
                <TableRow key={report.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openReport(report)}>
                  <TableCell className="font-medium">{report.reporterUserName}</TableCell>
                  <TableCell>{report.targetType}</TableCell>
                  <TableCell>{report.reason}</TableCell>
                  <TableCell>
                    <Badge variant={report.status === 'Pending' ? 'secondary' : report.status === 'Accepted' ? 'destructive' : 'outline'}>
                      {report.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(report.createdAtUtc).toLocaleDateString('vi-VN')}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex justify-between items-center mt-4">
        <Button 
          variant="outline" 
          disabled={filter.page === 1}
          onClick={() => setFilter(prev => ({ ...prev, page: (prev.page || 1) - 1 }))}
        >
          Trang trước
        </Button>
        <span className="text-sm text-muted-foreground">Trang {data?.page} / {Math.ceil((data?.totalCount || 0) / (data?.pageSize || 10)) || 1}</span>
        <Button 
          variant="outline" 
          disabled={data ? filter.page! >= Math.ceil(data.totalCount / data.pageSize) : true}
          onClick={() => setFilter(prev => ({ ...prev, page: (prev.page || 1) + 1 }))}
        >
          Trang sau
        </Button>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Chi tiết báo cáo</DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <form onSubmit={submitDecision} className="space-y-4">
              <div className="grid grid-cols-3 gap-2 text-sm bg-muted/50 p-4 rounded-lg">
                <div className="text-muted-foreground">Người báo cáo:</div>
                <div className="col-span-2 font-medium">{selectedReport.reporterUserName}</div>
                
                <div className="text-muted-foreground">Đối tượng:</div>
                <div className="col-span-2">{selectedReport.targetType} (ID: <span className="font-mono text-xs">{selectedReport.targetId}</span>)</div>
                
                <div className="text-muted-foreground">Lý do:</div>
                <div className="col-span-2 font-medium text-destructive">{selectedReport.reason}</div>
                
                <div className="text-muted-foreground">Chi tiết:</div>
                <div className="col-span-2">{selectedReport.details || 'Không có'}</div>

                <div className="text-muted-foreground">Trạng thái:</div>
                <div className="col-span-2">{selectedReport.status}</div>

                {selectedReport.status !== 'Pending' && (
                  <>
                    <div className="text-muted-foreground mt-2 border-t pt-2">Ghi chú xử lý:</div>
                    <div className="col-span-2 mt-2 border-t pt-2">{selectedReport.resolutionNote}</div>
                  </>
                )}
              </div>

              {selectedReport.status === 'Pending' && (
                <>
                  <div className="space-y-3 pt-2 border-t">
                    <Label>Quyết định xử lý</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setDecision('Accepted')}
                        className={`p-3 rounded-xl border text-xs font-semibold transition-all ${
                          decision === 'Accepted'
                            ? 'border-destructive bg-destructive/10 text-destructive shadow-xs'
                            : 'border-border text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        Chấp nhận báo cáo (Vi phạm)
                      </button>
                      <button
                        type="button"
                        onClick={() => setDecision('Rejected')}
                        className={`p-3 rounded-xl border text-xs font-semibold transition-all ${
                          decision === 'Rejected'
                            ? 'border-primary bg-primary/10 text-primary shadow-xs'
                            : 'border-border text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        Từ chối (Không vi phạm)
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Ghi chú xử lý (Tùy chọn)</Label>
                    <Textarea 
                      placeholder="Nhập lý do xử lý..." 
                      value={resolutionNote}
                      onChange={(e) => setResolutionNote(e.target.value)}
                    />
                  </div>

                  <DialogFooter className="pt-4">
                    <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Hủy</Button>
                    <Button type="submit" disabled={resolveMutation.isPending}>
                      {resolveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Xác nhận xử lý
                    </Button>
                  </DialogFooter>
                </>
              )}
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
