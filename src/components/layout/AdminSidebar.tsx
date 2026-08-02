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
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { TrendingUp } from "lucide-react";
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
  name: "Sales Performance",
  href: "/admin/sales-performance",
  icon: TrendingUp,
}
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
    <aside className="fixed left-0 top-0 z-50 flex h-screen w-72 flex-col bg-violet-700 text-white">
      {/* Logo */}
      <div className="border-b border-violet-500 p-6">
        <h1 className="text-2xl font-bold">AV INDIA HRMS</h1>
      </div>

      {/* Menu */}
      <nav className="flex-1 space-y-2 p-4">
        {menu.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-all duration-200 ${
                pathname === item.href
                  ? "bg-white text-violet-700 font-semibold"
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
      <div className="p-4">
        <button
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