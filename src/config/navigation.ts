export interface NavItem {
  label: string;
  href: string;
}

export const headerNav: NavItem[] = [
  { label: "古诗学习", href: "/learn" },
  { label: "听诗", href: "/listen" },
  { label: "关于", href: "/about" },
];

export const friendLinks: NavItem[] = [
  { label: "学古诗", href: "https://xuegushi.com" },
  {
    label: "搜韵",
    href: "https://sou-yun.cn/",
  },
  {
    label: "人教电子教材",
    href: "https://jc.pep.com.cn/?filed=%E5%B0%8F%E5%AD%A6&subject=%E8%AF%AD%E6%96%87",
  },
];
