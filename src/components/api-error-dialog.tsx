"use client";

import { useApiErrorStore } from "@/lib/api/error-store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function ApiErrorDialog() {
  const { isOpen, title, message, hideError } = useApiErrorStore();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && hideError()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-red-500">!</span>
            {title || "请求错误"}
          </DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 mt-4">
          <Button onClick={hideError} variant="default">
            确定
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
