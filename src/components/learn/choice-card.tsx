"use client";

import { RadioGroupItem } from "@/components/ui/radio-group";

interface ChoiceCardProps {
  value: string;
  title: string;
  description?: string;
  selected?: boolean;
}

/** 卡片式单选按钮 */
export function ChoiceCard({ value, title, description, selected }: ChoiceCardProps) {
  return (
    <label
      className={`flex items-start gap-3 rounded-lg border p-1.5 cursor-pointer transition-colors w-full overflow-hidden ${
        selected
          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
          : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
      }`}
    >
      <RadioGroupItem
        value={value}
        className="shrink-0 size-3"
      />
      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="font-medium text-xs truncate">{title}</div>
        {description && (
          <div className="text-xs text-muted-foreground truncate mt-0.5 whitespace-nowrap">
            {description}
          </div>
        )}
      </div>
    </label>
  );
}