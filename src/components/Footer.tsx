import Link from "next/link";
import { footerNav } from "@/config/navigation";

export default function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 h-10 md:h-12 border-t bg-white dark:bg-gray-900 z-50">
      <div className="mx-auto h-full flex items-center justify-between px-4 md:px-6" style={{ maxWidth: 'var(--ui-container-max)' }}>
        <div className="text-xs md:text-sm text-muted-foreground">
          copyright@2026
        </div>
        <nav className="hidden md:flex gap-6">
          {footerNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-xs md:text-sm hover:text-primary transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="relative group">
          <img
            src="/image/wx.svg"
            alt="微信"
            width={20}
            height={20}
            className="cursor-pointer hover:opacity-80 transition-opacity md:w-6 md:h-6"
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
