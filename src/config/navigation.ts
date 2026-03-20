export interface NavItem {
  label: string;
  href: string;
}

export const headerNav: NavItem[] = [
  { label: "学习", href: "/learn" },
  { label: "关于", href: "/about" },
];

export const friendLinks: NavItem[] = [
  { label: "学古诗", href: "https://xuegushi.com" },
];
