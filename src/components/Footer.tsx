import { friendLinks } from "@/config/navigation";

export default function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 h-10 md:h-12 border-t bg-white dark:bg-gray-900 z-50">
      <div className="mx-auto h-full flex items-center justify-between px-4 md:px-6" style={{ maxWidth: 'var(--ui-container-max)' }}>
        <div className="flex flex-col md:flex-row md:items-center gap-0 md:gap-2 text-xs md:text-sm text-muted-foreground">
          <span>© 2026 学古诗</span>
          <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
            鲁ICP备15006514号-6
          </a>
        </div>
        <nav className="hidden md:flex gap-6">
          {friendLinks.map((item) => (
            <a
              key={item.href}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs md:text-sm hover:text-primary transition-colors"
            >
              {item.label}
            </a>
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
