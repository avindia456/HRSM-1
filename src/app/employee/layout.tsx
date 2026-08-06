import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

import EmployeeHeader from "@/components/layout/EmployeeHeader";
import EmployeeSidebar from "@/components/layout/EmployeeSidebar";

export default async function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // =========================================================
  // GET LOGGED IN USER
  // =========================================================

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // =========================================================
  // CHECK ROLE
  // =========================================================

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "employee") {
    redirect("/admin/dashboard");
  }

  // =========================================================
  // LAYOUT
  // =========================================================

  return (
    <div className="min-h-screen bg-gray-100">
      {/* SIDEBAR */}
      <EmployeeSidebar />

      {/* RIGHT SIDE */}
      <div className="min-h-screen min-w-0 md:ml-72">
        {/* HEADER */}
        <EmployeeHeader />

        {/* PAGE CONTENT */}
        <main className="w-full p-3 text-gray-900 sm:p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}