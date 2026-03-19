import Link from "next/link";
import { footerNav } from "@/config/navigation";

export default function Footer() {
  return (
    <footer className="h-12 border-t bg-white dark:bg-gray-900">
      <div className="mx-auto w-[var(--ui-container)] flex items-center justify-between px-6 h-full">
        <div className="text-sm text-muted-foreground">
          copyright@2026
        </div>
        <nav className="flex gap-6">
          {footerNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm hover:text-primary transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="relative group">
          <img
            src="/image/wx.svg"
            alt="微信"
            width={24}
            height={24}
            className="cursor-pointer hover:opacity-80 transition-opacity"
          />
          <div className="absolute w-48 h-48 p-2 bottom-full right-0 mb-2 hidden group-hover:block">
            <img
              src="/images/xcx.jpg"
              alt="小程序二维码"
              width={178}
              height={178}
              className="border w-44 h-44 rounded-lg shadow-lg"
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
