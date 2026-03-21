"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (userName: string) => void;
}

export function CreateUserDialog({ open, onOpenChange, onSubmit }: CreateUserDialogProps) {
  const [userName, setUserName] = useState("");

  const handleSubmit = () => {
    if (userName.trim() && userName.length <= 32) {
      onSubmit(userName.trim());
      setUserName("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>创建用户</DialogTitle>
          <DialogDescription>
            为了更好地帮您记录打卡信息，先给您起一个响亮的名字吧！
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value.slice(0, 32))}
            placeholder="请输入用户名（最多32字符）"
            className="w-full px-3 py-2 border rounded-md bg-background"
            maxLength={32}
          />
          <div className="text-xs text-muted-foreground mt-1 text-right">
            {userName.length}/32
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={!userName.trim()}>
            提交
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
