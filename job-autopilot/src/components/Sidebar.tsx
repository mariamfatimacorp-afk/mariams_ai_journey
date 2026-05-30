"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { clsx } from "clsx";

const NAV = [
  { href: "/dashboard", label: "Review Queue", icon: "📥" },
  { href: "/dashboard/applications", label: "Applications", icon: "📋" },
  { href: "/dashboard/profile", label: "Profile & Resume", icon: "👤" },
  { href: "/dashboard/settings", label: "Job Preferences", icon: "⚙️" },
];

export default function Sidebar({ userName }: { userName: string }) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-white border-r border-slate-200 flex flex-col">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🚀</span>
          <div>
            <div className="font-bold text-slate-900 text-sm">Job Autopilot</div>
            <div className="text-xs text-slate-400">Hi, {userName}</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ href, label, icon }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition",
              pathname === href
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <span>{icon}</span>
            {label}
          </Link>
        ))}
      </nav>

      {/* Sign out */}
      <div className="px-3 pb-5">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition"
        >
          <span>🚪</span> Sign Out
        </button>
      </div>
    </aside>
  );
}
