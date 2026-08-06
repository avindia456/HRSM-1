"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Search, UserCircle2, Menu } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Employee = {
  full_name: string | null;
  profile_photo_url: string | null;
};

export default function EmployeeHeader() {
  const supabase = createClient();

  const [employee, setEmployee] = useState<Employee | null>(null);

useEffect(() => {
  const getEmployee = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    console.log("User ID:", user?.id);

    if (!user) return;
 console.log("User Email:", user?.email);
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      
    .eq("email", user.email)
      .single();

    console.log("Employee:", data);
    console.log("Error:", JSON.stringify(error, null, 2));

    if (error) return;

    setEmployee(data);
  };

  getEmployee();
}, [supabase]);

  return (
    <header className="flex h-16 items-center justify-between rounded-xl bg-white px-4 sm:px-6 shadow-sm">
      {/* Mobile: hamburger toggles sidebar */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            const el = document.getElementById("employee-sidebar");
            if (!el) return;
            el.classList.toggle("-translate-x-full");
          }}
          className="mr-2 inline-flex items-center justify-center rounded-md p-2 hover:bg-gray-100 md:hidden"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>

        {/* Search */}
      </div>
      <div className="relative w-full max-w-md">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />

        <input
          type="text"
          placeholder="Search..."
          className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 outline-none focus:border-violet-500"
        />
      </div>

      {/* Employee */}
      <div className="flex items-center gap-3">
        {employee?.profile_photo_url ? (
          <Image
            src={employee.profile_photo_url}
            alt={employee.full_name ?? "Employee"}
            width={40}
            height={40}
            className="rounded-full object-cover"
          />
        ) : (
          <UserCircle2 size={34} className="text-violet-700" />
        )}

        <div>
          <p className="text-gray-900 font-semibold">
            {employee?.full_name || "Employee"}
          </p>

          <p className="text-sm text-gray-500">Employee Portal</p>
        </div>
      </div>
    </header>
  );
}