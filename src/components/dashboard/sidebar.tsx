"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  FileText,
  Settings,
  UserCircle,
} from "lucide-react";

// Dashboard navigation used by /home and future application pages.
const navigation = [
  { name: "Home", href: "/home", icon: Home },
  { name: "Family", href: "/family", icon: Users },
  {
    name: "Medical Records",
    href: "/medical-record",
    icon: FileText,
  },
  { name: "Settings", href: "/settings", icon: Settings },
];

type SidebarProps = {
  userName: string;
};

export default function Sidebar({ userName }: SidebarProps) {
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

          return (
            <Link
              key={item.href}
              href={item.href}
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

      {/* Profile entry points to the future /profile page */}
      <div className="border-t p-5">
        <Link
          href="/profile"
          className="flex items-center gap-3 rounded-xl p-2 hover:bg-slate-50"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 font-semibold text-teal-700">
            {userName.charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-900">
              {userName}
            </p>

            <p className="text-xs text-slate-500">View profile</p>
          </div>

          <UserCircle className="ml-auto text-slate-400" size={18} />
        </Link>
      </div>
    </aside>
  );
}