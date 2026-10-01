import { toast as baseToast } from "@/components/ui/toast"

export interface ToastOptions {
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

export function toast({ title, description, variant }: ToastOptions) {
  const type = variant === "destructive" ? "error" : "success"
  return baseToast.add({
    type,
    title: title || (variant === "destructive" ? "Đã xảy ra lỗi" : "Thành công"),
    description,
  })
}

export function useToast() {
  return { toast }
}
