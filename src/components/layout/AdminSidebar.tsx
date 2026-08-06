"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Clock3,
  House,
  CalendarDays,
  Wallet,
  LogOut,
  TrendingUp,
  KeyRound,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

const menu = [
  {
    name: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Employees",
    href: "/admin/employees",
    icon: Users,
  },
  {
    name: "Attendance",
    href: "/admin/attendance",
    icon: Clock3,
  },
  {
    name: "Work From Home",
    href: "/admin/work-from-home",
    icon: House,
  },
  {
    name: "Leave",
    href: "/admin/leave",
    icon: CalendarDays,
  },
  {
    name: "Payroll",
    href: "/admin/payroll",
    icon: Wallet,
  },
  {
    name: "Daily Activity Report",
    href: "/admin/dar",
    icon: Wallet,
  },
  {
    name: "Sales Performance",
    href: "/admin/sales-performance",
    icon: TrendingUp,
  },
  {
    name: "Change Password",
    href: "/admin/change-password",
    icon: KeyRound,
  },
];

export default function AdminSidebar() {
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
    <aside
      id="admin-sidebar"
      className="fixed inset-y-0 left-0 z-50 w-72 -translate-x-full overflow-y-auto bg-violet-700 text-white transition-transform duration-200 md:translate-x-0"
    >
      {/* Logo */}
      <div className="border-b border-violet-500 p-6">
        <h1 className="text-2xl font-bold">
          AV INDIA HRMS
        </h1>
      </div>

      {/* Menu */}
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
              className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-all duration-200 ${
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

      {/* Logout */}
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