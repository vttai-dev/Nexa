'use client';

import React from 'react';
import { useLayoutStore } from '@/lib/stores/layout.store';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RotateCcw, Sparkles, Terminal, ShieldCheck } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  moduleName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class RawModuleErrorBoundary extends React.Component<
  ErrorBoundaryProps & { onResetSimulated?: () => void },
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps & { onResetSimulated?: () => void }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[Self-Healing Boundary: ${this.props.moduleName ?? 'Module'}] Caught error:`, error, errorInfo);
  }

  handleReloadModule = () => {
    this.props.onResetSimulated?.();
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="container mx-auto max-w-2xl px-4 py-16">
          <div className="relative rounded-3xl border border-amber-500/30 bg-card/85 backdrop-blur-2xl p-8 sm:p-10 text-center space-y-6 overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-primary" />

            <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/25">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              Self-Healing Regulation Protocol • Isolated Fault
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">
                Phân hệ {this.props.moduleName ?? 'Ứng dụng'} đã được cô lập sự cố
              </h2>
              <p className="text-xs text-muted-foreground max-w-lg mx-auto leading-relaxed">
                Hệ thống <strong className="text-foreground">React Error Boundary</strong> đã chặn lỗi cục bộ tại Main Viewport để bảo vệ thanh điều hướng toàn cục và trạng thái phiên làm việc.
              </p>
            </div>

            {this.state.error && (
              <div className="rounded-2xl border border-border bg-muted/40 p-4 text-left font-mono text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Chẩn đoán sự cố (Diagnostic Trace):</span>
                </div>
                <p className="text-rose-300 break-words">{this.state.error.message}</p>
              </div>
            )}

            <div className="pt-2 flex justify-center">
              <Button
                onClick={this.handleReloadModule}
                className="rounded-2xl px-6 h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Tải lại phân hệ
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function SimulatedCrashTrigger({ moduleName }: { moduleName: string }) {
  const simulatedCrashModule = useLayoutStore((s) => s.simulatedCrashModule);
  if (simulatedCrashModule === moduleName || simulatedCrashModule === 'ALL') {
    throw new Error(
      `[Simulated Fault] Sự cố giả lập tại phân hệ "${moduleName}" để kiểm thử cơ chế Self-Healing Error Boundary.`
    );
  }
  return null;
}

export function ModuleErrorBoundary({ children, moduleName = 'Main Viewport' }: ErrorBoundaryProps) {
  const triggerSimulatedCrash = useLayoutStore((s) => s.triggerSimulatedCrash);

  return (
    <RawModuleErrorBoundary
      moduleName={moduleName}
      onResetSimulated={() => triggerSimulatedCrash(null)}
    >
      <SimulatedCrashTrigger moduleName={moduleName} />
      {children}
    </RawModuleErrorBoundary>
  );
}
