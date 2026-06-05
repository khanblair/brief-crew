import { Sidebar } from "@/components/ui/Sidebar";

const NAV = [
  { href: "/my-projects",  label: "My Projects",       icon: <span className="text-base">📦</span> },
  { href: "/freelancers",  label: "Find a Freelancer",  icon: <span className="text-base">🔍</span> },
  { href: "/settings",     label: "Settings",           icon: <span className="text-base">⚙️</span> },
];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar navItems={NAV} title="Client Portal" />
      <main className="flex-1 overflow-y-auto bg-neutral-50 p-8">{children}</main>
    </div>
  );
}
