"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { CheckCircle } from "lucide-react";

interface CheckInSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  count: number;
}

export function CheckInSuccessDialog({ open, onOpenChange, count }: CheckInSuccessDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">打卡成功</DialogTitle>
          <DialogDescription className="text-center">
            不积跬步无以至千里，恭喜你又前进一步！
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center py-6">
          <CheckCircle className="h-20 w-20 text-blue-500 mb-4" />
          {count > 1 && (
            <p className="text-sm text-muted-foreground">
              当前诗词已打卡 {count} 次
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
