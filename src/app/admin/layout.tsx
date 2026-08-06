import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

import AdminHeader from "@/components/layout/AdminHeader";
import AdminSidebar from "@/components/layout/AdminSidebar";

export default async function AdminLayout({
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
     if (!profile || profile.role !== "admin") {
    redirect("/employee/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-100">
      
      {/* Sidebar */}
      <AdminSidebar />

      {/* Right side */}
      <div className="min-h-screen md:ml-72">
        <AdminHeader />

        <main className="p-3 text-gray-900 sm:p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>

    </div>
  );
}