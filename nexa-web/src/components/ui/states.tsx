import { FileX, AlertCircle, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: 'empty' | 'error' | 'inbox';
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ title, description, icon = 'empty', action, className }: EmptyStateProps) {
  const Icon = icon === 'error' ? AlertCircle : icon === 'inbox' ? Inbox : FileX;

  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      <div className="rounded-full bg-muted p-4 mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-foreground mb-1">{title}</h3>
      {description && <p className="text-sm text-muted-foreground max-w-md">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message?: string;
  retry?: () => void;
  className?: string;
}

export function ErrorState({ title = 'Đã xảy ra lỗi', message, retry, className }: ErrorStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      <div className="rounded-full bg-destructive/10 p-4 mb-4">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>
      <h3 className="font-semibold text-foreground mb-1">{title}</h3>
      {message && <p className="text-sm text-muted-foreground max-w-md">{message}</p>}
      {retry && (
        <button
          onClick={retry}
          className="mt-4 text-sm text-primary underline hover:no-underline"
        >
          Thử lại
        </button>
      )}
    </div>
  );
}
