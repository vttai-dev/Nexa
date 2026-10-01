'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { accountApi } from '@/lib/api/account';
import { mediaApi } from '@/lib/api/media';
import { NexaApiError } from '@/lib/api/client';
import { useAuthStore } from '@/lib/stores/auth.store';
import { PageLoader } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/states';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, ArrowLeft, Save, User, Globe, Upload } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';
import { resolveArticleImageUrl } from '@/lib/media-url';

const profileSchema = z.object({
  displayName: z.string().min(1, 'Vui lòng nhập tên hiển thị').max(100, 'Tối đa 100 ký tự'),
  bio: z.string().max(2000, 'Tối đa 2.000 ký tự'),
  avatarUrl: z.string().url('URL ảnh không hợp lệ').or(z.string().startsWith('/uploads/images/')).or(z.literal('')).optional().nullable(),
  websiteUrl: z.string().url('URL website không hợp lệ').or(z.literal('')).optional().nullable(),
  coverImageUrl: z.string().url('URL ảnh không hợp lệ').or(z.string().startsWith('/uploads/images/')).or(z.literal('')).optional(),
  gitHubUrl: z.string().url('URL GitHub không hợp lệ').or(z.literal('')).optional(),
  linkedInUrl: z.string().url('URL LinkedIn không hợp lệ').or(z.literal('')).optional(),
  company: z.string().max(120, 'Tối đa 120 ký tự'),
  skills: z.string().max(1000, 'Danh sách kỹ năng quá dài'),
});

type ProfileInputs = z.infer<typeof profileSchema>;

