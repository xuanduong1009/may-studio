/** Main navigation, shared by the desktop header and the mobile menu (labels are "Nav.<key>" translations). */
export const NAV = [
  { href: "/shop", key: "shop" },
  { href: "/shop?new=1", key: "newArrivals" },
  { href: "/shop?sale=1", key: "sale" },
  { href: "/#look", key: "lookbook" },
  { href: "/about", key: "about" },
] as const;
