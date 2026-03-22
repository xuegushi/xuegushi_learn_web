"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarProps {
  className?: string;
  selectedDate?: Date;
  onSelect?: (date: Date) => void;
  dateData?: Map<string, number>;
}

export function Calendar({ className, selectedDate, onSelect, dateData }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startingDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const monthNames = [
    "1月", "2月", "3月", "4月", "5月", "6月",
    "7月", "8月", "9月", "10月", "11月", "12月"
  ];

  const weekDays = ["日", "一", "二", "三", "四", "五", "六"];

  const prevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const formatDateKey = (d: Date) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === month &&
      today.getFullYear() === year
    );
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === month &&
      selectedDate.getFullYear() === year
    );
  };

  const getDateCount = (day: number) => {
    const date = new Date(year, month, day);
    const key = formatDateKey(date);
    return dateData?.get(key) || 0;
  };

  const days: (number | null)[] = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-1 hover:bg-muted rounded cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-medium">
          {year}年 {monthNames[month]}
        </span>
        <button
          onClick={nextMonth}
          className="p-1 hover:bg-muted rounded cursor-pointer"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-xs text-muted-foreground py-1">
            {day}
          </div>
        ))}
        {days.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }
          const count = getDateCount(day);
          return (
            <button
              key={day}
              onClick={() => onSelect?.(new Date(year, month, day))}
              className={cn(
                "aspect-square flex flex-col items-center justify-center rounded text-xs relative cursor-pointer transition-colors py-1",
                isToday(day) && !isSelected(day) && "bg-blue-500/20 font-bold ring-2 ring-blue-500",
                isSelected(day) && "bg-primary text-primary-foreground",
                !isSelected(day) && "hover:bg-muted"
              )}
            >
              <span className="text-sm">{day}</span>
              <span className={cn(
                "text-[10px] font-medium mt-0.5",
                count > 0 
                  ? (isSelected(day) ? "text-primary-foreground/80" : "text-blue-500")
                  : (isSelected(day) ? "text-primary-foreground/50" : "text-muted-foreground/50")
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
