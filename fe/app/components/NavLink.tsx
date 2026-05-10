"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = pathname.startsWith(href);

  return (
    <Link
      href={isActive ? "/" : href}
      className={`flex flex-col content-center min-w-28 z-10 w-28 p-2 pt-3 cursor-pointer rounded-lg transition-all duration-200 bg-white hover:bg-gray-100 hover:scale-105 active:scale-95 ${
        isActive ? "bg-gray-100 font-semibold" : ""
      }`}
    >
      {children}
    </Link>
  );
}
