"use client";

import Link from "next/link";
import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  LayoutDashboard,
  House,
  CalendarDays,
  Wallet,
  User,
  LogOut,
  TrendingUp,
  KeyRound,
  X,
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
    name: "Daily Activity Report",
    href: "/employee/dar",
    icon: TrendingUp,
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

  // =========================================================
  // CLOSE SIDEBAR - MOBILE
  // =========================================================

  const closeSidebar = () => {
    const sidebar =
      document.getElementById(
        "employee-sidebar"
      );

    if (!sidebar) return;

    sidebar.classList.add(
      "-translate-x-full"
    );
  };

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = async () => {
    const { error } =
      await supabase.auth.signOut();

    if (error) {
      alert(error.message);
      return;
    }

    router.replace("/");
    router.refresh();
  };

  return (
    <aside
      id="employee-sidebar"
      className="
        fixed
        inset-y-0
        left-0
        z-50
        flex
        h-screen
        w-72
        -translate-x-full
        flex-col
        bg-violet-700
        text-white
        shadow-xl
        transition-transform
        duration-200
        md:translate-x-0
      "
    >
      {/* =================================================== */}
      {/* LOGO */}
      {/* =================================================== */}

      <div className="flex h-24 shrink-0 items-center justify-between border-b border-violet-600 px-6">
        <h1 className="text-2xl font-bold tracking-wide">
          AV INDIA HRMS
        </h1>

        {/* MOBILE CLOSE */}

        <button
          type="button"
          onClick={closeSidebar}
          className="inline-flex items-center justify-center rounded-lg p-2 transition hover:bg-violet-800 md:hidden"
          aria-label="Close sidebar"
        >
          <X size={22} />
        </button>
      </div>

      {/* =================================================== */}
      {/* MENU */}
      {/* =================================================== */}

      <nav className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
        <div className="space-y-2">
          {menu.map((item) => {
            const Icon = item.icon;

            const isActive =
              pathname === item.href ||
              pathname.startsWith(
                `${item.href}/`
              );

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeSidebar}
                className={`
                  flex
                  items-center
                  gap-3
                  rounded-xl
                  px-4
                  py-3
                  text-[15px]
                  transition
                  ${
                    isActive
                      ? "bg-white font-semibold text-violet-700 shadow-sm"
                      : "text-white hover:bg-violet-600"
                  }
                `}
              >
                <Icon
                  size={20}
                  className="shrink-0"
                />

                <span>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* =================================================== */}
      {/* LOGOUT */}
      {/* =================================================== */}

      <div className="shrink-0 border-t border-violet-600 p-4">
        <button
          type="button"
          onClick={handleLogout}
          className="
            flex
            w-full
            items-center
            justify-center
            gap-3
            rounded-xl
            bg-red-600
            px-4
            py-3
            font-semibold
            text-white
            transition
            hover:bg-red-700
          "
        >
          <LogOut size={20} />

          Logout
        </button>
      </div>
    </aside>
  );
}