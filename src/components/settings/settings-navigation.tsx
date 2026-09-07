import Link from "next/link";
import {
  KeyRound,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";

export type SettingsSection =
  | "profile"
  | "security"
  | "privacy"
  | "account";

type SettingsNavigationProps = {
  activeSection: SettingsSection;
};

const sections = [
  {
    id: "profile" as const,
    label: "Profile",
    description: "Personal details",
    icon: UserRound,
  },
  {
    id: "security" as const,
    label: "Security",
    description: "Password and sessions",
    icon: KeyRound,
  },
  {
    id: "privacy" as const,
    label: "Privacy",
    description: "Families and sharing",
    icon: ShieldCheck,
  },
  {
    id: "account" as const,
    label: "Account",
    description: "Account information",
    icon: Trash2,
  },
];

export default function SettingsNavigation({
  activeSection,
}: SettingsNavigationProps) {
  return (
    <nav
      aria-label="Settings sections"
      className="flex gap-2 overflow-x-auto lg:block lg:space-y-2"
    >
      {sections.map((section) => {
        const Icon = section.icon;
        const isActive = section.id === activeSection;

        return (
          <Link
            key={section.id}
            href={`/settings?section=${section.id}`}
            aria-current={isActive ? "page" : undefined}
            className={`flex min-w-44 items-center gap-3 rounded-xl px-4 py-3 transition lg:min-w-0 ${
              isActive
                ? "bg-teal-50 text-teal-800"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
            }`}
          >
            <Icon size={19} aria-hidden="true" />
            <span>
              <span className="block text-sm font-semibold">
                {section.label}
              </span>
              <span className="block text-xs opacity-75">
                {section.description}
              </span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
