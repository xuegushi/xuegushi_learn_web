"use client";

import React from "react";
import { LearningProgress } from "@/lib/db";

interface LearningProgressCardProps {
  progress: LearningProgress | null;
}

export function LearningProgressCard({ progress }: LearningProgressCardProps) {
  if (!progress) {
    return (
      <div className="p-3 border rounded-lg bg-muted/30">
        <div className="text-sm font-medium text-muted-foreground">尚未学习</div>
      </div>
    );
  }

  const masteryColor =
    progress.mastery_level >= 80
      ? "text-green-600"
      : progress.mastery_level >= 50
      ? "text-yellow-600"
      : "text-red-600";

  return (
    <div className="p-3 border rounded-lg bg-muted/30 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">学习进度</span>
        <span className={`text-sm font-bold ${masteryColor}`}>
          {progress.mastery_level}%
        </span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress.mastery_level}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>学习: {progress.learn_count}次</span>
        <span>正确: {progress.correct_count}</span>
        <span>错误: {progress.wrong_count}</span>
      </div>
      {progress.last_learned_at && (
        <div className="text-xs text-muted-foreground">
          上次学习: {new Date(progress.last_learned_at).toLocaleDateString("zh-CN")}
        </div>
      )}
    </div>
  );
}