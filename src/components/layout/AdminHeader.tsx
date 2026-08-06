"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { UserCircle2, Menu } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type AdminData = {
  full_name: string | null;
  designation: string | null;
  profile_photo_url: string | null;
};

export default function AdminHeader() {
  const [admin, setAdmin] = useState<AdminData | null>(null);

  useEffect(() => {
    const getAdmin = async () => {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("employees")
        .select("full_name, designation, profile_photo_url")
        .eq("email", user.email)
        .single();

      if (error) {
        console.error("Admin Error:", error);
        return;
      }

      setAdmin(data);
    };

    getAdmin();
  }, []);

  const toggleSidebar = () => {
    const sidebar = document.getElementById("admin-sidebar");

    if (!sidebar) return;

    sidebar.classList.toggle("-translate-x-full");
  };

  return (
    <header className="flex h-20 w-full items-center justify-between border-b border-gray-200 bg-white px-6 shadow-sm">
      
      {/* Mobile menu button */}
      <button
        type="button"
        onClick={toggleSidebar}
        className="inline-flex items-center justify-center rounded-md p-2 hover:bg-gray-100 md:hidden"
        aria-label="Toggle sidebar"
      >
        <Menu size={24} />
      </button>

      {/* Keeps admin info on right on desktop */}
      <div className="hidden md:block" />

      {/* Admin info */}
      <div className="flex items-center gap-3">
        {admin?.profile_photo_url ? (
          <Image
            src={admin.profile_photo_url}
            alt={admin.full_name ?? "Admin"}
            width={42}
            height={42}
            className="h-11 w-11 rounded-full border border-gray-300 object-cover"
          />
        ) : (
          <UserCircle2
            size={42}
            className="text-violet-700"
          />
        )}

        <div className="text-right">
          <p className="text-lg font-semibold text-gray-900">
            {admin?.full_name || "Admin"}
          </p>

          <p className="text-sm text-gray-500">
            {admin?.designation || "Administrator"}
          </p>
        </div>
      </div>
    </header>
  );
}