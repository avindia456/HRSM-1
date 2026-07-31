"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Clock3,
  House,
  CalendarDays,
  Wallet,
  User,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { TrendingUp } from "lucide-react";

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
      <div className="border-b border-violet-500 p-6">
        <h1 className="text-2xl font-bold">AV INDIA HRMS</h1>
      </div>

      <nav className="flex-1 space-y-2 p-4">
        {menu.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 transition ${
                pathname === item.href
                  ? "bg-white text-violet-700"
                  : "hover:bg-violet-600"
              }`}
            >
              <Icon size={20} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={handleLogout}
        className="m-4 flex items-center justify-center gap-3 rounded-lg bg-red-500 px-4 py-3 transition hover:bg-red-600"
      >
        <LogOut size={20} />
        Logout
      </button>
    </aside>
  );
}