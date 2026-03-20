import Link from "next/link";
import { headerNav } from "@/config/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 h-14 md:h-16 border-b bg-white dark:bg-gray-900 z-50">
      <div className="mx-auto h-full flex items-center justify-between px-4 md:px-6" style={{ maxWidth: 'var(--ui-container-max)' }}>
        <Link href="/" className="text-lg md:text-xl font-bold text-primary">
          学古诗
        </Link>
        <nav className="hidden md:flex gap-6 items-center">
          {headerNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm hover:text-primary transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2 md:gap-4">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
