"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accuracy: number;
  correctCount: number;
  errorCount: number;
  totalCount: number;
  onRestart: () => void;
  onContinue: () => void;
  mode: "recite" | "learn";
}

/**
 * 学习结果弹窗
 * 显示正确率、正确/错误数量，提供重新开始和继续学习选项
 */
export function ResultDialog({
  open,
  onOpenChange,
  accuracy,
  correctCount,
  errorCount,
  totalCount,
  onRestart,
  onContinue,
}: ResultDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center py-4">
            学习完成
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4 text-center">
          {/* 正确率 */}
          <div className="text-2xl">正确率：{accuracy}%</div>

          {/* 正确/错误数量 */}
          <div className="flex justify-center gap-8">
            <div className="text-green-600">正确：{correctCount}</div>
            <div className="text-red-600">错误：{errorCount}</div>
          </div>

          {/* 总数 */}
          <div className="text-muted-foreground">
            共 {totalCount} 首诗词
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-center gap-4 pb-4">
          <button
            onClick={onRestart}
            className="px-6 py-2 border border-primary text-primary rounded hover:bg-primary/10 transition-colors cursor-pointer"
          >
            重新开始
          </button>
          <button
            onClick={onContinue}
            className="px-6 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors cursor-pointer"
          >
            {mode === "recite" ? "继续背诵" : "继续学习"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
