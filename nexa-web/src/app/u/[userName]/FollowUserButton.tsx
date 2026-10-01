'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/stores/auth.store';
import { engagementApi } from '@/lib/api/engagement';
import { Button } from '@/components/ui/button';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface Props {
  userId: string;
  userName: string;
}

export function FollowUserButton({ userId, userName }: Props) {
  const { user } = useAuthStore();
  const router = useRouter();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  // If viewing own profile, don't show follow button
  if (user?.account.id === userId || user?.account.userName === userName) {
    return null;
  }

  const handleFollowToggle = async () => {
    if (!user) {
      toast({ title: 'Yêu cầu đăng nhập', description: 'Vui lòng đăng nhập để theo dõi tác giả.' });
      router.push('/login');
      return;
    }

    setLoading(true);
    try {
      if (following) {
        await engagementApi.unfollow(userId);
        setFollowing(false);
        toast({ title: `Đã bỏ theo dõi @${userName}` });
      } else {
        await engagementApi.follow(userId);
        setFollowing(true);
        toast({ title: `Đang theo dõi @${userName}` });
      }
    } catch (e: any) {
      toast({ title: 'Lỗi', description: e.title || 'Không thể thực hiện thao tác', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={following ? 'outline' : 'default'}
      size="sm"
      onClick={handleFollowToggle}
      disabled={loading}
      className={`rounded-xl font-medium transition-all ${
        following 
          ? 'border-border/80 hover:bg-muted' 
          : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs shadow-primary/20'
      }`}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
      ) : following ? (
        <UserCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
      ) : (
        <UserPlus className="w-3.5 h-3.5 mr-1.5" />
      )}
      {following ? 'Đang theo dõi' : 'Theo dõi'}
    </Button>
  );
}
