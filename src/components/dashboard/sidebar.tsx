"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  FileText,
  CalendarDays,
  Settings,
} from "lucide-react";

// Dashboard navigation used by /home and future application pages.
// Dashboard navigation shared across the application.
// Each item maps directly to an application route.
const navigation = [
  { name: "Home", href: "/home", icon: Home },

  { name: "Family", href: "/family", icon: Users },

  {
    name: "Medical Records",
    href: "/medical-record",
    icon: FileText,
  },

  // [Sidebar → Appointment Management]
  // Opens the dedicated appointment management page.
  {
    name: "Appointments",
    href: "/appointments",
    icon: CalendarDays,
  },

  { name: "Settings", href: "/settings", icon: Settings },
];

type SidebarProps = {
  familyId: string;
};

export default function Sidebar({
  familyId,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-white">
      {/* Application branding */}
      <div className="flex h-20 items-center border-b px-7">
        <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 font-bold text-teal-700">
          ♥
        </div>

        <span className="text-lg font-semibold text-slate-900">
          Family Health Vault
        </span>
      </div>

      {/* Main application navigation */}
      <nav className="flex-1 space-y-2 p-5">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          const href =
            item.href === "/home" || item.href === "/appointments"
              ? `${item.href}?familyId=${encodeURIComponent(familyId)}`
              : item.href;

          return (
            <Link
              key={item.href}
              href={href}
              className={`flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-medium transition ${
                active
                  ? "bg-teal-50 text-teal-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon size={20} />
              {item.name}
            </Link>
          );
        })}
      </nav>

    </aside>
  );
}