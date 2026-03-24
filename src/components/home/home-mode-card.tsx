"use client";

import React, { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";

type CardProps = {
  title: string;
  icon?: ReactNode;
  description: string;
  bullets?: string[];
  ctaLabel?: string;
  href: string;
  className?: string;
};

export function HomeModeCard({
  title,
  icon,
  description,
  bullets,
  ctaLabel = "开始",
  href,
  reverse = false,
  className,
}: CardProps & { reverse?: boolean }) {
  const router = useRouter();
  // 左右分布：奇数卡片（reverse=false）左侧为标题+图标，右侧为内容；偶数卡片（reverse=true）左侧为内容，右侧为标题+图标
  const headerBlock = (
    <div className="w-full flex flex-col items-center gap-3">
      <div className="text-3xl font-semibold text-slate-900 dark:text-accent-foreground">{title}</div>
      {icon && (
        <div className="w-28 h-28 flex items-center justify-center text-slate-600 dark:text-slate-300" aria-label="card-icon">
          {icon}
        </div>
      )}
    </div>
  );
  const descriptionLines = (description ?? "")
    .split("\n")
    .filter((l) => l.trim().length > 0);
  const contentBlock = (
    <div className="flex-1 flex flex-col gap-2">
      {descriptionLines.length > 0
        ? descriptionLines.map((line, idx) => (
            <div
              key={`dline-${idx}`}
              style={{
                opacity: 0,
                transform: "translateY(6px)",
                animation: `cardReveal 400ms ease forwards ${idx * 60}ms`,
              }}>
              {line}
            </div>
          ))
        : null}
      {bullets && bullets.length > 0 && (
        <ul
          className="list-disc pl-5 space-y-1 text-sm text-muted-foreground mb-2"
          style={{
            opacity: 0,
            transform: "translateY(6px)",
            animation: `cardReveal 400ms ease forwards ${descriptionLines.length * 60}ms`,
          }}>
          {bullets.map((b, idx) => (
            <li key={idx}>{b}</li>
          ))}
        </ul>
      )}
      <Button
        variant="default"
        size="default"
        onClick={() => href && router.push(href)}
        className="mt-1 h-9 inline-flex items-center cursor-pointer"
        style={{
          animation: `cardReveal 400ms ease forwards ${descriptionLines.length * 60 + (bullets ? bullets.length * 60 : 0)}ms`,
        }}>
        {ctaLabel}
        <span className="ml-1">→</span>
      </Button>
    </div>
  );

  const leftContent = reverse ? contentBlock : headerBlock;
  const rightContent = reverse ? headerBlock : contentBlock;

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setMounted(true), 20);
    return () => clearTimeout(t);
  }, []);
  return (
    <section
      className={cn(
        `bg-card rounded-xl border p-8 px-12 hover:shadow-lg transform transition-all duration-300 w-full ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`,
        className,
      )}
      role="article"
      aria-label={`${title} 模式卡`}>
      <div className={`grid grid-cols-1 md:grid-cols-2 items-start gap-6`}>
        <div className="flex items-start">{leftContent}</div>
        <div className="flex items-start">{rightContent}</div>
      </div>
      <style jsx>{`
        @keyframes cardReveal {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}
