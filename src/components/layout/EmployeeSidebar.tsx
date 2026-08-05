"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  House,
  CalendarDays,
  Wallet,
  User,
  LogOut,
  TrendingUp,
  KeyRound,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

const menu = [
  {
    name: "Dashboard",
    href: "/employee/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Work From Home",
    href: "/employee/work-from-home",
    icon: House,
  },
  {
    name: "Leave",
    href: "/employee/leave",
    icon: CalendarDays,
  },
  {
    name: "Payroll",
    href: "/employee/payroll",
    icon: Wallet,
  },
  {
    name: "Sales Performance",
    href: "/employee/sales-performance",
    icon: TrendingUp,
  },
  {
    name: "Profile",
    href: "/employee/profile",
    icon: User,
  },
  {
    name: "Change Password",
    href: "/employee/change-password",
    icon: KeyRound,
  },
];

export default function EmployeeSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const supabase = createClient();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert(error.message);
      return;
    }

    router.replace("/");
    router.refresh();
  };

  return (
    <aside className="flex h-screen w-72 flex-col bg-violet-700 text-white">
      {/* LOGO */}
      <div className="border-b border-violet-500 p-6">
        <h1 className="text-2xl font-bold">
          AV INDIA HRMS
        </h1>
      </div>

      {/* MENU */}
      <nav className="flex-1 space-y-2 overflow-y-auto p-4">
        {menu.map((item) => {
          const Icon = item.icon;

          const isActive =
            pathname === item.href ||
            pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 transition ${
                isActive
                  ? "bg-white font-semibold text-violet-700"
                  : "hover:bg-violet-600"
              }`}
            >
              <Icon size={20} />

              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* LOGOUT */}
      <div className="border-t border-violet-500 p-4">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-3 rounded-lg bg-red-500 px-4 py-3 transition hover:bg-red-600"
        >
          <LogOut size={20} />

          Logout
        </button>
      </div>
    </aside>
  );
}