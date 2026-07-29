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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "employee") {
    redirect("/admin/dashboard");
  }
return (
  <div className="flex h-screen">
    <EmployeeSidebar />

    <div className="flex-1 overflow-auto bg-gray-100">
      <EmployeeHeader />

      <main className="p-8">
        {children}
      </main>
    </div>
  </div>
);
}