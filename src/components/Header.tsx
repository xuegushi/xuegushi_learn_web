import Link from "next/link";
import { headerNav } from "@/config/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Header() {
  return (
    <header className="h-16 border-b bg-white dark:bg-gray-900">
      <div className="mx-auto w-[var(--ui-container)] flex items-center justify-between px-6 h-full">
        <Link href="/" className="text-xl font-bold text-primary">
          学古诗
        </Link>
        <nav className="flex gap-6 items-center">
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
        <div className="flex items-center gap-4">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
