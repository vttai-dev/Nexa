'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import type { AuditLogFilter } from '@/lib/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { PageLoader } from '@/components/ui/loading-spinner';
import { ErrorState } from '@/components/ui/states';
import { ScrollText, Search, Filter } from 'lucide-react';

export default function AdminAuditLogsPage() {
  const [filter, setFilter] = useState<AuditLogFilter>({ page: 1, pageSize: 20 });
  const [actionInput, setActionInput] = useState('');
  const [targetTypeInput, setTargetTypeInput] = useState('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-audit-logs', filter],
    queryFn: () => adminApi.listAuditLogs(filter),
  });

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setFilter(prev => ({
      ...prev,
      page: 1,
      action: actionInput.trim() || undefined,
      targetType: targetTypeInput.trim() || undefined,
    }));
  };

  const handleResetFilter = () => {
    setActionInput('');
    setTargetTypeInput('');
    setFilter({ page: 1, pageSize: 20 });
  };

  if (isLoading) return <PageLoader />;
  if (error) return <ErrorState retry={() => refetch()} />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <ScrollText className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Nhật ký Hệ thống</h2>
        </div>
        <span className="text-xs text-muted-foreground font-mono">
          Tổng số: {data?.totalCount || 0} bản ghi
        </span>
      </div>

      {/* Filter Bar */}
      <form onSubmit={handleApplyFilter} className="flex flex-wrap items-center gap-3 p-4 rounded-xl border bg-card/60">
        <div className="flex-1 min-w-[160px]">
          <Input
            placeholder="Lọc theo hành động (VD: Admin.UserRolesUpdated)..."
            value={actionInput}
            onChange={(e) => setActionInput(e.target.value)}
            className="h-9 text-xs"
          />
        </div>
        <div className="w-48">
          <Input
            placeholder="Loại đối tượng (VD: User, Article)..."
            value={targetTypeInput}
            onChange={(e) => setTargetTypeInput(e.target.value)}
            className="h-9 text-xs"
          />
        </div>
        <Button type="submit" size="sm" className="h-9 gap-1.5">
          <Filter className="w-3.5 h-3.5" />
          Lọc
        </Button>
        {(filter.action || filter.targetType) && (
          <Button type="button" variant="ghost" size="sm" onClick={handleResetFilter} className="h-9 text-xs">
            Xóa lọc
          </Button>
        )}
      </form>

      {/* Table */}
      <div className="border rounded-xl overflow-hidden bg-card shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Thời gian</TableHead>
              <TableHead>Người thực hiện</TableHead>
              <TableHead>Hành động</TableHead>
              <TableHead>Loại đối tượng</TableHead>
              <TableHead>ID Đối tượng</TableHead>
              <TableHead>IP</TableHead>
              <TableHead>Chi tiết</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Không có nhật ký nào phù hợp.
                </TableCell>
              </TableRow>
            ) : (
              data?.items.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-muted-foreground text-xs whitespace-nowrap font-mono">
                    {new Date(log.createdAtUtc).toLocaleString('vi-VN')}
                  </TableCell>
                  <TableCell className="font-semibold text-sm">{log.actorUserName}</TableCell>
                  <TableCell className="font-mono text-xs text-primary">{log.action}</TableCell>
                  <TableCell className="text-xs">{log.targetType}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{log.targetId}</TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">{log.ipAddress}</TableCell>
                  <TableCell className="text-muted-foreground text-xs max-w-[240px] truncate" title={log.details}>
                    {log.details}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data && data.totalCount > 0 && (
        <Pagination
          page={data.page}
          pageSize={data.pageSize}
          totalCount={data.totalCount}
          onPageChange={(p) => setFilter(prev => ({ ...prev, page: p }))}
        />
      )}
    </div>
  );
}
