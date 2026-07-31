"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { UserCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type AdminData = {
  full_name: string | null;
  designation: string | null;
  profile_photo_url: string | null;
};

export default function AdminHeader() {
  const supabase = createClient();

  const [admin, setAdmin] = useState<AdminData | null>(null);

  useEffect(() => {
    const getAdmin = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;
console.log("Logged in Email:", user.email);
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

  return (
    <header className="flex h-16 items-center justify-end rounded-xl bg-white px-6 shadow-sm">
      <div className="flex items-center gap-3">
        {admin?.profile_photo_url ? (
          <Image
            src={admin.profile_photo_url}
            alt={admin.full_name ?? "Admin"}
            width={42}
            height={42}
            className="rounded-full object-cover border border-gray-300"
          />
        ) : (
          <UserCircle2 size={40} className="text-violet-700" />
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