export default function ProfileEditPage() {
  const router = useRouter();
  const { user, status, initialize } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<'avatarUrl' | 'coverImageUrl' | null>(null);
  const avatarFileInput = useRef<HTMLInputElement>(null);
  const coverFileInput = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset, control, setValue, formState: { errors } } = useForm<ProfileInputs>({
    resolver: zodResolver(profileSchema),
    defaultValues: { displayName: '', bio: '', avatarUrl: '', websiteUrl: '', coverImageUrl: '', gitHubUrl: '', linkedInUrl: '', company: '', skills: '' },
  });

  useEffect(() => {
    if (user) {
      reset({
        displayName: user.profile.displayName,
        bio: user.profile.bio || '',
        avatarUrl: user.profile.avatarUrl || '',
        websiteUrl: user.profile.websiteUrl || '',
        coverImageUrl: user.profile.coverImageUrl || '',
        gitHubUrl: user.profile.gitHubUrl || '',
        linkedInUrl: user.profile.linkedInUrl || '',
        company: user.profile.company || '',
        skills: user.profile.skills?.join(', ') || '',
      });
    }
  }, [user, reset]);

  const avatarWatch = useWatch({ control, name: 'avatarUrl' });
  const coverWatch = useWatch({ control, name: 'coverImageUrl' });

  const uploadProfileImage = async (field: 'avatarUrl' | 'coverImageUrl', file?: File) => {
    if (!file) return;
    const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!acceptedTypes.includes(file.type)) {
      toast({ title: 'Định dạng ảnh không hỗ trợ', description: 'Chọn ảnh JPG, PNG, WEBP hoặc GIF.', variant: 'destructive' });
      return;
    }
    if (file.size === 0 || file.size > 2 * 1024 * 1024) {
      toast({ title: 'Ảnh quá lớn', description: 'Ảnh hồ sơ phải nhỏ hơn hoặc bằng 2 MB.', variant: 'destructive' });
      return;
    }
    setUploadingImage(field);
    try {
      const asset = await mediaApi.uploadProfileImage(file);
      setValue(field, asset.url, { shouldDirty: true, shouldValidate: true });
      toast({ title: 'Đã tải ảnh lên', description: 'Lưu hồ sơ để áp dụng thay đổi.' });
    } catch (error) {
      toast({ title: 'Không tải được ảnh', description: error instanceof NexaApiError ? error.title : 'Vui lòng thử lại.', variant: 'destructive' });
    } finally {
      setUploadingImage(null);
    }
  };

  const onSubmit = async (data: ProfileInputs) => {
    setLoading(true);
    try {
      await accountApi.updateProfile({
        displayName: data.displayName,
        bio: data.bio || '',
        avatarUrl: data.avatarUrl || undefined,
        websiteUrl: data.websiteUrl || undefined,
        coverImageUrl: data.coverImageUrl || undefined,
        gitHubUrl: data.gitHubUrl || undefined,
        linkedInUrl: data.linkedInUrl || undefined,
        company: data.company || undefined,
        skills: data.skills.split(',').map((skill) => skill.trim()).filter(Boolean).slice(0, 20),
      });
      await initialize();
      toast({ title: 'Cập nhật hồ sơ thành công!' });
      router.push(`/u/${user?.account.userName}`);
    } catch (error) {
      toast({ 
        title: 'Lỗi cập nhật', 
        description: error instanceof NexaApiError ? error.title : 'Vui lòng kiểm tra lại thông tin', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') return <PageLoader />;
  if (status === 'unauthenticated' || !user) {
    return (
      <EmptyState
        title="Yêu cầu đăng nhập"
        description="Bạn cần đăng nhập để chỉnh sửa hồ sơ."
        action={<Button asChild className="rounded-xl"><Link href="/login">Đăng nhập ngay</Link></Button>}
      />
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 sm:px-6 py-10 space-y-6">
      
      {/* Top Navigation */}
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="rounded-xl">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Chỉnh sửa hồ sơ cá nhân
          </h1>
          <p className="text-xs text-muted-foreground">
            Thông tin hiển thị công khai trên trang tác giả của bạn
          </p>
        </div>
      </div>

      <Card className="rounded-3xl border border-border/80 bg-card shadow-xs p-2 sm:p-4">
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6 pt-6">
            
            {/* Avatar Preview */}
            <div className="flex items-center gap-5 p-4 rounded-2xl bg-muted/40 border border-border/60">
              <Avatar className="h-16 w-16 ring-2 ring-primary/20 shrink-0">
                <AvatarImage src={resolveArticleImageUrl(avatarWatch || undefined)} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                  {user?.profile.displayName?.[0]?.toUpperCase() ?? '?'}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <div className="text-sm font-semibold text-foreground">Ảnh đại diện</div>
                <p className="text-xs text-muted-foreground">
                  Tải ảnh JPG, PNG, WEBP hoặc GIF; dung lượng tối đa 2 MB.
                </p>
              </div>
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Tên hiển thị
              </Label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-10 h-11 rounded-xl border-border/80 focus-visible:ring-primary text-sm"
                  placeholder="Họ và tên..."
                  {...register('displayName')}
                />
              </div>
              {errors.displayName && <p className="text-xs text-destructive font-medium">{errors.displayName.message}</p>}
            </div>

            {/* Avatar upload */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Ảnh đại diện
              </Label>
              <input ref={avatarFileInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" onChange={(event) => { void uploadProfileImage('avatarUrl', event.target.files?.[0]); event.currentTarget.value = ''; }} />
              <Button type="button" variant="outline" className="rounded-xl" disabled={uploadingImage !== null} onClick={() => avatarFileInput.current?.click()}>
                {uploadingImage === 'avatarUrl' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                {uploadingImage === 'avatarUrl' ? 'Đang tải ảnh...' : 'Chọn ảnh đại diện'}
              </Button>
              {errors.avatarUrl && <p className="text-xs text-destructive font-medium">{errors.avatarUrl.message}</p>}
            </div>

            {/* Website URL */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Website / GitHub / Portfolio
              </Label>
              <div className="relative">
                <Globe className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-10 h-11 rounded-xl border-border/80 focus-visible:ring-primary text-sm font-mono"
                  placeholder="https://github.com/username"
                  {...register('websiteUrl')}
                />
              </div>
              {errors.websiteUrl && <p className="text-xs text-destructive font-medium">{errors.websiteUrl.message}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ảnh bìa</Label>
                <input ref={coverFileInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" onChange={(event) => { void uploadProfileImage('coverImageUrl', event.target.files?.[0]); event.currentTarget.value = ''; }} />
                <Button type="button" variant="outline" className="rounded-xl" disabled={uploadingImage !== null} onClick={() => coverFileInput.current?.click()}>
                  {uploadingImage === 'coverImageUrl' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  {uploadingImage === 'coverImageUrl' ? 'Đang tải ảnh...' : 'Chọn ảnh bìa'}
                </Button>
                {coverWatch && <div role="img" aria-label="Xem trước ảnh bìa" className="h-20 rounded-xl border border-border/70 bg-cover bg-center" style={{ backgroundImage: `url("${resolveArticleImageUrl(coverWatch)}")` }} />}
                <p className="text-xs text-muted-foreground">Dung lượng tối đa 2 MB.</p>
                {errors.coverImageUrl && <p className="text-xs text-destructive">{errors.coverImageUrl.message}</p>}
              </div>
              <div className="space-y-2"><Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Công ty</Label><Input placeholder="Tên công ty" {...register('company')} />{errors.company && <p className="text-xs text-destructive">{errors.company.message}</p>}</div>
              <div className="space-y-2"><Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">GitHub URL</Label><Input placeholder="https://github.com/username" {...register('gitHubUrl')} />{errors.gitHubUrl && <p className="text-xs text-destructive">{errors.gitHubUrl.message}</p>}</div>
              <div className="space-y-2"><Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">LinkedIn URL</Label><Input placeholder="https://linkedin.com/in/username" {...register('linkedInUrl')} />{errors.linkedInUrl && <p className="text-xs text-destructive">{errors.linkedInUrl.message}</p>}</div>
              <div className="space-y-2 sm:col-span-2"><Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Kỹ năng (phân cách bằng dấu phẩy, tối đa 20)</Label><Input placeholder=".NET, PostgreSQL, Docker" {...register('skills')} /><p className="text-xs text-muted-foreground">Ví dụ: .NET, PostgreSQL, Docker</p></div>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Tiểu sử bản thân (Bio)
              </Label>
              <Textarea
                className="min-h-[120px] rounded-xl border-border/80 focus-visible:ring-primary text-sm leading-relaxed"
                placeholder="Giới thiệu về kỹ năng, kinh nghiệm hoặc sở thích lập trình của bạn..."
                {...register('bio')}
              />
              {errors.bio && <p className="text-xs text-destructive font-medium">{errors.bio.message}</p>}
            </div>

            {/* Action Button */}
            <div className="pt-2">
              <Button 
                type="submit" 
                className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md shadow-primary/20"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang lưu hồ sơ...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Lưu thông tin hồ sơ
                  </>
                )}
              </Button>
            </div>

          </CardContent>
        </form>
      </Card>

    </div>
  );
}
