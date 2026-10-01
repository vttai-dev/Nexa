'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/stores/auth.store';
import { engagementApi } from '@/lib/api/engagement';
import { Button } from '@/components/ui/button';
import { Bookmark, BookmarkCheck, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';

interface Props {
  tagId: string;
  tagName: string;
  isInitiallyFollowing?: boolean;
  onToggle?: (nowFollowing: boolean) => void;
  size?: 'default' | 'sm' | 'xs';
}

export function FollowTagButton({ tagId, tagName, isInitiallyFollowing = false, onToggle, size = 'sm' }: Props) {
  const { user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [following, setFollowing] = useState(isInitiallyFollowing);
  const [loading, setLoading] = useState(false);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast({ title: 'Yêu cầu đăng nhập', description: 'Vui lòng đăng nhập để theo dõi thẻ này.' });
      router.push('/login');
      return;
    }

    setLoading(true);
    try {
      if (following) {
        await engagementApi.unfollowTag(tagId);
        setFollowing(false);
        onToggle?.(false);
        toast({ title: `Đã bỏ theo dõi #${tagName}` });
      } else {
        await engagementApi.followTag(tagId);
        setFollowing(true);
        onToggle?.(true);
        toast({ title: `Đang theo dõi #${tagName}` });
      }
      queryClient.invalidateQueries({ queryKey: ['following-tags'] });
      queryClient.invalidateQueries({ queryKey: ['tag-stats', tagId] });
    } catch (e: any) {
      toast({ title: 'Lỗi', description: e.title || 'Không thể thực hiện', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={following ? 'secondary' : 'outline'}
      size={size}
      onClick={handleToggle}
      disabled={loading}
      className={`rounded-lg transition-all text-xs font-semibold ${
        following ? 'border-primary/40 text-primary' : 'hover:border-primary/50'
      }`}
    >
      {loading ? (
        <Loader2 className="w-3 h-3 animate-spin mr-1" />
      ) : following ? (
        <BookmarkCheck className="w-3 h-3 text-primary mr-1" />
      ) : (
        <Bookmark className="w-3 h-3 mr-1" />
      )}
      {following ? 'Đã theo dõi' : 'Theo dõi'}
    </Button>
  );
}
