"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  navItems: NavItem[];
  title: string;
}

export function Sidebar({ navItems, title }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-neutral-200 bg-white px-4 py-6">
      <div className="mb-8 px-2">
        <span className="text-lg font-bold text-brand">BriefCrew</span>
        <p className="text-xs text-neutral-500 mt-0.5">{title}</p>
      </div>

      <nav className="flex flex-col gap-0.5 flex-1">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-brand-50 text-brand font-semibold"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-neutral-200 pt-4">
        <UserButton
          appearance={{
            elements: {
              userButtonBox: "flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-neutral-100 w-full",
            },
          }}
        />
      </div>
    </aside>
  );
}
