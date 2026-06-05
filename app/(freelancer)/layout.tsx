import { Sidebar } from "@/components/ui/Sidebar";

const NAV = [
  { href: "/dashboard",    label: "Projects",     icon: <span className="text-base">📋</span> },
  { href: "/projects/new", label: "New Project",  icon: <span className="text-base">➕</span> },
  { href: "/clients",      label: "Clients",      icon: <span className="text-base">👥</span> },
  { href: "/my-page",      label: "My Page",      icon: <span className="text-base">🔗</span> },
  { href: "/settings",     label: "Settings",     icon: <span className="text-base">⚙️</span> },
];

export default function FreelancerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar navItems={NAV} title="Freelancer" />
      <main className="flex-1 overflow-y-auto bg-neutral-50 p-8">{children}</main>
    </div>
  );
}
