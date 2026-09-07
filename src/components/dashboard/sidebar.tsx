"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Home,
  Users,
  FileText,
  CalendarDays,
  Activity,
  Settings,
  LogOut,
} from "lucide-react";

type SidebarProps = {
  familyId: string;
  familyName?: string;
  familyRole?: "OWNER" | "MEMBER";
  memberCount?: number;
};

export default function Sidebar({
  familyId,
  familyName,
  familyRole,
  memberCount,
}: SidebarProps) {
  const pathname = usePathname();
  const navigation = [
    {
      name: "Overview",
      href: `/home?familyId=${encodeURIComponent(familyId)}`,
      activePath: "/home",
      icon: Home,
    },
    {
      name: "Family members",
      href: `/family/${familyId}`,
      activePath: "/family",
      icon: Users,
    },
    {
      name: "Medical records",
      href: `/medical-record?familyId=${encodeURIComponent(familyId)}`,
      activePath: "/medical-record",
      icon: FileText,
    },
    {
      name: "Appointments",
      href: `/appointments?familyId=${encodeURIComponent(familyId)}`,
      activePath: "/appointments",
      icon: CalendarDays,
    },
    {
      name: "Health trends",
      href: `/health-trends?familyId=${encodeURIComponent(familyId)}&range=30`,
      activePath: "/health-trends",
      icon: Activity,
    },
    {
      name: "Settings",
      href: `/settings?familyId=${encodeURIComponent(familyId)}`,
      activePath: "/settings",
      icon: Settings,
    },
  ];

  return (
    <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
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
          const active =
            item.activePath.length > 0 &&
            pathname.startsWith(item.activePath);

          return (
            <Link
              key={item.name}
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

      {familyName && (
        <div className="m-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-700">
              {familyName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">
                {familyName}
              </p>
              <p className="text-xs text-slate-500">
                {memberCount ?? 0} {(memberCount ?? 0) === 1 ? "member" : "members"}
                {familyRole ? ` · ${familyRole === "OWNER" ? "Owner" : "Member"}` : ""}
              </p>
            </div>
          </div>
          <Link
            href="/family"
            className="mt-3 inline-flex text-xs font-semibold text-teal-700 hover:text-teal-800"
          >
            Switch family ›
          </Link>
        </div>
      )}

      <div className="border-t border-slate-200 p-4">
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/signin" })}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-red-50 hover:text-red-700"
        >
          <LogOut size={18} aria-hidden="true" />
          Log out
        </button>
      </div>
    </aside>
  );
}